import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { ExtendedObjectsValidators } from "./ExtendedObjectsValidators";

import { Asset } from "3d-tiles-tools";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A class for validations related to `asset` objects.
 *
 * @internal
 */
export class AssetValidator {
  /**
   * The set of "known" asset versions. When encountering a version
   * that is not in this list, a warning will be created.
   */
  static knownAssetVersions: string[] = ["0.0", "1.0", "1.1"];

  /**
   * Performs the validation to ensure that the given object is a
   * valid `asset` object.
   *
   * @param asset - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateAsset(asset: Asset, context: ValidationContext): boolean {
    const path = "/asset";
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "asset", asset, context)) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(path, "asset", asset, context)
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(path, asset, context)
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(asset)) {
      return result;
    }

    // Validate the version
    const version = asset.version;
    const versionPath = "/asset/version";
    // The version MUST be defined
    // The version MUST be a string
    if (
      !BasicValidator.validateString(versionPath, "version", version, context)
    ) {
      result = false;
    } else {
      // The version SHOULD be one of the `knownAssetVersions`
      if (!AssetValidator.knownAssetVersions.includes(version)) {
        const message =
          `The asset version is ${version}, ` +
          `known versions are ${AssetValidator.knownAssetVersions}`;
        const issue = SemanticValidationIssues.ASSET_VERSION_UNKNOWN(
          versionPath,
          message
        );
        context.addIssue(issue);
      }
    }

    // Validate the tilesetVersion
    const tilesetVersion = asset.tilesetVersion;
    const tilesetVersionPath = "/asset/tilesetVersion";
    if (defined(tilesetVersion)) {
      // The tilesetVersion MUST be a string
      if (
        !BasicValidator.validateString(
          tilesetVersionPath,
          "tilesetVersion",
          tilesetVersion,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }
}
