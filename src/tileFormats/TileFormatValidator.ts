import { Buffers } from "3d-tiles-tools";

import { ValidationContext } from "../validation/ValidationContext";

import { BinaryValidationIssues } from "../issues/BinaryValidationIssues";
import { IoValidationIssues } from "../issues/IoValidationIssue";

/**
 * An interface describing the table data that was read from
 * a tile content.
 *
 * @internal
 */
export interface BinaryTableData {
  featureTableJson: any;
  featureTableBinary: Buffer;
  batchTableJson: any;
  batchTableBinary: Buffer;
  glbData: Buffer;
}

/**
 * Methods to validate and extract the binary table data from
 * tile content.
 *
 * @internal
 */
export class TileFormatValidator {
  /**
   * Validates the common part of all tile format headers.
   *
   * This validates that the given input has at least the
   * given header byte length, and whether the 'magic',
   * and 'byteLength' fields of the header have the expected
   * values. (The 'version' is validated to always be '1')
   *
   * @param path - The path for `ValidationIssue` instances
   * @param input - The input buffer
   * @param headerByteLength - The header byte length
   * @param expectedMagic - The expected magic value
   * @param context - The `ValidationContext`
   * @returns Whether the header was valid
   */
  static validateHeader(
    path: string,
    input: Buffer,
    headerByteLength: number,
    expectedMagic: string,
    context: ValidationContext
  ) {
    if (input.length < headerByteLength) {
      const message =
        `The input must have at least ${headerByteLength} bytes, ` +
        `but only has ${input.length} bytes`;
      const issue = BinaryValidationIssues.BINARY_INVALID(path, message);
      context.addIssue(issue);
      return false;
    }

    const magic = input.toString("utf8", 0, 4);
    const version = input.readUInt32LE(4);
    const byteLength = input.readUInt32LE(8);

    if (magic !== expectedMagic) {
      const issue = BinaryValidationIssues.BINARY_INVALID_VALUE(
        path,
        "magic",
        expectedMagic,
        magic
      );
      context.addIssue(issue);
      return false;
    }

    if (version !== 1) {
      const issue = BinaryValidationIssues.BINARY_INVALID_VALUE(
        path,
        "version",
        1,
        version
      );
      context.addIssue(issue);
      return false;
    }

    if (byteLength !== input.length) {
      const issue = BinaryValidationIssues.BINARY_INVALID_LENGTH(
        path,
        "content",
        byteLength,
        input.length
      );
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Extracts the binary table data from the given tile content,
   * if it is valid.
   *
   * This is used for B3DM, I3DM and PNTS tile content.
   *
   * This assumes that the length of the given buffer has already
   * been validated to be sufficient for the respective header
   * data.
   *
   * It validates the feature- and batch table JSON- and binary
   * offsets, extracts the respective JSON- and binary data,
   * parses the JSON data, and returns the result.
   *
   * If any offset does not meet the alignment- or length
   * requirements from the specification, then the appropriate
   * validation issue will be added to the given context, and
   * `undefined` will be returned.
   *
   * Otherwise, a `BinaryTableData` object with the valid
   * JSON- and binary data will be returned.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param input - The input buffer
   * @param headerByteLength - The length of the tile format header
   * @param hasEmbeddedGlb - Whether the input is expected to have
   * embedded GLB data. This is `true` for B3DM, `false` for PNTS,
   * and `gltfFormat===1` for I3DM.
   * @param context - The `ValidationContext`
   * @returns The `BinaryTableData`
   */
  static extractBinaryTableData(
    path: string,
    input: Buffer,
    headerByteLength: number,
    hasEmbeddedGlb: boolean,
    context: ValidationContext
  ): BinaryTableData | undefined {
    const byteLength = input.readUInt32LE(8);
    const featureTableJsonByteLength = input.readUInt32LE(12);
    const featureTableBinaryByteLength = input.readUInt32LE(16);
    const batchTableJsonByteLength = input.readUInt32LE(20);
    const batchTableBinaryByteLength = input.readUInt32LE(24);

    const featureTableJsonByteOffset = headerByteLength;
    const featureTableBinaryByteOffset =
      featureTableJsonByteOffset + featureTableJsonByteLength;
    const batchTableJsonByteOffset =
      featureTableBinaryByteOffset + featureTableBinaryByteLength;
    const batchTableBinaryByteOffset =
      batchTableJsonByteOffset + batchTableJsonByteLength;
    const glbByteOffset =
      batchTableBinaryByteOffset + batchTableBinaryByteLength;
    const glbByteLength = Math.max(byteLength - glbByteOffset, 0);

    if (featureTableBinaryByteOffset % 8 > 0) {
      const issue = BinaryValidationIssues.BINARY_INVALID_ALIGNMENT_legacy(
        path,
        "feature table binary",
        8
      );
      context.addIssue(issue);
      return undefined;
    }

    if (batchTableJsonByteOffset % 8 > 0) {
      const issue = BinaryValidationIssues.BINARY_INVALID_ALIGNMENT_legacy(
        path,
        "batch table JSON",
        8
      );
      context.addIssue(issue);
      return undefined;
    }

    if (batchTableBinaryByteOffset % 8 > 0) {
      const issue = BinaryValidationIssues.BINARY_INVALID_ALIGNMENT_legacy(
        path,
        "batch table binary",
        8
      );
      context.addIssue(issue);
      return undefined;
    }

    if (hasEmbeddedGlb && glbByteOffset % 8 > 0) {
      const issue = BinaryValidationIssues.BINARY_INVALID_ALIGNMENT_legacy(
        path,
        "GLB data",
        8
      );
      context.addIssue(issue);
      return undefined;
    }

    if (byteLength % 8 > 0) {
      const issue = BinaryValidationIssues.BINARY_INVALID_ALIGNMENT_legacy(
        path,
        "byte length",
        8
      );
      context.addIssue(issue);
      return undefined;
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
        path,
        "header, feature table, batch table, and GLB",
        byteLength,
        computedByteLength
      );
      context.addIssue(issue);
      return undefined;
    }

    const featureTableJsonBuffer = input.subarray(
      featureTableJsonByteOffset,
      featureTableBinaryByteOffset
    );
    const featureTableBinary = input.subarray(
      featureTableBinaryByteOffset,
      batchTableJsonByteOffset
    );
    const batchTableJsonBuffer = input.subarray(
      batchTableJsonByteOffset,
      batchTableBinaryByteOffset
    );
    const batchTableBinary = input.subarray(
      batchTableBinaryByteOffset,
      glbByteOffset
    );
    const glbData = input.subarray(
      glbByteOffset,
      glbByteOffset + glbByteLength
    );

    let featureTableJson: any;
    let batchTableJson: any;

    try {
      featureTableJson = Buffers.getJson(featureTableJsonBuffer);
    } catch (error) {
      const message = `Could not parse feature table JSON: ${error}`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(path, message);
      context.addIssue(issue);
      return undefined;
    }

    try {
      batchTableJson = Buffers.getJson(batchTableJsonBuffer);
    } catch (error) {
      const message = `Could not parse batch table JSON: ${error}`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(path, message);
      context.addIssue(issue);
      return undefined;
    }

    return {
      featureTableJson: featureTableJson,
      featureTableBinary: featureTableBinary,
      batchTableJson: batchTableJson,
      batchTableBinary: batchTableBinary,
      glbData: glbData,
    };
  }
}
