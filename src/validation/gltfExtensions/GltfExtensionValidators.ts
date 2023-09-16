import { GltfExtensionValidationIssues } from "../../issues/GltfExtensionValidationIssues";
import { IoValidationIssues } from "../../issues/IoValidationIssue";
import { ValidationContext } from "../ValidationContext";

import { Buffers, GltfUtilities } from "3d-tiles-tools";
import { ExtMeshFeaturesValidator } from "./ExtMeshFeaturesValidator";

export class GltfExtensionValidators {
  static async validateGltfExtensions(
    path: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const gltf = await GltfExtensionValidators.readGltfObject(
      path,
      input,
      context
    );
    if (!gltf) {
      // Issue was already added to context
      return false;
    }

    let result = true;

    // Validate `EXT_mesh_features`
    if (!ExtMeshFeaturesValidator.validateGltf(path, gltf, context)) {
      result = false;
    }
    return result;
  }

  private static async readGltfObject(
    path: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<any> {
    // Assume that the input contains glTF JSON, but...
    let gltfJsonBuffer: Buffer | undefined = input;

    // ... if the input starts with "glTF", then try to
    // extract the JSON from the GLB:
    const magicString = Buffers.getMagicString(input);
    if (magicString === "glTF") {
      try {
        gltfJsonBuffer = GltfUtilities.extractJsonFromGlb(input);
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
    return gltf;
  }
}
