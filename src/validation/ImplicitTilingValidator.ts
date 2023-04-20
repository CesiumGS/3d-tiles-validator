import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";
import { TemplateUriValidator } from "./TemplateUriValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { ExtendedObjectsValidators } from "./ExtendedObjectsValidators";

import { TileImplicitTiling } from "3d-tiles-tools";

/**
 * A class for validations related to `implicitTiling` objects.
 *
 * @internal
 */
export class ImplicitTilingValidator {
  /**
   * The valid values for the `subdivisionScheme` property
   */
  static allSubdivisionSchemes: string[] = ["QUADTREE", "OCTREE"];

  /**
   * Performs the validation to ensure that the given object is a
   * valid `implicitTiling` object.
   *
   * @param path - The path for `ValidationIssue` objects
   * @param implicitTiling - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateImplicitTiling(
    path: string,
    implicitTiling: TileImplicitTiling,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "implicitTiling",
        implicitTiling,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        path,
        "implicitTiling",
        implicitTiling,
        context
      )
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(
        path,
        implicitTiling,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(implicitTiling)) {
      return result;
    }

    // Validate the subdivisionScheme
    // The subdivisionSchemes MUST be defined
    // The subdivisionSchemes MUST be one of the valid values
    const subdivisionScheme = implicitTiling.subdivisionScheme;
    const subdivisionSchemePath = path + "/subdivisionScheme";
    if (
      !BasicValidator.validateEnum(
        subdivisionSchemePath,
        "subdivisionScheme",
        subdivisionScheme,
        ImplicitTilingValidator.allSubdivisionSchemes,
        context
      )
    ) {
      result = false;
    }

    // Validate the subtreeLevels
    // The subtreeLevels MUST be defined
    // The subtreeLevels MUST be an integer
    // The subtreeLevels MUST be at least 1
    const subtreeLevels = implicitTiling.subtreeLevels;
    const subtreeLevelsPath = path + "/subtreeLevels";
    if (
      !BasicValidator.validateIntegerRange(
        subtreeLevelsPath,
        "subtreeLevels",
        subtreeLevels,
        1,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // The availableLevels MUST be defined
    // The availableLevels MUST be an integer
    // The availableLevels MUST be at least 1
    const availableLevels = implicitTiling.availableLevels;
    const availableLevelsPath = path + "/availableLevels";
    if (
      !BasicValidator.validateIntegerRange(
        availableLevelsPath,
        "availableLevels",
        availableLevels,
        1,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate the subtrees
    // The subtrees MUST be an object
    const subtrees = implicitTiling.subtrees;
    const subtreesPath = path + "/subtrees";
    if (
      !BasicValidator.validateObject(
        subtreesPath,
        "subtrees",
        subtrees,
        context
      )
    ) {
      result = false;
    } else {
      // Validate the subtrees uri
      // The uri MUST be a template URI
      const subtreesUri = subtrees.uri;
      const subtreesUriPath = subtreesPath + "/uri";
      if (
        !TemplateUriValidator.validateTemplateUri(
          subtreesUriPath,
          "uri",
          subtreesUri,
          subdivisionScheme,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }
}
