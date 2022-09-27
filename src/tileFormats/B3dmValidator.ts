// This was, to some extent, "ported" (or at least "inspired") from
// https://github.com/CesiumGS/3d-tiles-validator/blob/e84202480eb6572383008076150c8e52c99af3c3/validator/lib/validateB3dm.js

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
import { validateBatchTable } from "./legacy/validateBatchTable";
import { validateFeatureTable } from "./legacy/validateFeatureTable";

const featureTableSemantics = {
  BATCH_LENGTH: {
    global: true,
    type: "SCALAR",
    componentType: "UNSIGNED_INT",
  },
  RTC_CENTER: {
    global: true,
    type: "VEC3",
    componentType: "FLOAT",
  },
};
/**
 * A class that can perform validation of B3DM data that is
 * given as a Buffer.
 */
export class B3dmValidator implements Validator<Buffer> {
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
    const headerByteLength = 28;
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

    if (magic !== "b3dm") {
      const issue = BinaryValidationIssues.BINARY_INVALID_VALUE(
        this._uri,
        "magic",
        "b3dm",
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

    // Legacy header #1: [batchLength] [batchTableByteLength]
    // Legacy header #2: [batchTableJsonByteLength] [batchTableBinaryByteLength] [batchLength]
    // Current header: [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength]
    // If the header is in the first legacy format 'batchTableJsonByteLength' will
    // be the start of the JSON string (a quotation mark) or the glTF magic.
    // Accordingly its first byte will be either 0x22 or 0x67, and so the
    // minimum uint32 expected is 0x22000000 = 570425344 = 570MB. It is
    // unlikely that the batch table JSON will exceed this length.
    // The check for the second legacy format is similar, except it checks
    // 'batchTableBinaryByteLength' instead
    if (batchTableJsonByteLength >= 570425344) {
      const message =
        `Header is using the legacy format [batchLength] ` +
        `[batchTableByteLength]. The new format is ` +
        `[featureTableJsonByteLength] [featureTableBinaryByteLength] ` +
        `[batchTableJsonByteLength] [batchTableBinaryByteLength].`;
      const issue = BinaryValidationIssues.BINARY_INVALID(this._uri, message);
      context.addIssue(issue);
      return false;
    }
    if (batchTableBinaryByteLength >= 570425344) {
      const message =
        `Header is using the legacy format [batchTableJsonByteLength] ` +
        `[batchTableBinaryByteLength] [batchLength]. The new format is ` +
        `[featureTableJsonByteLength] [featureTableBinaryByteLength] ` +
        `[batchTableJsonByteLength] [batchTableBinaryByteLength].`;
      const issue = BinaryValidationIssues.BINARY_INVALID(this._uri, message);
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

    if (glbByteOffset % 8 > 0) {
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

    glbByteLength = input.readUInt32LE(glbByteOffset + 8);
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

    const featuresLength = featureTableJson!.BATCH_LENGTH;
    if (!defined(featuresLength)) {
      const message = `Feature table must contain a BATCH_LENGTH property.`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      return false;
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
      return false;
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
      return false;
    }

    const gltfValidator = new GltfValidator(this._uri);
    const result = await gltfValidator.validateObject(glb, context);
    return result;
  }
}
