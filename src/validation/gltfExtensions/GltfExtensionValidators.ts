import { Buffers } from "3d-tiles-tools";
import { GltfUtilities } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";

import { GltfExtensionValidationIssues } from "../../issues/GltfExtensionValidationIssues";
import { IoValidationIssues } from "../../issues/IoValidationIssue";

import { ExtMeshFeaturesValidator } from "./ExtMeshFeaturesValidator";
import { GltfData } from "./GltfData";

// TODO Replace this by moving extractBinaryFromGlb into 3d-tiles-tools
class TileFormatError extends Error {
  constructor(message: string) {
    super(message);
    // See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
    // #extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, TileFormatError.prototype);
  }

  override toString = (): string => {
    return `${this.name}: ${this.message}`;
  };
}

export class GltfExtensionValidators {
  static async validateGltfExtensions(
    path: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const gltfData = await GltfExtensionValidators.readGltfData(
      path,
      input,
      context
    );
    if (!gltfData) {
      // Issue was already added to context
      return false;
    }

    let result = true;

    // Validate `EXT_mesh_features`
    const extMeshFeaturesValid = await ExtMeshFeaturesValidator.validateGltf(
      path,
      gltfData,
      context
    );
    if (!extMeshFeaturesValid) {
      result = false;
    }
    return result;
  }

  private static async readGltfData(
    path: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<GltfData | undefined> {
    // Assume that the input contains glTF JSON, but...
    let gltfJsonBuffer: Buffer | undefined = input;
    let gltfBinaryBuffer: Buffer | undefined = undefined;

    // ... if the input starts with "glTF", then try to
    // extract the JSON from the GLB:
    const magicString = Buffers.getMagicString(input);
    if (magicString === "glTF") {
      try {
        gltfJsonBuffer = GltfUtilities.extractJsonFromGlb(input);
        gltfBinaryBuffer = GltfExtensionValidators.extractBinaryFromGlb(input);
      } catch (error) {
        // A TileFormatError may be thrown here
        const message = `Could not extract JSON from GLB: ${error}`;
        const issue = GltfExtensionValidationIssues.GLTF_INVALID(path, message);
        context.addIssue(issue);
        return undefined;
      }
    }

    let gltf: any = undefined;
    try {
      gltf = JSON.parse(gltfJsonBuffer.toString());
    } catch (error) {
      const message = `Could not parse glTF JSON: ${error}`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(path, message);
      context.addIssue(issue);
      return undefined;
    }

    return {
      gltf: gltf,
      binary: gltfBinaryBuffer,
    };
  }

  // TODO This should be in 3d-tiles-tools GltfUtilities
  // TODO This does not handle glTF 1.0 properly!!!
  static extractBinaryFromGlb(glbBuffer: Buffer): Buffer {
    const magic = Buffers.getMagicString(glbBuffer);
    if (magic !== "glTF") {
      throw new TileFormatError(
        `Expected magic header to be 'gltf', but found ${magic}`
      );
    }
    if (glbBuffer.length < 12) {
      throw new TileFormatError(
        `Expected at least 12 bytes, but only got ${glbBuffer.length}`
      );
    }
    const version = glbBuffer.readUInt32LE(4);
    const length = glbBuffer.readUInt32LE(8);
    if (length > glbBuffer.length) {
      throw new TileFormatError(
        `Header indicates ${length} bytes, but input has ${glbBuffer.length} bytes`
      );
    }
    if (version === 1) {
      // TODO Handle glTF 1.0!
      throw new TileFormatError(`glTF 1.0 is not handled yet`);
    } else if (version === 2) {
      if (glbBuffer.length < 20) {
        throw new TileFormatError(
          `Expected at least 20 bytes, but only got ${glbBuffer.length}`
        );
      }
      const jsonChunkLength = glbBuffer.readUint32LE(12);
      const jsonChunkType = glbBuffer.readUint32LE(16);
      const expectedJsonChunkType = 0x4e4f534a; // ASCII string for "JSON"
      if (jsonChunkType !== expectedJsonChunkType) {
        throw new TileFormatError(
          `Expected chunk type to be ${expectedJsonChunkType}, but found ${jsonChunkType}`
        );
      }
      const jsonChunkStart = 20;
      const jsonChunkEnd = jsonChunkStart + jsonChunkLength;
      if (glbBuffer.length < jsonChunkEnd) {
        throw new TileFormatError(
          `Expected at least ${jsonChunkEnd} bytes, but only got ${glbBuffer.length}`
        );
      }

      const binChunkHeaderStart = jsonChunkEnd;
      const binChunkLength = glbBuffer.readUint32LE(binChunkHeaderStart);
      const binChunkType = glbBuffer.readUint32LE(binChunkHeaderStart + 4);
      const expectedBinChunkType = 0x004e4942; // ASCII string for "BIN"
      if (binChunkType !== expectedBinChunkType) {
        throw new TileFormatError(
          `Expected chunk type to be ${expectedBinChunkType}, but found ${binChunkType}`
        );
      }
      const binChunkStart = binChunkHeaderStart + 8;
      const binChunkEnd = binChunkStart + binChunkLength;
      if (glbBuffer.length < binChunkEnd) {
        throw new TileFormatError(
          `Expected at least ${binChunkEnd} bytes, but only got ${glbBuffer.length}`
        );
      }

      const binChunkData = glbBuffer.subarray(binChunkStart, binChunkEnd);
      return binChunkData;
    } else {
      throw new TileFormatError(`Expected version 1 or 2, but got ${version}`);
    }
  }
}
