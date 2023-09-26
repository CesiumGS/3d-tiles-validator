import { JSONDocument } from "@gltf-transform/core";
import { Document } from "@gltf-transform/core";

import { ResourceResolver } from "3d-tiles-tools";
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
import { ExtStructuralMetadataValidator } from "./ExtStructuralMetadataValidator";

/**
 * A class that only serves as an entry point for validating
 * glTF extensions, given the raw glTF input data (either
 * as embedded glTF, or as binary glTF).
 */
export class GltfExtensionValidators {
  /**
   * Ensure that the extensions in the given glTF data are valid.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param input - The raw glTF data
   * @param context - The `ValidationContext`
   * @returns Whether the object is valid
   */
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

    // Validate `EXT_structural_metadata`
    const extStructuralMetadataValid =
      await ExtStructuralMetadataValidator.validateGltf(
        path,
        gltfData,
        context
      );
    if (!extStructuralMetadataValid) {
      result = false;
    }

    return result;
  }

  /**
   * Read the glTF data from the given buffer.
   *
   * This currently supports binary glTF and embedded glTF assets.
   *
   * If the data can not be read, then the appropriate issue
   * will be added to the given context, and `undefined` will
   * be returned
   *
   * @param path - The path for `ValidationIssue` instances
   * @param input - The raw glTF data
   * @param context - The `ValidationContext`
   * @returns The glTF data, or `undefined`
   */
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

  /**
   * Read the binary glTF data from the given buffer.
   *
   * If the data can not be read, then the appropriate issue
   * will be added to the given context, and `undefined` will
   * be returned
   *
   * @param path - The path for `ValidationIssue` instances
   * @param input - The raw glTF data
   * @param context - The `ValidationContext`
   * @returns The glTF data, or `undefined`
   */
  private static async readBinaryGltfData(
    path: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<GltfData | undefined> {
    // Obtain the JSON- and binary data from the given buffer
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

    // Parse the JSON into a glTF object
    let gltf: any = undefined;
    try {
      gltf = JSON.parse(gltfJsonBuffer.toString());
    } catch (error) {
      const message = `Could not parse glTF JSON: ${error}`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(path, message);
      context.addIssue(issue);
      return undefined;
    }

    // Resolve the binary buffer data, which contains
    // one (Node) Buffer for each glTF buffer object
    // and each glTF buffer view object
    const resourceResolver = context.getResourceResolver();
    const binaryBufferData =
      await GltfExtensionValidators.resolveBinaryBufferData(
        gltf,
        gltfBinaryBuffer,
        resourceResolver
      );

    // Create the glTF-Transform document for the glTF data
    const gltfDocument = await GltfExtensionValidators.readBinaryGltfDocument(
      input
    );

    return {
      gltf: gltf,
      binary: gltfBinaryBuffer,
      binaryBufferData: binaryBufferData,
      gltfDocument: gltfDocument,
    };
  }

  /**
   * Return the binary buffer data that is described by
   * the buffers/bufferViews of the given glTF, referring
   * to the given binary buffer data.
   *
   * @param gltf - The glTF object
   * @param binary - The binary buffer data
   * @param resourceResolver - The resource resolver
   * @returns The binary buffer data
   */
  private static async resolveBinaryBufferData(
    gltf: any,
    binary: Buffer | undefined,
    resourceResolver: ResourceResolver
  ): Promise<BinaryBufferData> {
    // Resolve the data of the bufferView/buffer structure
    // of the glTF
    const binaryBufferStructure: BinaryBufferStructure = {
      buffers: gltf.buffers,
      bufferViews: gltf.bufferViews,
    };
    const binaryBufferData = await BinaryBufferDataResolver.resolve(
      binaryBufferStructure,
      binary,
      resourceResolver
    );
    return binaryBufferData;
  }

  /**
   * Try to read a glTF-Tranform document from the given GLB buffer
   * data, returning `undefined` if the document cannot be read.
   *
   * @param input - The input GLB buffer
   * @returns The document, or `undefined`
   */
  private static async readBinaryGltfDocument(
    input: Buffer
  ): Promise<Document | undefined> {
    try {
      const io = await GltfTransform.getIO();
      const doc = await io.readBinary(input);

      // TODO This obscure line avoids the error
      // > Type 'import("...3d-tiles-tools.......").Document' is not assignable to
      // > type 'import("...3d-tiles-validator...").Document'.
      // >   Types have separate declarations of a private property '_graph'.ts(2322)
      // that is probably caused by using the local, file-based,
      // non-npm version of the 3d-tiles-tools. Verify that this
      // works without this line when using the proper npm
      // dependency to the tools!
      const gltfDocument = doc as any as Document;

      return gltfDocument;
    } catch (error) {
      // This may happen when the glTF is invalid. The exact reason should
      // be reported by the validator. If the validator does not detect
      // a reason, and the document could still not be read, then this
      // should be treated as an internal error.
      return undefined;
    }
  }

  /**
   * Read the glTF data from the given buffer, which contains
   * glTF JSON.
   *
   * This currently only supports embedded glTF.
   *
   * If the data can not be read, then the appropriate issue
   * will be added to the given context, and `undefined` will
   * be returned
   *
   * @param path - The path for `ValidationIssue` instances
   * @param input - The raw glTF data
   * @param context - The `ValidationContext`
   * @returns The glTF data, or `undefined`
   */
  private static async readJsonGltfData(
    path: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<GltfData | undefined> {
    // Parse the glTF object from the input buffer
    let gltf: any = undefined;
    try {
      gltf = JSON.parse(input.toString());
    } catch (error) {
      const message = `Could not parse glTF JSON: ${error}`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(path, message);
      context.addIssue(issue);
      return undefined;
    }

    // Resolve the binary data that is associated with
    // the glTF asset
    const resourceResolver = context.getResourceResolver();
    const binaryBufferData =
      await GltfExtensionValidators.resolveBinaryBufferData(
        gltf,
        undefined,
        resourceResolver
      );

    // Create the glTF-Transform document for the glTF data
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

  /**
   * Try to read a glTF-Tranform document from the given glTF buffer
   * data, returning `undefined` if the document cannot be read.
   *
   * @param input - The input GLB buffer
   * @returns The document, or `undefined`
   */
  private static async readJsonGltfDocument(
    input: Buffer
  ): Promise<Document | undefined> {
    // TODO There is no way to determine the resources that
    // are required for a glTF document, and there is no way
    // to resolve the resoruces at load time.

    // See https://github.com/donmccurdy/glTF-Transform/issues/1099
    // and the NOTE in the error handling block below.
    const resources = {};
    try {
      const io = await GltfTransform.getIO();
      const json = JSON.parse(input.toString());
      const jsonDoc = { json, resources } as JSONDocument;
      const doc = await io.readJSON(jsonDoc);

      // TODO This obscure line avoids the error
      // > Type 'import("...3d-tiles-tools.......").Document' is not assignable to
      // > type 'import("...3d-tiles-validator...").Document'.
      // >   Types have separate declarations of a private property '_graph'.ts(2322)
      // that is probably caused by using the local, file-based,
      // non-npm version of the 3d-tiles-tools. Verify that this
      // works without this line when using the proper npm
      // dependency to the tools!

      const gltfDocument = doc as any as Document;
      return gltfDocument;
    } catch (error) {
      // This may happen when the glTF is invalid. The exact reason should
      // be reported by the validator. If the validator does not detect
      // a reason, and the document could still not be read, then this
      // should be treated as an internal error.

      // NOTE: The reason here may also be that a linked resource
      // was not found. There is hardly a way to identify that.
      // See the 'TODO' above.
      return undefined;
    }
  }
}
