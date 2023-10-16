import { ClassProperty, defined } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";
import { ClassPropertyValueValidator } from "./ClassPropertyValueValidator";

import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";

/**
 * Methods for common validation tasks of metadata properties.
 *
 * The methods in this class assume that the class property definitions
 * have already been validated with the `ClassPropertyValidator`.
 *
 * @internal
 */
export class MetadataPropertyValidator {
  /**
   * Validates the given property object against the given class property
   * definition.
   *
   * The given object may be any object that defines the common elements
   * of a metadata property, namely `offset/scale/max/min`.
   *
   * This method will ensure that these elements are NOT given if the
   * given class property indicates a variable-length array. If they
   * are given, it will ensure that their structure matches the
   * structure that is defined by the class property definiton.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param property - The object to validate
   * @param propertyName - The name of the property
   * @param classProperty - The `ClassProperty` definition from the schema
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateOffsetScaleMaxMin(
    path: string,
    property: {
      offset?: any;
      scale?: any;
      max?: any;
      min?: any;
    },
    propertyName: string,
    classProperty: ClassProperty,
    context: ValidationContext
  ): boolean {
    const isVariableLengthArray =
      classProperty.array && !defined(classProperty.count);

    let result = true;

    // Validate the offset
    const offset = property.offset;
    if (defined(offset)) {
      // The 'offset' MUST not be given for variable-length arrays
      if (isVariableLengthArray) {
        const issue =
          MetadataValidationIssues.METADATA_PROPERTY_INVALID_FOR_VARIABLE_LENGTH_ARRAY(
            path,
            propertyName,
            "offset"
          );
        context.addIssue(issue);
        result = false;
      } else {
        if (
          !ClassPropertyValueValidator.validateOffsetScale(
            path,
            propertyName,
            classProperty,
            "offset",
            offset,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate the scale
    const scale = property.scale;
    if (defined(scale)) {
      // The 'scale' MUST not be given for variable-length arrays
      if (isVariableLengthArray) {
        const issue =
          MetadataValidationIssues.METADATA_PROPERTY_INVALID_FOR_VARIABLE_LENGTH_ARRAY(
            path,
            propertyName,
            "scale"
          );
        context.addIssue(issue);
        result = false;
      } else {
        if (
          !ClassPropertyValueValidator.validateOffsetScale(
            path,
            propertyName,
            classProperty,
            "scale",
            scale,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate the max
    const max = property.max;
    if (defined(max)) {
      // The 'max' MUST not be given for variable-length arrays
      if (isVariableLengthArray) {
        const issue =
          MetadataValidationIssues.METADATA_PROPERTY_INVALID_FOR_VARIABLE_LENGTH_ARRAY(
            path,
            propertyName,
            "max"
          );
        context.addIssue(issue);
        result = false;
      } else {
        if (
          !ClassPropertyValueValidator.validateMaxMin(
            path,
            propertyName,
            classProperty,
            "max",
            max,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate the min
    const min = property.min;
    if (defined(min)) {
      // The 'min' MUST not be given for variable-length arrays
      if (isVariableLengthArray) {
        const issue =
          MetadataValidationIssues.METADATA_PROPERTY_INVALID_FOR_VARIABLE_LENGTH_ARRAY(
            path,
            propertyName,
            "min"
          );
        context.addIssue(issue);
        result = false;
      } else {
        if (
          !ClassPropertyValueValidator.validateMaxMin(
            path,
            propertyName,
            classProperty,
            "min",
            min,
            context
          )
        ) {
          result = false;
        }
      }
    }
    return result;
  }
}
