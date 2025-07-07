import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { BasicValidator } from "../../BasicValidator";

import { GltfData } from "../GltfData";

import { MaxarValidatorCommon } from "../../extensions/maxar/MaxarValidatorCommon";

/**
 * A class for validating the `MAXAR_image_ortho` extension in
 * glTF assets.
 *
 * This class assumes that the structure of the glTF asset itself
 * has already been validated (e.g. with the glTF Validator).
 *
 * @internal
 */
export class MaxarImageOrthoValidator {
  /**
   * Performs the validation to ensure that the `MAXAR_image_ortho`
   * extensions in the given glTF are valid
   *
   * @param path - The path for validation issues
   * @param gltfData - The glTF data, containing the parsed JSON and the
   * (optional) binary buffer
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static async validateGltf(
    path: string,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    const gltf = gltfData.gltf;

    // Check if the extension is used
    const extensionsUsed = gltf.extensionsUsed;
    if (!extensionsUsed || !extensionsUsed.includes("MAXAR_image_ortho")) {
      return true; // Extension not used, nothing to validate
    }

    let result = true;

    // Validate MAXAR_image_ortho extensions in images
    const images = gltf.images;
    if (defined(images)) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (
          defined(image.extensions) &&
          defined(image.extensions.MAXAR_image_ortho)
        ) {
          const imagePath = path + "/images/" + i;
          const extensionPath = imagePath + "/extensions/MAXAR_image_ortho";

          if (
            !MaxarImageOrthoValidator.validateMaxarImageOrtho(
              extensionPath,
              image.extensions.MAXAR_image_ortho,
              context
            )
          ) {
            result = false;
          }
        }
      }
    }

    return result;
  }

  /**
   * Validates a MAXAR_image_ortho extension object
   *
   * @param path - The path for ValidationIssue instances
   * @param maxarImageOrtho - The MAXAR_image_ortho object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateMaxarImageOrtho(
    path: string,
    maxarImageOrtho: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "MAXAR_image_ortho",
        maxarImageOrtho,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the transform property (optional)
    const transform = maxarImageOrtho.transform;
    if (defined(transform)) {
      const transformPath = path + "/transform";
      if (
        !MaxarImageOrthoValidator.validateTransform(
          transformPath,
          transform,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the srs property (required)
    const srs = maxarImageOrtho.srs;
    const srsPath = path + "/srs";
    if (!MaxarValidatorCommon.validateSrs(srsPath, srs, context)) {
      result = false;
    }

    return result;
  }

  /**
   * Validates the transform property
   *
   * @param path - The path for ValidationIssue instances
   * @param transform - The transform array to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the transform was valid
   */
  static validateTransform(
    path: string,
    transform: any,
    context: ValidationContext
  ): boolean {
    // The transform MUST be an array with exactly 6 numbers
    const expectedLength = 6;
    const expectedElementType = "number";

    return BasicValidator.validateArray(
      path,
      "transform",
      transform,
      expectedLength,
      expectedLength,
      expectedElementType,
      context
    );
  }
}
