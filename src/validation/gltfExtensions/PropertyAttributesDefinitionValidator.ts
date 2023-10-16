import { defined } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";
import { ValidatedElement } from "../ValidatedElement";
import { BasicValidator } from "../BasicValidator";
import { PropertyAttributeValidator } from "./PropertyAttributeValidator";

import { StructureValidationIssues } from "../../issues/StructureValidationIssues";

/**
 * A class for validating the definition of property attributes.
 */
export class PropertyAttributesDefinitionValidator {
  /**
   * Validate the given definition of property attributes.
   *
   * The returned object will contain two properties:
   * - `wasPresent`: Whether property attributes have been given
   * - `validatedElement`: The validated `PropertyAttribute[]` object
   *
   * When no property attributes are given, then it will just return
   * `{false, undefined}`.
   *
   * If the given `schemaState` indicates that no schema was present,
   * or the property attributes have not been valid according to the
   * schema, then an error will be added to the given context,
   * and `{true, undefined}` is returned.
   *
   * The method will return `{true, propertyattributes}` only if the
   * given property attributes have been valid.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param name - The name of the object containing the definition
   * (for example, 'metadata extension object')
   * @param propertyattributes - The actual property attributes
   * @param gltf - The containing glTF object
   * @param schemaState - The state of the schema validation
   * @param context - The `ValidationContext`
   * @returns Information about the validity of the definition
   */
  static validatePropertyAttributesDefinition(
    path: string,
    name: string,
    propertyAttributes: any[] | undefined,
    schemaState: ValidatedElement<Schema>,
    context: ValidationContext
  ): ValidatedElement<any[]> {
    // Return immediately when there are no property attributes
    const propertyAttributesState: ValidatedElement<any[]> = {
      wasPresent: false,
      validatedElement: undefined,
    };
    if (!defined(propertyAttributes)) {
      return propertyAttributesState;
    }

    // There are property attributes.
    propertyAttributesState.wasPresent = true;

    // Validate the propertyAttributes, returning as soon as they
    // have been determined to be invalid
    const propertyAttributesPath = path + "/propertyAttributes";
    if (!schemaState.wasPresent) {
      // If there are property attributes, then there MUST be a schema definition
      const message =
        `The ${name} defines 'propertyAttributes' but ` +
        `there was no schema definition`;
      const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      return propertyAttributesState;
    }
    if (defined(schemaState.validatedElement)) {
      // The propertyAttributes MUST be an array of at least 1 objects
      if (
        !BasicValidator.validateArray(
          propertyAttributesPath,
          "propertyAttributes",
          propertyAttributes,
          1,
          undefined,
          "object",
          context
        )
      ) {
        return propertyAttributesState;
      }
      // Validate each propertyAttribute
      for (let i = 0; i < propertyAttributes.length; i++) {
        const propertyAttribute = propertyAttributes[i];
        const propertyAttributePath = propertyAttributesPath + "/" + i;
        if (
          !PropertyAttributeValidator.validatePropertyAttribute(
            propertyAttributePath,
            propertyAttribute,
            schemaState.validatedElement,
            context
          )
        ) {
          return propertyAttributesState;
        }
      }
    }

    // The property attributes have been determined to be valid.
    // Return them as the validatedElement in the returned
    // state:
    propertyAttributesState.validatedElement = propertyAttributes;
    return propertyAttributesState;
  }
}
