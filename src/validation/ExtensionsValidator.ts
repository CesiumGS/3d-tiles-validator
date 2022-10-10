import { defined } from "../base/defined";

import { Validator } from "./Validator";
import { ValidationContext } from "./ValidationContext";

import { RootProperty } from "../structure/RootProperty";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";
import { ExtensionsValidationResult } from "./ExtensionsValidationResult";

/**
 * @private
 * @experimental
 */
export class ExtensionsValidator {
  static readonly extensionValidators = new Map<
    string,
    Validator<any>
  >();
  static readonly performDefaultValidations = new Map<string, boolean>();

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

  static async validateExtensions(
    path: string,
    name: string,
    rootProperty: RootProperty,
    context: ValidationContext
  ): Promise<ExtensionsValidationResult> {

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
      if (!defined(extensionValidator)) {
        const issue = SemanticValidationIssues.EXTENSION_NOT_SUPPORTED(
          path,
          extensionName
        );
        context.addIssue(issue);
      } else {
        const extension = extensions![extensionName];
        const isValid = await ExtensionsValidator.validateExtension(
          path,
          extensionName,
          extension,
          extensionValidator!,
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

  private static async validateExtension(
    path: string,
    name: string,
    extension: any,
    extensionValidator: Validator<any>,
    context: ValidationContext
  ): Promise<boolean> {
    const result = await extensionValidator.validateObject(extension, context);
    return result;
  }
}
