import { ValidationContext } from "../ValidationContext";
import { ValidationIssue } from "../ValidationIssue";
import { GltfData } from "./GltfData";
import { GltfExtensionIssues } from "./GltfExtensionIssues";
import { GltfExtensionValidator } from "./GltfExtensionValidator";

import { ExtInstanceFeaturesValidator } from "./instanceFeatures/ExtInstanceFeaturesValidator";

import { KhrDracoMeshCompressionIssues } from "./dracoMeshCompression/KhrDracoMeshCompressionIssues";

import { KhrTextureBasisuIssues } from "./textureBasisu/KhrTextureBasisuIssues";

import { ExtMeshFeaturesIssues } from "./meshFeatures/ExtMeshFeaturesIssues";
import { ExtMeshFeaturesValidator } from "./meshFeatures/ExtMeshFeaturesValidator";

import { ExtStructuralMetadataValidator } from "./structuralMetadata/ExtStructuralMetadataValidator";
import { ExtStructuralMetadataIssues } from "./structuralMetadata/ExtStructuralMetadataIssues";

import { MaxarNonvisualGeometryValidator } from "./nonvisualGeometry/MaxarNonvisualGeometryValidator";
import { MaxarNonvisualGeometryIssues } from "./nonvisualGeometry/MaxarNonvisualGeometryIssues";

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
   * The mapping from the full name of a glTF extension to the
   * `GltfExtensionValidator` for this extension.
   */
  private static readonly gltfExtensionValidators: {
    [key: string]: GltfExtensionValidator;
  } = {};

  /**
   * Whether the 'registerValidators' function was already called.
   */
  private static didRegisterValidators = false;

  /**
   * Register the given validator as the validator for the extension with
   * the given name
   *
   * @param extensionName - The full glTF extension name
   * @param gltfExtensionValidator - The validator
   */
  private static registerValidator(
    extensionName: string,
    gltfExtensionValidator: GltfExtensionValidator
  ) {
    GltfExtensionValidators.gltfExtensionValidators[extensionName] =
      gltfExtensionValidator;
  }

  /**
   * Registers all known extension validators if they have not
   * yet been registered.
   */
  private static registerValidators() {
    if (GltfExtensionValidators.didRegisterValidators) {
      return;
    }

    // eslint-disable @typescript-eslint/no-unused-vars
    const emptyValidation = async (
      path: string,
      gltfData: GltfData,
      context: ValidationContext
    ) => true;
    const emptyProcessing = async (
      path: string,
      keepObsoleteIssues: boolean,
      gltfData: GltfData,
      causes: ValidationIssue[]
    ) => causes;
    // eslint-enable @typescript-eslint/no-unused-vars

    GltfExtensionValidators.registerValidator("EXT_mesh_features", {
      validate: ExtMeshFeaturesValidator.validateGltf,
      processCauses: ExtMeshFeaturesIssues.processCauses,
    });
    GltfExtensionValidators.registerValidator("EXT_instance_features", {
      validate: ExtInstanceFeaturesValidator.validateGltf,
      processCauses: emptyProcessing,
    });
    GltfExtensionValidators.registerValidator("EXT_structural_metadata", {
      validate: ExtStructuralMetadataValidator.validateGltf,
      processCauses: ExtStructuralMetadataIssues.processCauses,
    });
    GltfExtensionValidators.registerValidator("NGA_gpm_local", {
      validate: NgaGpmLocalValidator.validateGltf,
      processCauses:
        GltfExtensionIssues.processCausesOmittingUnsupportedExtension(
          "NGA_gpm_local"
        ),
    });
    GltfExtensionValidators.registerValidator("MAXAR_image_ortho", {
      validate: MaxarImageOrthoValidator.validateGltf,
      processCauses:
        GltfExtensionIssues.processCausesOmittingUnsupportedExtension(
          "MAXAR_image_ortho"
        ),
    });
    GltfExtensionValidators.registerValidator("KHR_lights_punctual", {
      validate: KhrLightsPunctualValidator.validateGltf,
      processCauses: emptyProcessing,
    });
    GltfExtensionValidators.registerValidator("MAXAR_nonvisual_geometry", {
      validate: MaxarNonvisualGeometryValidator.validateGltf,
      processCauses: MaxarNonvisualGeometryIssues.processCauses,
    });

    // Register an empty validator for KHR_texture_basisu that only
    // filters out the messages about unused images and
    // unsupported MIME types.
    GltfExtensionValidators.registerValidator("KHR_texture_basisu", {
      validate: emptyValidation,
      processCauses: KhrTextureBasisuIssues.processCauses,
    });

    // Register an empty validator for KHR_draco_mesh_compression that only
    // filters out the messages about unused buffer views
    GltfExtensionValidators.registerValidator("KHR_draco_mesh_compression", {
      validate: emptyValidation,
      processCauses: KhrDracoMeshCompressionIssues.processCauses,
    });

    // Register an empty validator for EXT_meshopt_compression that only
    // filters out the messages about the extension not being supported
    GltfExtensionValidators.registerValidator("EXT_meshopt_compression", {
      validate: emptyValidation,
      processCauses:
        GltfExtensionIssues.processCausesOmittingUnsupportedExtension(
          "EXT_meshopt_compression"
        ),
    });

    GltfExtensionValidators.didRegisterValidators = true;
  }

  /**
   * Ensure that the extensions in the given glTF data are valid.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param gltfData - The GltfData
   * @param context - The `ValidationContext`
   * @returns Whether the object is valid
   */
  static async validateGltfExtensions(
    path: string,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    GltfExtensionValidators.registerValidators();
    let result = true;
    const validators = Object.values(
      GltfExtensionValidators.gltfExtensionValidators
    );
    for (const validator of validators) {
      const valid = await validator.validate(path, gltfData, context);
      if (!valid) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Process the given list of issues with all registered glTF extension
   * validators.
   *
   * This will call 'GltfExtensionValidator.processCauses' for each registered
   * validator. This is mainly intended for filtering out the issues that are
   * obsolete due to the validation that is performed by validators that are
   * implemented as part of the 3D Tiles validator.
   *
   * @param path - The path for validation issues
   * @param keepObsoleteIssues - Whether issues should be retained even
   * when they are obsolete.
   * @param gltfData - The GltfData
   * @param allCauses - All validation issues that have been created
   * from the issues that are generated by the glTF validator
   * @returns A possibly modified list of validation issues
   */
  static async processCausesForGltfExtensions(
    path: string,
    keepObsoleteIssues: boolean,
    gltfData: GltfData,
    allCauses: ValidationIssue[]
  ): Promise<ValidationIssue[]> {
    GltfExtensionValidators.registerValidators();

    let result = allCauses.slice();
    const validators = Object.values(
      GltfExtensionValidators.gltfExtensionValidators
    );
    for (const validator of validators) {
      result = await validator.processCauses(
        path,
        keepObsoleteIssues,
        gltfData,
        result
      );
    }
    return result;
  }
}
