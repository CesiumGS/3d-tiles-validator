import { defined } from "3d-tiles-tools";

import { Validator } from "./Validator";
import { ValidationContext } from "./ValidationContext";

import { RootProperty } from "3d-tiles-tools";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A class for managing the validation of objects that contain extensions.
 *
 * It allows registering `Validator` objects for specific extension
 * names. The `validateExtendedObject` function will be called for
 * each `RootProperty` (i.e. for each object that may contain
 * extensions). When an object contains an extension with one
 * of the registered names, then the respective validators will
 * be applied to that object.
 *
 * @internal
 */
export class ExtendedObjectsValidators {
  /**
   * The mapping from extension names to the validators that
   * are used for objects that contain the respective extension.
   */
  private static readonly extendedObjectValidators = new Map<
    string,
    Validator<any>
  >();

  /**
   * The mapping from extension names to the flag that indicates
   * whether the corresponding validator should override the
   * default validation process.
   */
  private static readonly overrides = new Map<string, boolean>();

  /**
   * Registers a validator for an object with the specified extension.
   *
   * When an object has the specified extension, then the given
   * validator will be applied to this object.
   *
   * @param extensionName - The name of the extension
   * @param extendedObjectValidator - The `Validator` for the extended objects
   * @param override - Whether the given validator should replace the
   * default validation. This can be queried with the `hasOverride` method.
   */
  static register(
    extensionName: string,
    extendedObjectValidator: Validator<any>,
    override: boolean
  ) {
    ExtendedObjectsValidators.extendedObjectValidators.set(
      extensionName,
      extendedObjectValidator
    );
    ExtendedObjectsValidators.overrides.set(extensionName, override);
  }

  /**
   * Returns whether the default validation of the given object
   * is overridden. This is the case when the object contains
   * an extension which has been registered by calling the
   * `register` method, with the `override` flag being `true`.
   *
   * @param rootProperty - The `RootProperty`
   * @returns Whether the default validation is overridden
   * by one of the registered validators.
   */
  static hasOverride(rootProperty: RootProperty): boolean {
    const extensions = rootProperty.extensions;
    if (!defined(extensions)) {
      return false;
    }
    const extensionNames = Object.keys(extensions);
    for (const extensionName of extensionNames) {
      const override = ExtendedObjectsValidators.overrides.get(extensionName);
      if (override === true) {
        return true;
      }
    }
    return false;
  }

  /**
   * Perform the validation of the given (possibly extended) object.
   *
   * If the given object does not have extensions, then `true` will
   * be returned.
   *
   * If there are extensions, then each of them will be examined:
   *
   * If a `Validator` instance has been registered for one of the
   * extensions (by calling the `register` method), then this
   * validator will be applied to the given object.
   *
   * (If no `Validator` instance has been registered, then
   * a warning will be added to the given context, indicating
   * that the extension is not supported)
   *
   * If any of the registered validators returns `false`, then
   * `false` will be returned. If all of them consider the object
   * to be valid, then `true` will be returned.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param rootProperty - The `RootProperty` that may contain extensions
   * @param context - The `ValidationContext`
   * @returns Whether the object is valid
   */
  static async validateExtendedObject(
    path: string,
    rootProperty: RootProperty,
    context: ValidationContext
  ): Promise<boolean> {
    // If there are no extensions, consider the object to be valid
    const extensions = rootProperty.extensions;
    if (!defined(extensions)) {
      return true;
    }
    // The extensions MUST be an object. This is checked and reported
    // by the RootPropertyValidator, and therefore, will not reported
    // again here
    if (typeof extensions !== "object") {
      return true;
    }

    let allValid = true;

    const extensionNames = Object.keys(extensions);
    for (const extensionName of extensionNames) {
      const extendedObjectValidator =
        ExtendedObjectsValidators.extendedObjectValidators.get(extensionName);

      // If an extension was found, but no validator for
      // that extension was registered, then issue a
      // warning.
      if (!defined(extendedObjectValidator)) {
        const issue = SemanticValidationIssues.EXTENSION_NOT_SUPPORTED(
          path,
          extensionName
        );
        context.addIssue(issue);
      } else {
        // Validate the object with the registered Validator
        const isValid = await extendedObjectValidator.validateObject(
          path,
          rootProperty,
          context
        );
        if (!isValid) {
          allValid = false;
        }
      }
    }
    return allValid;
  }
}
