// This was, to some extent, "ported" (or at least "inspired") from
// https://github.com/CesiumGS/3d-tiles-validator/blob/e84202480eb6572383008076150c8e52c99af3c3/validator/lib/validatePnts.js
// It still contains legacy elements that may be cleaned up at some point.

import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "../validation/ValidationContext";
import { Validator } from "../validation/Validator";

import { TileFormatValidator } from "./TileFormatValidator";

import { IoValidationIssues } from "../issues/IoValidationIssue";
import { ContentValidationIssues } from "../issues/ContentValidationIssues";
import { validateBatchTable } from "./legacy/validateBatchTable";
import { validateFeatureTable } from "./legacy/validateFeatureTable";

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
  RGBA: {
    global: false,
    type: "VEC4",
    componentType: "UNSIGNED_BYTE",
  },
  RGB: {
    global: false,
    type: "VEC3",
    componentType: "UNSIGNED_BYTE",
  },
  RGB565: {
    global: false,
    type: "SCALAR",
    componentType: "UNSIGNED_SHORT",
  },
  NORMAL: {
    global: false,
    type: "VEC3",
    componentType: "FLOAT",
  },
  NORMAL_OCT16P: {
    global: false,
    type: "VEC2",
    componentType: "UNSIGNED_BYTE",
  },
  BATCH_ID: {
    global: false,
    type: "SCALAR",
    componentType: "UNSIGNED_SHORT",
    componentTypeOptions: ["UNSIGNED_BYTE", "UNSIGNED_SHORT", "UNSIGNED_INT"],
  },
  POINTS_LENGTH: {
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
  CONSTANT_RGBA: {
    global: true,
    type: "VEC4",
    componentType: "UNSIGNED_BYTE",
  },
  BATCH_LENGTH: {
    global: true,
    type: "SCALAR",
    componentType: "UNSIGNED_INT",
  },
};

/**
 * A class that can perform validation of PNTS data that is
 * given as a Buffer.
 *
 * @internal
 */
export class PntsValidator implements Validator<Buffer> {
  async validateObject(
    uri: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const headerByteLength = 28;

    if (
      !TileFormatValidator.validateHeader(
        uri,
        input,
        headerByteLength,
        "pnts",
        context
      )
    ) {
      return false;
    }

    const binaryTableData = TileFormatValidator.extractBinaryTableData(
      uri,
      input,
      headerByteLength,
      false,
      context
    );
    if (!defined(binaryTableData)) {
      return false;
    }

    const featureTableJson = binaryTableData.featureTableJson;
    const featureTableBinary = binaryTableData.featureTableBinary;
    const batchTableJson = binaryTableData.batchTableJson;
    const batchTableBinary = binaryTableData.batchTableBinary;

    let result = true;

    const batchLength = defaultValue(featureTableJson.BATCH_LENGTH, 0);
    const pointsLength = featureTableJson.POINTS_LENGTH;
    if (!defined(pointsLength)) {
      const message = "Feature table must contain a POINTS_LENGTH property.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(uri, message);
      context.addIssue(issue);
      result = false;
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

    if (
      defined(featureTableJson.BATCH_ID) &&
      !defined(featureTableJson.BATCH_LENGTH)
    ) {
      const message =
        "Feature table property BATCH_LENGTH is required when BATCH_ID is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (
      !defined(featureTableJson.BATCH_ID) &&
      defined(featureTableJson.BATCH_LENGTH)
    ) {
      const message =
        "Feature table property BATCH_ID is required when BATCH_LENGTH is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (batchLength > pointsLength) {
      const message =
        "Feature table property BATCH_LENGTH must be less than or equal to POINTS_LENGTH.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (
      defined(featureTableJson.BATCH_ID) &&
      !hasDracoBatchIds(featureTableJson)
    ) {
      /* TODO Revive this part of the validation
        const featureTable = new Cesium3DTileFeatureTable(featureTableJson, featureTableBinary);
        featureTable.featuresLength = pointsLength;
        const componentDatatype = ComponentDatatype.fromName(defaultValue(featureTableJson.BATCH_ID.componentType, 'UNSIGNED_SHORT'));
        const batchIds = featureTable.getPropertyArray('BATCH_ID', componentDatatype, 1);
        const length = batchIds.length;
        for (let i = 0; i < length; i++) {
            if (batchIds[i] >= featureTableJson.BATCH_LENGTH) {
              const message = 'All the BATCH_IDs must have values less than feature table property BATCH_LENGTH.';
              const issue = IoValidationIssues.JSON_PARSE_ERROR(uri, message);
              context.addIssue(issue);
                    }
        }
        */
    }

    const featureTableMessage = validateFeatureTable(
      featureTableJson,
      featureTableBinary,
      pointsLength,
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

    // If the BATCH_ID semantic is defined, the Batch Table stores metadata
    // for each batchId, and the length of the Batch Table arrays will
    // equal BATCH_LENGTH. Otherwise, it will store per-point metadata,
    // and the length will be POINTS_LENGTH.
    let batchTableArraysLength = pointsLength;
    if (defined(featureTableJson.BATCH_ID)) {
      batchTableArraysLength = batchLength;
    }

    const batchTableMessage = validateBatchTable(
      batchTableJson,
      batchTableBinary,
      batchTableArraysLength
    );
    if (defined(batchTableMessage)) {
      const issue = ContentValidationIssues.CONTENT_JSON_INVALID(
        uri,
        batchTableMessage
      );
      context.addIssue(issue);
      result = false;
    }
    return result;
  }
}

function hasDracoBatchIds(featureTableJson: any) {
  const extensions = featureTableJson.extensions;
  if (defined(extensions)) {
    const dracoExtension = extensions["3DTILES_draco_point_compression"];
    if (defined(dracoExtension)) {
      return defined(dracoExtension.properties.BATCH_ID);
    }
  }
  return false;
}
