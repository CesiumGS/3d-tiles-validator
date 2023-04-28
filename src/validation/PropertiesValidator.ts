import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { ExtendedObjectsValidators } from "./ExtendedObjectsValidators";

import { Properties } from "3d-tiles-tools";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A class for validations related to `tileset.properties` objects. Aplogies
 * for the confusing name...
 *
 * @internal
 */
export class PropertiesValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `tileset.properties` object.
   *
   * Note that the `tileset.properties` is actually a dictionary,
   * that maps names to `Properties` objects (which, despite
   * the name, are actually a single property description)
   *
   * @param properties - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateProperties(
    tilesetProperties: { [key: string]: Properties },
    context: ValidationContext
  ): boolean {
    const path = "/properties";

    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "properties",
        tilesetProperties,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate all entries of the properties dictionary
    for (const [key, value] of Object.entries(tilesetProperties)) {
      // TODO Technically, the key should be validated to be in the batch table...
      if (PropertiesValidator.validateSingleProperties(key, value, context)) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Performs the validation to ensure that the given object is a
   * valid `Properties` object.
   *
   * Note that the `Properties` type (despite the name) represents only
   * a single property - i.e. one value in the `tileset.properties`
   * dictionary.
   *
   * @param name - The property name
   * @param properties - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateSingleProperties(
    name: string,
    properties: Properties,
    context: ValidationContext
  ): boolean {
    const path = "/properties/" + name;

    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, properties, context)) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        path,
        name,
        properties,
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
        properties,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(properties)) {
      return result;
    }

    // The minimum and maximum MUST be defined and be numbers
    const minimum = properties.minimum;
    const maximum = properties.maximum;
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
    return result;
  }
}
