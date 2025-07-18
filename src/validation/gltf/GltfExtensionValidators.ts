import { ValidationContext } from "../ValidationContext";

import { ExtInstanceFeaturesValidator } from "./instanceFeatures/ExtInstanceFeaturesValidator";
import { ExtMeshFeaturesValidator } from "./meshFeatures/ExtMeshFeaturesValidator";
import { ExtStructuralMetadataValidator } from "./structuralMetadata/ExtStructuralMetadataValidator";

import { GltfDataReader } from "./GltfDataReader";
import { NgaGpmLocalValidator } from "./gpmLocal/NgaGpmLocalValidator";
import { MaxarImageOrthoValidator } from "./imageOrtho/MaxarImageOrthoValidator";
import { KhrLightsPunctualValidator } from "./lightsPunctual/KhrLightsPunctualValidator";

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

    // Validate `NGA_gpm_local`
    const ngaGpmLocalValid = await NgaGpmLocalValidator.validateGltf(
      path,
      gltfData,
      context
    );
    if (!ngaGpmLocalValid) {
      result = false;
    }

    // Validate `MAXAR_image_ortho`
    const maxarImageOrthoValid = await MaxarImageOrthoValidator.validateGltf(
      path,
      gltfData,
      context
    );
    if (!maxarImageOrthoValid) {
      result = false;
    }

    // Validate `KHR_lights_punctual`
    const khrLightsPunctualValid =
      await KhrLightsPunctualValidator.validateGltf(path, gltfData, context);
    if (!khrLightsPunctualValid) {
      result = false;
    }

    return result;
  }
}
