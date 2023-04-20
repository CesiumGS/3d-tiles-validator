import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";

import { ClassProperties } from "3d-tiles-tools";
import { MetadataValueValidator } from "./MetadataValueValidator";

import { ClassProperty } from "3d-tiles-tools";

import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";

/**
 * A class for validations of metadata values against the definitions
 * from a `ClassProperty` from a metadata schema.
 *
 * The methods in this class assume that the property definitions
 * have already been validated with the `ClassPropertyValidator`.
 *
 * @internal
 */
export class ClassPropertyValueValidator {
  /**
   * Validates that the given value is a proper `max` or `min` value
   * for the given property.
   *
   * If the property does not have a numeric type, then a
   * `METADATA_MIN_MAX_FOR_NON_NUMERIC_TYPE` validation
   * issue will be added to the given context.
   *
   * If the structure of the given value does not match the
   * structure that is defined by the property type, then an
   * appropriate issue will be added to the given context.
   *
   * @param propertyPath - The path for the `ValidationIssue` instances
   * @param propertyName - The name for the `ValidationIssue` instances
   * @param property - The `ClassProperty`
   * @param maxOrMin - The name, "max" or "min"
   * @param value - The actual value
   * @param context - The `ValidationContext`
   * @returns Whether the object was valid
   */
  static validateMaxMin(
    propertyPath: string,
    propertyName: string,
    property: ClassProperty,
    maxOrMin: string,
    value: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    const path = propertyPath + "/" + maxOrMin;
    const type = property.type;

    // When the max/min is given, the property MUST have a numeric type
    if (!ClassProperties.hasNumericType(property)) {
      const issue =
        MetadataValidationIssues.METADATA_MIN_MAX_FOR_NON_NUMERIC_TYPE(
          path,
          propertyName,
          maxOrMin,
          type
        );
      context.addIssue(issue);
      result = false;
    } else {
      // The offset/scale property MUST NOT be given
      // for variable-length arrays
      if (property.array === true && !defined(property.count)) {
        const issue =
          MetadataValidationIssues.METADATA_PROPERTY_INVALID_FOR_VARIABLE_LENGTH_ARRAY(
            path,
            propertyName,
            maxOrMin
          );
        context.addIssue(issue);
        result = false;
      } else {
        // The max/min MUST match the structure of the defined type
        if (
          !MetadataValueValidator.validateNumericValueStructure(
            property,
            path,
            maxOrMin,
            value,
            context
          )
        ) {
          result = false;
        }
      }
    }
    return result;
  }

  /**
   * Validates that the given value is a proper `offset` or `scale` value
   * for the given property.
   *
   * If the property does not have a numeric type, then a
   * `METADATA_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE` validation
   * issue will be added to the given context.
   *
   * If the structure of the given value does not match the
   * structure that is defined by the property type, then an
   * appropriate issue will be added to the given context.
   *
   * @param propertyPath - The path for the `ValidationIssue` instances
   * @param propertyName - The name for the `ValidationIssue` instances
   * @param property - The `ClassProperty`
   * @param offsetOrScale - The name, "offset" or "scale"
   * @param value - The actual value
   * @param context - The `ValidationContext`
   * @returns Whether the object was valid
   */
  static validateOffsetScale(
    propertyPath: string,
    propertyName: string,
    property: ClassProperty,
    offsetOrScale: string,
    value: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    const path = propertyPath + "/" + offsetOrScale;
    const type = property.type;
    const componentType = property.componentType;
    const normalized = property.normalized;

    // When the offset/scale is given, the property MUST have a 'floating point type'
    if (!ClassProperties.hasEffectivelyFloatingPointType(property)) {
      const issue =
        MetadataValidationIssues.METADATA_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE(
          path,
          propertyName,
          offsetOrScale,
          type,
          componentType,
          normalized
        );
      context.addIssue(issue);
      result = false;
    } else {
      // The offset/scale property MUST NOT be given
      // for variable-length arrays
      if (property.array === true && !defined(property.count)) {
        const issue =
          MetadataValidationIssues.METADATA_PROPERTY_INVALID_FOR_VARIABLE_LENGTH_ARRAY(
            path,
            propertyName,
            offsetOrScale
          );
        context.addIssue(issue);
        result = false;
      } else {
        // The offset/scale MUST match the structure of the defined type
        if (
          !MetadataValueValidator.validateNumericValueStructure(
            property,
            path,
            offsetOrScale,
            value,
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
