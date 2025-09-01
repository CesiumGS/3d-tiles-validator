import { ValidationContext } from "../ValidationContext";

import { GltfDataReader } from "./GltfDataReader";
import { GltfData } from "./GltfData";

import { ExtInstanceFeaturesValidator } from "./instanceFeatures/ExtInstanceFeaturesValidator";
import { ExtMeshFeaturesValidator } from "./meshFeatures/ExtMeshFeaturesValidator";
import { ExtStructuralMetadataValidator } from "./structuralMetadata/ExtStructuralMetadataValidator";
import { MaxarNonvisualGeometryValidator } from "./nonvisualGeometry/MaxarNonvisualGeometryValidator";
import { NgaGpmLocalValidator } from "./gpmLocal/NgaGpmLocalValidator";
import { MaxarImageOrthoValidator } from "./imageOrtho/MaxarImageOrthoValidator";
import { KhrLightsPunctualValidator } from "./lightsPunctual/KhrLightsPunctualValidator";

/**
 * An internal type definition for a function that performs the
 * validation of a glTF extension in a given GltfData object,
 * and adds any issues to a given context.
 */
type GltfExtensionValidator = (
  path: string,
  gltfData: GltfData,
  context: ValidationContext
) => Promise<boolean>;

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
   * Returns whether the given name is the name of a glTF extension that
   * is "known" by the validator.
   *
   * This means that there is a dedicated validator for this specific
   * extension, and this validator was implemented as part of the
   * 3D Tiles Validator. Issues that are caused by the glTF Validator
   * not knowing this extension should be filtered out of
   * the glTF validation result.
   *
   * @param extensionName - The full glTF extension name
   * @returns Whether the extension is known by the 3D Tiles Validator
   */
  static isRegistered(extensionName: string) {
    GltfExtensionValidators.registerValidators();
    const names = Object.keys(GltfExtensionValidators.gltfExtensionValidators);
    return names.includes(extensionName);
  }

  /**
   * Registers all known extension validators if they have not
   * yet been registered.
   */
  private static registerValidators() {
    if (GltfExtensionValidators.didRegisterValidators) {
      return;
    }

    GltfExtensionValidators.registerValidator(
      "EXT_mesh_features",
      ExtMeshFeaturesValidator.validateGltf
    );
    GltfExtensionValidators.registerValidator(
      "EXT_instance_features",
      ExtInstanceFeaturesValidator.validateGltf
    );
    GltfExtensionValidators.registerValidator(
      "EXT_structural_metadata",
      ExtStructuralMetadataValidator.validateGltf
    );
    GltfExtensionValidators.registerValidator(
      "NGA_gpm_local",
      NgaGpmLocalValidator.validateGltf
    );
    GltfExtensionValidators.registerValidator(
      "MAXAR_image_ortho",
      MaxarImageOrthoValidator.validateGltf
    );
    GltfExtensionValidators.registerValidator(
      "KHR_lights_punctual",
      KhrLightsPunctualValidator.validateGltf
    );
    GltfExtensionValidators.registerValidator(
      "MAXAR_nonvisual_geometry",
      MaxarNonvisualGeometryValidator.validateGltf
    );

    GltfExtensionValidators.didRegisterValidators = true;
  }

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
    GltfExtensionValidators.registerValidators();
    const gltfData = await GltfDataReader.readGltfData(path, input, context);
    if (!gltfData) {
      // Issue was already added to context
      return false;
    }

    let result = true;
    const validators = Object.values(
      GltfExtensionValidators.gltfExtensionValidators
    );
    for (const validator of validators) {
      const valid = await validator(path, gltfData, context);
      if (!valid) {
        result = false;
      }
    }
    return result;
  }
}
