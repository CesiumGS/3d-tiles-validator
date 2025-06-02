import { defined } from "3d-tiles-tools";

import { Validator } from "../Validator";
import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { ExtensionsDeclarationsValidator } from "../ExtensionsDeclarationsValidator";

/**
 * A class for the validation of `3DTILES_content_gltf` extension objects
 *
 * @internal
 */
export class ContentGltfValidator implements Validator<any> {
  /**
   * Performs the validation of a `Tileset` object that
   * contains a `3DTILES_content_gltf` extension object.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param boundingVolume - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  async validateObject(
    path: string,
    tileset: any,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "tileset", tileset, context)) {
      return false;
    }

    let result = true;

    // If there is a 3DTILES_content_gltf extension,
    // perform the validation of the corresponding object
    const extensions = tileset.extensions;
    if (defined(extensions)) {
      const key = "3DTILES_content_gltf";
      const extension = extensions[key];
      const extensionPath = path + "/" + key;
      if (
        !ContentGltfValidator.validateContentGltf(
          extensionPath,
          extension,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Performs the validation to ensure that the given object is a
   * valid `3DTILES_content_gltf` object.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param object - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateContentGltf(
    path: string,
    object: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "object", object, context)) {
      return false;
    }

    const extensionsUsed = object.extensionsUsed;
    const extensionsRequired = object.extensionsRequired;
    return ExtensionsDeclarationsValidator.validateExtensionDeclarationConsistency(
      path,
      extensionsUsed,
      extensionsRequired,
      context
    );
  }
}
