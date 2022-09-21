import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";

import { Properties } from "../structure/Properties";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A class for validations related to `tileset.properties` objects. Aplogies
 * for the confusing name...
 *
 * @private
 */
export class PropertiesValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `tileset.properties` object.
   *
   * @param properties The object to validate
   * @param context The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateProperties(
    properties: Properties,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        "/properties",
        "properties",
        properties,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate all entries of the properties dictionary
    for (const [key, value] of Object.entries(properties)) {
      // TODO Technically, the key should be validated to be in the batch table...
      const path = "/properties/" + key;

      // The value MUST be an object
      if (!BasicValidator.validateObject(path, key, value, context)) {
        result = false;
      } else {
        // The minimum and maximum MUST be defined and be numbers
        const minimum = value.minimum;
        const maximum = value.maximum;
        const minimumIsValid = BasicValidator.validateNumber(
          path + "/minimum",
          "minimum",
          minimum,
          context
        );
        const maximumIsValid = BasicValidator.validateNumber(
          path + "/maximum",
          "maximum",
          maximum,
          context
        );
        if (minimumIsValid && maximumIsValid) {
          // The MUST NOT be larger than the maximum
          if (minimum > maximum) {
            const message =
              `The minimum may not be larger than the maximum, ` +
              `but the minimum is ${minimum} and the maximum is ${maximum}`;
            const issue =
              SemanticValidationIssues.PROPERTIES_MINIMUM_LARGER_THAN_MAXIMUM(
                path,
                message
              );
            context.addIssue(issue);
            result = false;
          }
        }
      }
    }
    return result;
  }
}
