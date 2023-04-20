import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";

import { RootProperty } from "3d-tiles-tools";

import { JsonValidationIssues } from "../issues/JsonValidationIssues";

/**
 * A class for validations related to `rootProperty` objects.
 * This is the "base class" of the schema definitions that
 * nearly all schemas of the 3D Tiles specification refer to,
 * and which defines the `extensions` and `extras` properties.
 *
 * @internal
 */
export class RootPropertyValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `rootProperty` object.
   *
   * This will add all extension names that are found to the
   * given validation context.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param name - The name of the object
   * @param rootProperty - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateRootProperty(
    path: string,
    name: string,
    rootProperty: RootProperty,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, rootProperty, context)) {
      return false;
    }

    let result = true;

    // Validate the extensions
    const extensions = rootProperty.extensions;
    const extensionsPath = path + "/extensions";
    if (defined(extensions)) {
      // The extensions MUST be an object
      if (
        !BasicValidator.validateObject(
          extensionsPath,
          "extensions",
          extensions,
          context
        )
      ) {
        result = false;
      } else {
        // Each value of the extensions MUST be an object
        const extensionNames = Object.keys(extensions);
        for (const extensionName of extensionNames) {
          const extension = extensions[extensionName];
          const extensionPath = extensionsPath + "/" + extensionName;
          if (
            !BasicValidator.validateObject(
              extensionPath,
              extensionName,
              extension,
              context
            )
          ) {
            result = false;
          } else {
            context.addExtensionFound(extensionName);
          }
        }
      }
    }

    // Validate the extras
    const extras = rootProperty.extras;
    const extrasPath = path + "/extras";
    if (defined(extras)) {
      // The extras may have any type. But when they are
      // not an object, a warning will be generated.
      if (typeof extras !== "object") {
        const issue = JsonValidationIssues.TYPE_UNEXPECTED(
          extrasPath,
          "extras",
          "object",
          typeof extras
        );
        context.addIssue(issue);
      }
    }

    return result;
  }
}
