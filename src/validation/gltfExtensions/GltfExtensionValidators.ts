import { JSONDocument } from "@gltf-transform/core";
import { Document } from "@gltf-transform/core";

import { BinaryBufferData } from "3d-tiles-tools";
import { BinaryBufferStructure } from "3d-tiles-tools";
import { BinaryBufferDataResolver } from "3d-tiles-tools";
import { Buffers } from "3d-tiles-tools";
import { GltfTransform } from "3d-tiles-tools";
import { GltfUtilities } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";

import { GltfExtensionValidationIssues } from "../../issues/GltfExtensionValidationIssues";
import { IoValidationIssues } from "../../issues/IoValidationIssue";

import { ExtMeshFeaturesValidator } from "./ExtMeshFeaturesValidator";
import { GltfData } from "./GltfData";

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
    const magicString = Buffers.getMagicString(input);
    if (magicString === "glTF") {
      return GltfExtensionValidators.readBinaryGltfData(path, input, context);
    }
    return GltfExtensionValidators.readJsonGltfData(path, input, context);
  }

  private static async readBinaryGltfData(
    path: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<GltfData | undefined> {

    let gltfJsonBuffer: Buffer | undefined = undefined;
    let gltfBinaryBuffer: Buffer | undefined = undefined;
    try {
      const glbData = GltfUtilities.extractDataFromGlb(input);
      gltfJsonBuffer = glbData.jsonData;
      gltfBinaryBuffer = glbData.binData;
    } catch (error) {
      // A TileFormatError may be thrown here
      const message = `Could not read GLB: ${error}`;
      const issue = GltfExtensionValidationIssues.GLTF_INVALID(path, message);
      context.addIssue(issue);
      return undefined;
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
    const gltfDocument = await GltfExtensionValidators.readBinaryGltfDocument(
      input
    );
    const binaryBufferData =
      await GltfExtensionValidators.resolveBinaryBufferData(
        gltf,
        gltfBinaryBuffer,
        context
      );
    return {
      gltf: gltf,
      binary: gltfBinaryBuffer,
      binaryBufferData: binaryBufferData,
      gltfDocument: gltfDocument,
    };
  }

  private static async resolveBinaryBufferData(
    gltf: any,
    binary: Buffer | undefined,
    context: ValidationContext
  ): Promise<BinaryBufferData> {
    // Resolve the data of the bufferView/buffer structure
    // of the glTF
    const binaryBufferStructure: BinaryBufferStructure = {
      buffers: gltf.buffers,
      bufferViews: gltf.bufferViews,
    };
    const resourceResolver = context.getResourceResolver();
    const binaryBufferData = await BinaryBufferDataResolver.resolve(
      binaryBufferStructure,
      binary,
      resourceResolver
    );
    return binaryBufferData;
  }

  private static async readBinaryGltfDocument(
    input: Buffer
  ): Promise<Document> {
    // TODO Error handling
    const io = await GltfTransform.getIO();
    const doc = await io.readBinary(input);
    const gltfDocument = doc as any as Document;
    return gltfDocument;
  }

  private static async readJsonGltfData(
    path: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<GltfData | undefined> {
    let gltf: any = undefined;
    try {
      gltf = JSON.parse(input.toString());
    } catch (error) {
      const message = `Could not parse glTF JSON: ${error}`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(path, message);
      context.addIssue(issue);
      return undefined;
    }
    const binaryBufferData =
      await GltfExtensionValidators.resolveBinaryBufferData(
        gltf,
        undefined,
        context
      );

    const gltfDocument = await GltfExtensionValidators.readJsonGltfDocument(
      input
    );

    return {
      gltf: gltf,
      binary: undefined,
      binaryBufferData: binaryBufferData,
      gltfDocument: gltfDocument,
    };
  }

  private static async readJsonGltfDocument(input: Buffer): Promise<Document> {
    // TODO Error handling, resource mapping, ....
    // See https://github.com/donmccurdy/glTF-Transform/issues/1099
    const io = await GltfTransform.getIO();
    const json = JSON.parse(input.toString());
    const jsonDoc = { json, resources: {} } as JSONDocument;
    const doc = io.readJSON(jsonDoc);
    const gltfDocument = doc as any as Document;
    return gltfDocument;
  }
}
