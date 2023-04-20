// This was, to some extent, "ported" (or at least "inspired") from
// https://github.com/CesiumGS/3d-tiles-validator/blob/e84202480eb6572383008076150c8e52c99af3c3/validator/lib/validateI3dm.js
// It still contains legacy elements that may be cleaned up at some point.

import path from "path";

import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../validation/ValidationContext";
import { Validator } from "../validation/Validator";

import { GltfValidator } from "./GltfValidator";
import { TileFormatValidator } from "./TileFormatValidator";

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
 *
 * @internal
 */
export class I3dmValidator implements Validator<Buffer> {
  async validateObject(
    uri: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const headerByteLength = 32;

    if (
      !TileFormatValidator.validateHeader(
        uri,
        input,
        headerByteLength,
        "i3dm",
        context
      )
    ) {
      return false;
    }

    const gltfFormat = input.readUInt32LE(28);

    if (gltfFormat > 1) {
      const issue = BinaryValidationIssues.BINARY_INVALID_VALUE(
        uri,
        "gltfFormat",
        "<=1",
        gltfFormat
      );
      context.addIssue(issue);
      return false;
    }
    const hasEmbeddedGlb = gltfFormat === 1;

    const binaryTableData = TileFormatValidator.extractBinaryTableData(
      uri,
      input,
      headerByteLength,
      hasEmbeddedGlb,
      context
    );
    if (!defined(binaryTableData)) {
      return false;
    }

    const featureTableJson = binaryTableData.featureTableJson;
    const featureTableBinary = binaryTableData.featureTableBinary;
    const batchTableJson = binaryTableData.batchTableJson;
    const batchTableBinary = binaryTableData.batchTableBinary;
    const glbData = binaryTableData.glbData;

    let result = true;

    const featuresLength = featureTableJson.INSTANCES_LENGTH;
    if (!defined(featuresLength)) {
      const message = `Feature table must contain a INSTANCES_LENGTH property.`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(uri, message);
      context.addIssue(issue);
    }

    if (
      !defined(featureTableJson.POSITION) &&
      !defined(featureTableJson.POSITION_QUANTIZED)
    ) {
      const message =
        "Feature table must contain either the POSITION or POSITION_QUANTIZED property.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (
      defined(featureTableJson.NORMAL_UP) &&
      !defined(featureTableJson.NORMAL_RIGHT)
    ) {
      const message =
        "Feature table property NORMAL_RIGHT is required when NORMAL_UP is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (
      !defined(featureTableJson.NORMAL_UP) &&
      defined(featureTableJson.NORMAL_RIGHT)
    ) {
      const message =
        "Feature table property NORMAL_UP is required when NORMAL_RIGHT is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (
      defined(featureTableJson.NORMAL_UP_OCT32P) &&
      !defined(featureTableJson.NORMAL_RIGHT_OCT32P)
    ) {
      const message =
        "Feature table property NORMAL_RIGHT_OCT32P is required when NORMAL_UP_OCT32P is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (
      !defined(featureTableJson.NORMAL_UP_OCT32P) &&
      defined(featureTableJson.NORMAL_RIGHT_OCT32P)
    ) {
      const message =
        "Feature table property NORMAL_UP_OCT32P is required when NORMAL_RIGHT_OCT32P is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(uri, message);
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
      const issue = IoValidationIssues.JSON_PARSE_ERROR(uri, message);
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
        uri,
        featureTableMessage
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
        uri,
        batchTableMessage
      );
      context.addIssue(issue);
      result = false;
    }

    // If the GLB data was embdedded, validate it directly
    if (hasEmbeddedGlb) {
      const gltfValidator = new GltfValidator();
      const gltfResult = await gltfValidator.validateObject(
        uri,
        glbData,
        context
      );
      if (!gltfResult) {
        result = false;
      }
    } else {
      // The GLB data was a URI. Create the URI from the buffer, and remove
      // any zero-bytes from the string that may be introduced by padding
      const glbUri = glbData.toString().replace(/\0/g, "");
      const resourceResolver = context.getResourceResolver();
      const resolvedGlbData = await resourceResolver.resolveData(glbUri);
      if (!defined(resolvedGlbData)) {
        const message = `Could not resolve GLB URI ${glbUri} from I3DM`;
        const issue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
          uri,
          message
        );
        context.addIssue(issue);
        result = false;
      } else {
        // Create a new context to collect the issues that are
        // found in the data. If there are issues, then they
        // will be stored as the 'internal issues' of a
        // single content validation issue.
        const glbDirectory = path.dirname(glbUri);
        const derivedContext = context.deriveFromUri(glbDirectory);
        const gltfValidator = new GltfValidator();
        const gltfResult = await gltfValidator.validateObject(
          uri,
          resolvedGlbData,
          derivedContext
        );
        if (!gltfResult) {
          result = false;
        }
        const derivedResult = derivedContext.getResult();
        const issue = ContentValidationIssues.createForContent(
          uri,
          derivedResult
        );
        if (issue) {
          context.addIssue(issue);
        }
        return result;
      }
    }

    return result;
  }
}
