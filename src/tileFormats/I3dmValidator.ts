// This was, to some extent, "ported" (or at least "inspired") from
// https://github.com/CesiumGS/3d-tiles-validator/blob/e84202480eb6572383008076150c8e52c99af3c3/validator/lib/validateI3dm.js

// TODO This is still pretty messy. The legacy JSON validation should
// be replaced, and the class as a whole should be cleaned up.
// It has to be decided which messages cause an "early bailout"
// (i.e. which ones should cause the validation to end)
// The part for validating the magic/version/.../alignment in all
// content validators is redundant, and redundancy is redundant.

import { defined } from "../base/defined";
import { bufferToJson } from "../base/bufferToJson";

import { ValidationContext } from "../validation/ValidationContext";
import { Validator } from "../validation/Validator";

import { GltfValidator } from "./GltfValidator";

import { IoValidationIssues } from "../issues/IoValidationIssue";
import { BinaryValidationIssues } from "../issues/BinaryValidationIssues";
import { ContentValidationIssues } from "../issues/ContentValidationIssues";
import { validateFeatureTable } from "./legacy/validateFeatureTable";
import { validateBatchTable } from "./legacy/validateBatchTable";

const featureTableSemantics = {
  POSITION: {
    global: false,
    type: "VEC3",
    componentType: "FLOAT",
  },
  POSITION_QUANTIZED: {
    global: false,
    type: "VEC3",
    componentType: "UNSIGNED_SHORT",
  },
  NORMAL_UP: {
    global: false,
    type: "VEC3",
    componentType: "FLOAT",
  },
  NORMAL_RIGHT: {
    global: false,
    type: "VEC3",
    componentType: "FLOAT",
  },
  NORMAL_UP_OCT32P: {
    global: false,
    type: "VEC2",
    componentType: "UNSIGNED_SHORT",
  },
  NORMAL_RIGHT_OCT32P: {
    global: false,
    type: "VEC2",
    componentType: "UNSIGNED_SHORT",
  },
  SCALE: {
    global: false,
    type: "SCALAR",
    componentType: "FLOAT",
  },
  SCALE_NON_UNIFORM: {
    global: false,
    type: "VEC3",
    componentType: "FLOAT",
  },
  BATCH_ID: {
    global: false,
    type: "SCALAR",
    componentType: "UNSIGNED_SHORT",
    componentTypeOptions: ["UNSIGNED_BYTE", "UNSIGNED_SHORT", "UNSIGNED_INT"],
  },
  INSTANCES_LENGTH: {
    global: true,
    type: "SCALAR",
    componentType: "UNSIGNED_INT",
  },
  RTC_CENTER: {
    global: true,
    type: "VEC3",
    componentType: "FLOAT",
  },
  QUANTIZED_VOLUME_OFFSET: {
    global: true,
    type: "VEC3",
    componentType: "FLOAT",
  },
  QUANTIZED_VOLUME_SCALE: {
    global: true,
    type: "VEC3",
    componentType: "FLOAT",
  },
  EAST_NORTH_UP: {
    global: true,
    type: "boolean",
  },
};

/**
 * A class that can perform validation of I3DM data that is
 * given as a Buffer.
 */
export class I3dmValidator implements Validator<Buffer> {
  private _uri: string;

  constructor(uri: string) {
    this._uri = uri;
  }

  async validateObject(
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    // Create a new context to collect the issues that are
    // found in the data. If there are issues, then they
    // will be stored as the 'internal issues' of a
    // single content validation issue.
    const derivedContext = context.derive(".");
    const result = await this.validateObjectInternal(input, derivedContext);
    const derivedResult = derivedContext.getResult();
    const issue = ContentValidationIssues.createFrom(this._uri, derivedResult);
    if (issue) {
      context.addIssue(issue);
    }
    return result;
  }

  async validateObjectInternal(
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const headerByteLength = 32;
    if (input.length < headerByteLength) {
      const message =
        `The input must have at least ${headerByteLength} bytes, ` +
        `but only has ${input.length} bytes`;
      const issue = BinaryValidationIssues.BINARY_INVALID(this._uri, message);
      context.addIssue(issue);
      return false;
    }

    const magic = input.toString("utf8", 0, 4);
    const version = input.readUInt32LE(4);
    const byteLength = input.readUInt32LE(8);
    const featureTableJsonByteLength = input.readUInt32LE(12);
    const featureTableBinaryByteLength = input.readUInt32LE(16);
    const batchTableJsonByteLength = input.readUInt32LE(20);
    const batchTableBinaryByteLength = input.readUInt32LE(24);
    const gltfFormat = input.readUInt32LE(28);

    if (magic !== "i3dm") {
      const issue = BinaryValidationIssues.BINARY_INVALID_VALUE(
        this._uri,
        "magic",
        "i3dm",
        magic
      );
      context.addIssue(issue);
      return false;
    }

    if (version !== 1) {
      const issue = BinaryValidationIssues.BINARY_INVALID_VALUE(
        this._uri,
        "version",
        1,
        version
      );
      context.addIssue(issue);
      return false;
    }

    if (byteLength !== input.length) {
      const issue = BinaryValidationIssues.BINARY_INVALID_LENGTH(
        this._uri,
        "content",
        byteLength,
        input.length
      );
      context.addIssue(issue);
      return false;
    }

    if (gltfFormat > 1) {
      const issue = BinaryValidationIssues.BINARY_INVALID_VALUE(
        this._uri,
        "gltfFormat",
        "<=1",
        gltfFormat
      );
      context.addIssue(issue);
      return false;
    }

    const featureTableJsonByteOffset = headerByteLength;
    const featureTableBinaryByteOffset =
      featureTableJsonByteOffset + featureTableJsonByteLength;
    const batchTableJsonByteOffset =
      featureTableBinaryByteOffset + featureTableBinaryByteLength;
    const batchTableBinaryByteOffset =
      batchTableJsonByteOffset + batchTableJsonByteLength;
    const glbByteOffset =
      batchTableBinaryByteOffset + batchTableBinaryByteLength;
    let glbByteLength = Math.max(byteLength - glbByteOffset, 0);

    if (featureTableBinaryByteOffset % 8 > 0) {
      const issue = BinaryValidationIssues.BINARY_INVALID_ALIGNMENT_legacy(
        this._uri,
        "feature table binary",
        8
      );
      context.addIssue(issue);
      return false;
    }

    if (batchTableBinaryByteOffset % 8 > 0) {
      const issue = BinaryValidationIssues.BINARY_INVALID_ALIGNMENT_legacy(
        this._uri,
        "batch table binary",
        8
      );
      context.addIssue(issue);
      return false;
    }

    const embeddedGlb = gltfFormat === 1;
    if (embeddedGlb && glbByteOffset % 8 > 0) {
      const issue = BinaryValidationIssues.BINARY_INVALID_ALIGNMENT_legacy(
        this._uri,
        "GLB data",
        8
      );
      context.addIssue(issue);
      return false;
    }

    const computedByteLength =
      headerByteLength +
      featureTableJsonByteLength +
      featureTableBinaryByteLength +
      batchTableJsonByteLength +
      batchTableBinaryByteLength +
      glbByteLength;
    if (computedByteLength > byteLength) {
      const issue = BinaryValidationIssues.BINARY_INVALID_LENGTH(
        this._uri,
        "header, feature table, batch table, and GLB",
        byteLength,
        computedByteLength
      );
      context.addIssue(issue);
      return false;
    }

    const featureTableJsonBuffer = input.slice(
      featureTableJsonByteOffset,
      featureTableBinaryByteOffset
    );
    const featureTableBinary = input.slice(
      featureTableBinaryByteOffset,
      batchTableJsonByteOffset
    );
    const batchTableJsonBuffer = input.slice(
      batchTableJsonByteOffset,
      batchTableBinaryByteOffset
    );
    const batchTableBinary = input.slice(
      batchTableBinaryByteOffset,
      glbByteOffset
    );

    glbByteLength = embeddedGlb
      ? input.readUInt32LE(glbByteOffset + 8)
      : glbByteLength;
    const glb = input.slice(glbByteOffset, glbByteOffset + glbByteLength);

    let featureTableJson: any;
    let batchTableJson: any;

    try {
      featureTableJson = bufferToJson(featureTableJsonBuffer);
    } catch (error) {
      const message = `Could not parse feature table JSON: ${error}`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      return false;
    }

    try {
      batchTableJson = bufferToJson(batchTableJsonBuffer);
    } catch (error) {
      const message = `Could not parse batch table JSON: ${error}`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      return false;
    }

    let result = true;

    const featuresLength = featureTableJson!.INSTANCES_LENGTH;
    if (!defined(featuresLength)) {
      const message = `Feature table must contain a INSTANCES_LENGTH property.`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
    }

    if (
      !defined(featureTableJson.POSITION) &&
      !defined(featureTableJson.POSITION_QUANTIZED)
    ) {
      const message =
        "Feature table must contain either the POSITION or POSITION_QUANTIZED property.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (
      defined(featureTableJson.NORMAL_UP) &&
      !defined(featureTableJson.NORMAL_RIGHT)
    ) {
      const message =
        "Feature table property NORMAL_RIGHT is required when NORMAL_UP is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (
      !defined(featureTableJson.NORMAL_UP) &&
      defined(featureTableJson.NORMAL_RIGHT)
    ) {
      const message =
        "Feature table property NORMAL_UP is required when NORMAL_RIGHT is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (
      defined(featureTableJson.NORMAL_UP_OCT32P) &&
      !defined(featureTableJson.NORMAL_RIGHT_OCT32P)
    ) {
      const message =
        "Feature table property NORMAL_RIGHT_OCT32P is required when NORMAL_UP_OCT32P is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (
      !defined(featureTableJson.NORMAL_UP_OCT32P) &&
      defined(featureTableJson.NORMAL_RIGHT_OCT32P)
    ) {
      const message =
        "Feature table property NORMAL_UP_OCT32P is required when NORMAL_RIGHT_OCT32P is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (
      defined(featureTableJson.POSITION_QUANTIZED) &&
      (!defined(featureTableJson.QUANTIZED_VOLUME_OFFSET) ||
        !defined(featureTableJson.QUANTIZED_VOLUME_SCALE))
    ) {
      const message =
        "Feature table properties QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE are required when POSITION_QUANTIZED is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      result = false;
    }

    const featureTableMessage = validateFeatureTable(
      featureTableJson,
      featureTableBinary,
      featuresLength,
      featureTableSemantics
    );
    if (defined(featureTableMessage)) {
      const issue = ContentValidationIssues.CONTENT_JSON_INVALID(
        this._uri,
        featureTableMessage!
      );
      context.addIssue(issue);
      result = false;
    }

    const batchTableMessage = validateBatchTable(
      batchTableJson,
      batchTableBinary,
      featuresLength
    );
    if (defined(batchTableMessage)) {
      const issue = ContentValidationIssues.CONTENT_JSON_INVALID(
        this._uri,
        batchTableMessage!
      );
      context.addIssue(issue);
      result = false;
    }

    // If the GLB data was embdedded, validate it directly
    if (embeddedGlb) {
      const gltfValidator = new GltfValidator(this._uri);
      const gltfResult = await gltfValidator.validateObject(glb, context);
      if (!gltfResult) {
        result = false;
      }
    } else {
      // The GLB data was a URI. Create the URI from the buffer, and remove
      // any zero-bytes from the string that may be introduced by padding
      const glbUri = glb.toString().replace(/\0/g, "");
      const resourceResolver = context.getResourceResolver();
      const glbData = await resourceResolver.resolve(glbUri);
      if (!defined(glbData)) {
        const message = `Could not resolve GLB URI ${glbUri} from I3DM`;
        const issue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
          this._uri,
          message
        );
        context.addIssue(issue);
        result = false;
      } else {
        const gltfValidator = new GltfValidator(this._uri);
        const gltfResult = await gltfValidator.validateObject(
          glbData!,
          context
        );
        if (!gltfResult) {
          result = false;
        }
      }
    }

    return result;
  }
}
