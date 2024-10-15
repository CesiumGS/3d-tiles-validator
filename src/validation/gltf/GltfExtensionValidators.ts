import { ValidationContext } from "../ValidationContext";

import { ExtInstanceFeaturesValidator } from "./instanceFeatures/ExtInstanceFeaturesValidator";
import { ExtMeshFeaturesValidator } from "./meshFeatures/ExtMeshFeaturesValidator";
import { ExtStructuralMetadataValidator } from "./structuralMetadata/ExtStructuralMetadataValidator";

import { GltfDataReader } from "./GltfDataReader";

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
    const gltfData = await GltfDataReader.readGltfData(path, input, context);
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

    // Validate `EXT_instance_features`
    const extInstanceFeatures = await ExtInstanceFeaturesValidator.validateGltf(
      path,
      gltfData,
      context
    );
    if (!extInstanceFeatures) {
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
}
