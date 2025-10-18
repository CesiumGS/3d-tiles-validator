import { ValidationContext } from "../ValidationContext";
import { ValidationIssue } from "../ValidationIssue";
import { GltfData } from "./GltfData";

import { ExtInstanceFeaturesValidator } from "./instanceFeatures/ExtInstanceFeaturesValidator";
import { ExtMeshFeaturesValidator } from "./meshFeatures/ExtMeshFeaturesValidator";
import { ExtStructuralMetadataValidator } from "./structuralMetadata/ExtStructuralMetadataValidator";
import { MaxarNonvisualGeometryValidator } from "./nonvisualGeometry/MaxarNonvisualGeometryValidator";
import { NgaGpmLocalValidator } from "./gpmLocal/NgaGpmLocalValidator";
import { MaxarImageOrthoValidator } from "./imageOrtho/MaxarImageOrthoValidator";
import { KhrLightsPunctualValidator } from "./lightsPunctual/KhrLightsPunctualValidator";
import { GltfExtensionIssuesKhrTextureBasisu } from "./GltfExtensionIssuesKhrTextureBasisu";
import { ExtStructuralMetadataIssues } from "./structuralMetadata/ExtStructuralMetadataIssues";
import { ExtMeshFeaturesIssues } from "./meshFeatures/ExtMeshFeaturesIssues";

/**
 * An internal type definition for glTF extension validators
 */
interface GltfExtensionValidator {
  /**
   * Performs the validation of a glTF extension in a given GltfData
   * object.
   *
   * This adds any issues to the given context, and returns
   * whether the extension was valid.
   *
   * @param path - The path for validation issues
   * @param gltfData - The GltfData object
   * @param context - The validation context
   * @returns Whether the extension was valid
   */
  validate(
    path: string,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean>;

  /**
   * Process the given list of validation issues, based on the knowledge
   * that only this validator implementation has.
   *
   * The given list are the validation issues that have been created
   * from the validation issues of the glTF validator (possibly processed
   * from other GltfExtensionValidator implementations).
   *
   * This method can omit some of these issues, if it determines that the
   * respective issue is obsolete due to the validation that is performed
   * by this instance. For example, all implementations of this interface
   * will remove the issue where the message is
   * "Cannot validate an extension as it is not supported by the validator:"
   * followed by the name of the extension that this validator is
   * responsible for. (Note that the method can also add new issues, but
   * this is usually supposed to be done in the 'validate' method)
   *
   * @param path - The path for validation issues
   * @param gltfData - The GltfData objects
   * @param causes - The validation issues
   */
  processCauses(
    path: string,
    gltfData: GltfData,
    causes: ValidationIssue[]
  ): Promise<ValidationIssue[]>;
}

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

    const emptyValidation = async (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      path: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      gltfData: GltfData,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      context: ValidationContext
    ) => true;
    const emptyProcessing = async (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      path: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      gltfData: GltfData,
      causes: ValidationIssue[]
    ) => causes;

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
      processCauses: emptyProcessing,
    });
    GltfExtensionValidators.registerValidator("MAXAR_image_ortho", {
      validate: MaxarImageOrthoValidator.validateGltf,
      processCauses: emptyProcessing,
    });
    GltfExtensionValidators.registerValidator("KHR_lights_punctual", {
      validate: KhrLightsPunctualValidator.validateGltf,
      processCauses: emptyProcessing,
    });
    GltfExtensionValidators.registerValidator("MAXAR_nonvisual_geometry", {
      validate: MaxarNonvisualGeometryValidator.validateGltf,
      processCauses: emptyProcessing,
    });

    // Register an empty validator for KHR_texture_basisu that only
    // filters out the messages about unused images and
    // unsupported MIME types.
    GltfExtensionValidators.registerValidator("KHR_texture_basisu", {
      validate: emptyValidation,
      processCauses:
        GltfExtensionIssuesKhrTextureBasisu.processCausesKhrTextureBasisu,
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
   * @param gltfData - The GltfData
   * @param allCauses - All validation issues that have been created
   * from the issues that are generated by the glTF validator
   * @returns A possibly modified list of validation issues
   */
  static async processCauses(
    path: string,
    gltfData: GltfData,
    allCauses: ValidationIssue[]
  ): Promise<ValidationIssue[]> {
    GltfExtensionValidators.registerValidators();

    let result = allCauses.slice();
    const validators = Object.values(
      GltfExtensionValidators.gltfExtensionValidators
    );
    for (const validator of validators) {
      result = await validator.processCauses(path, gltfData, result);
    }
    return result;
  }
}
