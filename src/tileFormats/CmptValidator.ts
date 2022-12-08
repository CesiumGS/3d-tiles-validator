// This was, to some extent, "ported" (or at least "inspired") from
// https://github.com/CesiumGS/3d-tiles-validator/blob/e84202480eb6572383008076150c8e52c99af3c3/validator/lib/validateCmpt.js
// It still contains legacy elements that may be cleaned up at some point.

import { ValidationContext } from "../validation/ValidationContext";
import { Validator } from "../validation/Validator";

import { I3dmValidator } from "./I3dmValidator";
import { PntsValidator } from "./PntsValidator";
import { B3dmValidator } from "./B3dmValidator";
import { TileFormatValidator } from "./TileFormatValidator";

import { BinaryValidationIssues } from "../issues/BinaryValidationIssues";

/**
 * A class that can perform validation of CMPT data that is
 * given as a Buffer.
 *
 * @internal
 */
export class CmptValidator implements Validator<Buffer> {
  async validateObject(
    uri: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const headerByteLength = 16;

    if (
      !TileFormatValidator.validateHeader(
        uri,
        input,
        headerByteLength,
        "cmpt",
        context
      )
    ) {
      return false;
    }
    const byteLength = input.readUInt32LE(8);
    const tilesLength = input.readUInt32LE(12);

    let result = true;
    let byteOffset = headerByteLength;
    for (let i = 0; i < tilesLength; i++) {
      if (byteOffset + 12 > byteLength) {
        const message =
          "Cannot read byte length from inner tile, exceeds cmpt tile's byte length.";
        const issue = BinaryValidationIssues.BINARY_INVALID(uri, message);
        context.addIssue(issue);
        return false;
      }
      if (byteOffset % 8 > 0) {
        const message = "Inner tile must be aligned to an 8-byte boundary";
        const issue = BinaryValidationIssues.BINARY_INVALID(uri, message);
        context.addIssue(issue);
        return false;
      }

      const innerTileMagic = input.toString("utf8", byteOffset, byteOffset + 4);
      const innerTileByteLength = input.readUInt32LE(byteOffset + 8);
      const innerTile = input.slice(
        byteOffset,
        byteOffset + innerTileByteLength
      );

      if (innerTileMagic === "b3dm") {
        const innerValidator = new B3dmValidator();
        const innerResult = await innerValidator.validateObject(
          uri,
          innerTile,
          context
        );
        if (!innerResult) {
          result = false;
        }
      } else if (innerTileMagic === "i3dm") {
        const innerValidator = new I3dmValidator();
        const innerResult = await innerValidator.validateObject(
          uri,
          innerTile,
          context
        );
        if (!innerResult) {
          result = false;
        }
      } else if (innerTileMagic === "pnts") {
        const innerValidator = new PntsValidator();
        const innerResult = await innerValidator.validateObject(
          uri,
          innerTile,
          context
        );
        if (!innerResult) {
          result = false;
        }
      } else if (innerTileMagic === "cmpt") {
        const innerValidator = new CmptValidator();
        const innerResult = await innerValidator.validateObject(
          uri,
          innerTile,
          context
        );
        if (!innerResult) {
          result = false;
        }
      } else {
        const message = `Invalid inner tile magic: ${innerTileMagic}`;
        const issue = BinaryValidationIssues.BINARY_INVALID(uri, message);
        context.addIssue(issue);
        result = false;
      }

      byteOffset += innerTileByteLength;
    }
    return result;
  }
}
