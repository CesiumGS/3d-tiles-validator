import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A class for validating extension declarations that may appear
 * as `extensionsUsed` and `extensionsRequired` arrays in a
 * tileset or the `3DTILES_content_gltf` extension.
 *
 * @internal
 */
export class ExtensionsDeclarationsValidator {
  /**
   * Validate the consistency of the given extension declarations.
   *
   * This will check whether the given `extensionsUsed` and
   * `extensionRequired` declarations are consistent:
   *
   * - If the objects are defined, they are string arrays with
   *   at least length 1
   * - The elements in these arrays are unique
   * - Extensions that are "required" are also "used"
   *
   * @param path - The path for `ValidationIssue` instances
   * @param tileset - The `Tileset`
   * @param context - The `ValidationContext`
   * @returns Whether the declarations have been valid
   */
  static validateExtensionDeclarationConsistency(
    path: string,
    extensionsUsed: any,
    extensionsRequired: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // These are the actual sets of unique string values that
    // are found in 'extensionsUsed' and 'extensionsRequired'
    const actualExtensionsUsed = new Set<string>();
    const actualExtensionsRequired = new Set<string>();

    // Validate the extensionsUsed
    const extensionsUsedPath = path + "/extensionsUsed";
    if (defined(extensionsUsed)) {
      // The extensionsUsed MUST be an array of strings with
      // a length of at least 1
      if (
        !BasicValidator.validateArray(
          extensionsUsedPath,
          "extensionsUsed",
          extensionsUsed,
          1,
          undefined,
          "string",
          context
        )
      ) {
        result = false;
      } else {
        extensionsUsed.forEach((e: any) => actualExtensionsUsed.add(e));

        // The elements in extensionsUsed MUST be unique
        const elementsUnique = BasicValidator.validateArrayElementsUnique(
          extensionsUsedPath,
          "extensionsUsed",
          extensionsUsed,
          context
        );
        if (!elementsUnique) {
          result = false;
        }
      }
    }

    // Validate the extensionsRequired
    const extensionsRequiredPath = path + "/extensionsRequired";
    if (defined(extensionsRequired)) {
      // The extensionsRequired MUST be an array of strings with
      // a length of at least 1
      if (
        !BasicValidator.validateArray(
          extensionsRequiredPath,
          "extensionsRequired",
          extensionsRequired,
          1,
          undefined,
          "string",
          context
        )
      ) {
        result = false;
      } else {
        extensionsRequired.forEach((e: any) => actualExtensionsRequired.add(e));

        // The elements in extensionsRequired MUST be unique
        const elementsUnique = BasicValidator.validateArrayElementsUnique(
          extensionsRequiredPath,
          "extensionsRequired",
          extensionsRequired,
          context
        );
        if (!elementsUnique) {
          result = false;
        }
      }
    }

    // Each extension in extensionsRequired MUST also
    // appear in extensionsUsed.
    for (const extensionName of actualExtensionsRequired) {
      if (!actualExtensionsUsed.has(extensionName)) {
        const issue = SemanticValidationIssues.EXTENSION_REQUIRED_BUT_NOT_USED(
          extensionsUsedPath,
          extensionName
        );
        context.addIssue(issue);
        result = false;
      }
    }
    return result;
  }
}
