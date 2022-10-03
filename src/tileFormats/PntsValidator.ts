// This was, to some extent, "ported" (or at least "inspired") from
// https://github.com/CesiumGS/3d-tiles-validator/blob/e84202480eb6572383008076150c8e52c99af3c3/validator/lib/validatePnts.js

// TODO This is still pretty messy. The legacy JSON validation should
// be replaced, and the class as a whole should be cleaned up.
// It has to be decided which messages cause an "early bailout"
// (i.e. which ones should cause the validation to end)
// The part for validating the magic/version/.../alignment in all
// content validators is redundant, and redundancy is redundant.

import { defined } from "../base/defined";
import { defaultValue } from "../base/defaultValue";
import { bufferToJson } from "../base/bufferToJson";

import { ValidationContext } from "../validation/ValidationContext";
import { Validator } from "../validation/Validator";

import { IoValidationIssues } from "../issues/IoValidationIssue";
import { BinaryValidationIssues } from "../issues/BinaryValidationIssues";
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
 */
export class PntsValidator implements Validator<Buffer> {
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

    if (magic !== "pnts") {
      const issue = BinaryValidationIssues.BINARY_INVALID_VALUE(
        this._uri,
        "magic",
        "pnts",
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

    const featureTableJsonByteOffset = headerByteLength;
    const featureTableBinaryByteOffset =
      featureTableJsonByteOffset + featureTableJsonByteLength;
    const batchTableJsonByteOffset =
      featureTableBinaryByteOffset + featureTableBinaryByteLength;
    const batchTableBinaryByteOffset =
      batchTableJsonByteOffset + batchTableJsonByteLength;

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

    const computedByteLength =
      headerByteLength +
      featureTableJsonByteLength +
      featureTableBinaryByteLength +
      batchTableJsonByteLength +
      batchTableBinaryByteLength;
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
      byteLength
    );

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

    const batchLength = defaultValue(featureTableJson.BATCH_LENGTH, 0);
    const pointsLength = featureTableJson.POINTS_LENGTH;
    if (!defined(pointsLength)) {
      const message = "Feature table must contain a POINTS_LENGTH property.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      result = false;
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

    if (
      defined(featureTableJson.BATCH_ID) &&
      !defined(featureTableJson.BATCH_LENGTH)
    ) {
      const message =
        "Feature table property BATCH_LENGTH is required when BATCH_ID is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (
      !defined(featureTableJson.BATCH_ID) &&
      defined(featureTableJson.BATCH_LENGTH)
    ) {
      const message =
        "Feature table property BATCH_ID is required when BATCH_LENGTH is present.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      result = false;
    }

    if (batchLength > pointsLength) {
      const message =
        "Feature table property BATCH_LENGTH must be less than or equal to POINTS_LENGTH.";
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
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
              const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
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
        this._uri,
        featureTableMessage!
      );
      context.addIssue(issue);
      result = false;
    }

    const batchTableMessage = validateBatchTable(
      batchTableJson,
      batchTableBinary,
      pointsLength
    );
    if (defined(batchTableMessage)) {
      const issue = ContentValidationIssues.CONTENT_JSON_INVALID(
        this._uri,
        batchTableMessage!
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
