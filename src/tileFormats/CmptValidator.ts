// This was, to some extent, "ported" (or at least "inspired") from
// https://github.com/CesiumGS/3d-tiles-validator/blob/e84202480eb6572383008076150c8e52c99af3c3/validator/lib/validateCmpt.js

// TODO This is still pretty messy. The legacy JSON validation should
// be replaced, and the class as a whole should be cleaned up.
// It has to be decided which messages cause an "early bailout"
// (i.e. which ones should cause the validation to end).
// The part for validating the magic/version/.../alignment in all
// content validators is redundant, and redundancy is redundant.

import { ValidationContext } from "../validation/ValidationContext";
import { Validator } from "../validation/Validator";

import { I3dmValidator } from "./I3dmValidator";
import { PntsValidator } from "./PntsValidator";
import { B3dmValidator } from "./B3dmValidator";

import { ContentValidationIssues } from "../issues/ContentValidationIssues";
import { BinaryValidationIssues } from "../issues/BinaryValidationIssues";

/**
 * A class that can perform validation of CMPT data that is
 * given as a Buffer.
 */
export class CmptValidator implements Validator<Buffer> {
  private _uri: string;

  constructor(uri: string) {
    this._uri = uri;
  }

  async validateObject(
    input: Buffer,
    context: ValidationContext
  ): Promise<void> {
    // Create a new context to collect the issues that are
    // found in the data. If there are issues, then they
    // will be stored as the 'internal issues' of a
    // single content validation issue.
    const derivedContext = context.derive(".");
    await this.validateObjectInternal(input, derivedContext);
    const derivedResult = derivedContext.getResult();
    const issue = ContentValidationIssues.createFrom(this._uri, derivedResult);
    if (issue) {
      context.addIssue(issue);
    }
  }

  async validateObjectInternal(
    input: Buffer,
    context: ValidationContext
  ): Promise<void> {
    const headerByteLength = 16;
    if (input.length < headerByteLength) {
      const message =
        `The input must have at least ${headerByteLength} bytes, ` +
        `but only has ${input.length} bytes`;
      const issue = BinaryValidationIssues.BINARY_INVALID(this._uri, message);
      context.addIssue(issue);
      return;
    }

    const magic = input.toString("utf8", 0, 4);
    const version = input.readUInt32LE(4);
    const byteLength = input.readUInt32LE(8);
    const tilesLength = input.readUInt32LE(12);

    if (magic !== "cmpt") {
      const issue = BinaryValidationIssues.BINARY_INVALID_VALUE(
        this._uri,
        "magic",
        "cmpt",
        magic
      );
      context.addIssue(issue);
      return;
    }

    if (version !== 1) {
      const issue = BinaryValidationIssues.BINARY_INVALID_VALUE(
        this._uri,
        "version",
        1,
        version
      );
      context.addIssue(issue);
      return;
    }

    if (byteLength !== input.length) {
      const issue = BinaryValidationIssues.BINARY_INVALID_LENGTH(
        this._uri,
        "content",
        byteLength,
        input.length
      );
      context.addIssue(issue);
      return;
    }

    let byteOffset = headerByteLength;
    for (let i = 0; i < tilesLength; i++) {
      if (byteOffset + 12 > byteLength) {
        const message =
          "Cannot read byte length from inner tile, exceeds cmpt tile's byte length.";
        const issue = BinaryValidationIssues.BINARY_INVALID(this._uri, message);
        context.addIssue(issue);
        return;
      }
      if (byteOffset % 8 > 0) {
        const message = "Inner tile must be aligned to an 8-byte boundary";
        const issue = BinaryValidationIssues.BINARY_INVALID(this._uri, message);
        context.addIssue(issue);
        return;
      }

      const innerTileMagic = input.toString("utf8", byteOffset, byteOffset + 4);
      const innerTileByteLength = input.readUInt32LE(byteOffset + 8);
      const innerTile = input.slice(
        byteOffset,
        byteOffset + innerTileByteLength
      );

      if (innerTileMagic === "b3dm") {
        const innerValidator = new B3dmValidator(this._uri);
        await innerValidator.validateObject(innerTile, context);
      } else if (innerTileMagic === "i3dm") {
        const innerValidator = new I3dmValidator(this._uri);
        await innerValidator.validateObject(innerTile, context);
      } else if (innerTileMagic === "pnts") {
        const innerValidator = new PntsValidator(this._uri);
        await innerValidator.validateObject(innerTile, context);
      } else if (innerTileMagic === "cmpt") {
        const innerValidator = new CmptValidator(this._uri);
        await innerValidator.validateObject(innerTile, context);
      } else {
        const message = `Invalid inner tile magic: ${innerTileMagic}`;
        const issue = BinaryValidationIssues.BINARY_INVALID(this._uri, message);
        context.addIssue(issue);
        return;
      }

      byteOffset += innerTileByteLength;
    }
  }
}
