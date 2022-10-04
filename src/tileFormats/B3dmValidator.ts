// This was, to some extent, "ported" (or at least "inspired") from
// https://github.com/CesiumGS/3d-tiles-validator/blob/e84202480eb6572383008076150c8e52c99af3c3/validator/lib/validateB3dm.js
// It still contains legacy elements that may be cleaned up at some point.

import { defined } from "../base/defined";

import { ValidationContext } from "../validation/ValidationContext";
import { Validator } from "../validation/Validator";

import { GltfValidator } from "./GltfValidator";
import { TileFormatValidator } from "./TileFormatValidator";

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

    if (
      !TileFormatValidator.validateHeader(
        this._uri,
        input,
        headerByteLength,
        "b3dm",
        context
      )
    ) {
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
    const batchTableJsonByteLength = input.readUInt32LE(20);
    const batchTableBinaryByteLength = input.readUInt32LE(24);
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

    const binaryTableData = TileFormatValidator.extractBinaryTableData(
      this._uri,
      input,
      headerByteLength,
      true,
      context
    );
    if (!defined(binaryTableData)) {
      return false;
    }

    const featureTableJson = binaryTableData!.featureTableJson;
    const featureTableBinary = binaryTableData!.featureTableBinary;
    const batchTableJson = binaryTableData!.batchTableJson;
    const batchTableBinary = binaryTableData!.batchTableBinary;
    const glbData = binaryTableData!.glbData;

    const featuresLength = featureTableJson.BATCH_LENGTH;
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
    const result = await gltfValidator.validateObject(glbData, context);
    return result;
  }
}
