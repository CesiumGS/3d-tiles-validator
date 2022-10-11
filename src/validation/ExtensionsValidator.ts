import { defined } from "../base/defined";

import { Validator } from "./Validator";
import { ValidationContext } from "./ValidationContext";

import { RootProperty } from "../structure/RootProperty";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";
import { ExtensionsValidationResult } from "./ExtensionsValidationResult";

/**
 * A class for managing the validation of extensions.
 * 
 * It allows registering `Validator` objects for specific extension
 * names. The `validateExtensions` function will be called for
 * each `RootProperty` (i.e. for each object that may contain
 * extensions). When an object with a known extension name is
 * found, then the registered validator will be applied to that
 * object.
 */
export class ExtensionsValidator {

  /**
   * The mapping from extension names to `Validator` objects
   * for the respective extension
   */
  static readonly extensionValidators = new Map<
    string,
    Validator<any>
  >();

  /**
   * A mapping from extension names to a flag indicating whether 
   * the default validation will still be performed when the
   * respective extension is present.
   */
  static readonly performDefaultValidations = new Map<string, boolean>();

  /**
   * Registers a validator for the specified extension.
   * 
   * When an extension object with the given name is found, then
   * the given validator will be applied to this object in the
   * `validateExtensions` method. 
   * 
   * @param extensionName The name of the extension
   * @param extensionValidator The `Validator` for the extension
   * @param performDefaultValidation Whether a default validation
   * should be performed for an object, even when the specified
   * extension is present.
   */
  static register(
    extensionName: string,
    extensionValidator: Validator<any>,
    performDefaultValidation: boolean
  ) {
    ExtensionsValidator.extensionValidators.set(
      extensionName,
      extensionValidator
    );
    ExtensionsValidator.performDefaultValidations.set(
      extensionName,
      performDefaultValidation
    );
  }

  /**
   * Perform the validation of the extensions in the given object.
   * 
   * This will check the `extensions` of the given object. If there
   * are no extensions, then a `ExtensionsValidationResult` will be
   * returned that indicates that all extensions are valid, and 
   * the default validation should be performed.
   * 
   * If there are extensions, then each of them will be examined:
   * If a `Validator` instance has been registered for one of
   * them (by calling the `register` method), then this validator
   * will be applied to the extension object. 
   * 
   * The `ExtensionsValidationResult` will contain information 
   * about whether all extensions have been valid, and whether
   * a default validation should still be peformed.
   * 
   * (If any of the relevant extension validators was registered with 
   * `performDefaultValidation===false`, then the `performDefaultValidation`
   * flag in the result will be `false`)
   * 
   * @param path The path for `ValidationIssue` instances
   * @param rootProperty The `RootProperty` that may contain extensions
   * @param context The `ValidationContext`
   * @returns The `ExtensionsValidationResult`
   */
  static async validateExtensions(
    path: string,
    rootProperty: RootProperty,
    context: ValidationContext
  ): Promise<ExtensionsValidationResult> {

    // If there are no extension, just return a positive result
    const extensions = rootProperty.extensions;
    if (!defined(extensions)) {
      return {
        allValid: true,
        performDefaultValidation: true,
      };
    }


    let allValid = true;
    let performDefaultValidation = true;

    const extensionNames = Object.keys(extensions!);
    for (const extensionName of extensionNames) {
      const extensionValidator =
        ExtensionsValidator.extensionValidators.get(extensionName);

      // If an extension was found, but no validator for
      // that extension was registered, then issue a 
      // warning.
      if (!defined(extensionValidator)) {
        const issue = SemanticValidationIssues.EXTENSION_NOT_SUPPORTED(
          path,
          extensionName
        );
        context.addIssue(issue);
      } else {

        // Validate the extension with the registered Validator
        const extension = extensions![extensionName];
        const extensionPath = path + "/" + extensionName;
        const isValid = await extensionValidator!.validateObject(
          extensionPath,
          extension,
          context
        );
        if (!isValid) {
          allValid = false;
        }
        const performDefault =
          ExtensionsValidator.performDefaultValidations.get(extensionName);
        if (performDefault === false) {
          performDefaultValidation = false;
        }
      }
    }
    return {
      allValid: allValid,
      performDefaultValidation: performDefaultValidation,
    };
  }

}
