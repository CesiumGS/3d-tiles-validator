import { defined } from "../../base/defined";

import { ValidationContext } from "../ValidationContext";

import { MetadataValueValidator } from "./MetadataValueValidator";

import { MetadataTypes } from "../../metadata/MetadataTypes";

import { ClassProperty } from "../../structure/Metadata/ClassProperty";

import { SemanticValidationIssues } from "../../issues/SemanticValidationIssues";
import { MetadataComponentTypes } from "../../metadata/MetadataComponentTypes";

/**
 * A class for validations of metadata values against the definitions
 * from a `ClassProperty` from a metadata schema.
 *
 * The methods in this class assume that the property definitions
 * have already been validated with the `ClassPropertyValidator`.
 *
 * @private
 */
export class ClassPropertyValueValidator {
  /**
   * Validates that the given value is a proper `max` or `min` value
   * for the given property.
   *
   * If the property does not have a numeric type, then a
   * `CLASS_PROPERTY_MIN_MAX_FOR_NON_NUMERIC_TYPE` validation
   * issue will be added to the given context.
   *
   * If the structure of the given value does not match the
   * structure that is defined by the property type, then an
   * appropriate issue will be added to the given context.
   *
   * @param propertyPath The path for the `ValidationIssue` instances
   * @param propertyName The name for the `ValidationIssue` instances
   * @param property The `ClassProperty`
   * @param maxOrMin The name, "max" or "min"
   * @param value The actual value
   * @param context The `ValidationContext`
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
    if (!ClassPropertyValueValidator.hasNumericType(property)) {
      const issue =
        SemanticValidationIssues.CLASS_PROPERTY_MIN_MAX_FOR_NON_NUMERIC_TYPE(
          path,
          propertyName,
          maxOrMin,
          type
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
    return result;
  }

  /**
   * Validates that the given value is a proper `offset` or `scale` value
   * for the given property.
   *
   * If the property does not have a numeric type, then a
   * `CLASS_PROPERTY_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE` validation
   * issue will be added to the given context.
   *
   * If the structure of the given value does not match the
   * structure that is defined by the property type, then an
   * appropriate issue will be added to the given context.
   *
   * @param propertyPath The path for the `ValidationIssue` instances
   * @param propertyName The name for the `ValidationIssue` instances
   * @param property The `ClassProperty`
   * @param offsetOrScale The name, "offset" or "scale"
   * @param value The actual value
   * @param context The `ValidationContext`
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
    if (
      !ClassPropertyValueValidator.hasEffectivelyFloatingPointType(property)
    ) {
      const issue =
        SemanticValidationIssues.CLASS_PROPERTY_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE(
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
    return result;
  }

  /**
   * Returns whether the given property effectively describes a floating
   * point type.
   *
   * These are the properties for which 'offset' and 'scale' may be defined.
   *
   * This means that the value has the type SCALAR, VECn, or MATn, and
   * - either has the componentType FLOAT32 or FLOAT46
   * - or has an integer component type AND is 'normalized'
   *
   * @param property The property
   * @returns Whether the property is a floating point property
   */
  private static hasEffectivelyFloatingPointType(
    property: ClassProperty
  ): boolean {
    const type = property.type;
    if (!MetadataTypes.numericTypes.includes(type)) {
      return false;
    }
    const componentType = property.componentType;
    if (!defined(componentType)) {
      return false;
    }
    if (componentType === "FLOAT32" || componentType === "FLOAT64") {
      return true;
    }
    if (MetadataComponentTypes.isIntegerComponentType(componentType!)) {
      const normalized = property.normalized;
      if (!defined(normalized)) {
        return false;
      }
      return normalized!;
    }
    return false;
  }

  /**
   * Returns whether the given property describes a numeric type.
   *
   * These are the properties for which 'max' and 'min' may be defined.
   *
   * This means tha the value has the type SCALAR, VECn, or MATn, and
   * one of the allowed component types.
   *
   * @param property The property
   * @returns Whether the property is a numeric property
   */
  private static hasNumericType(property: ClassProperty): boolean {
    const type = property.type;
    if (!MetadataTypes.numericTypes.includes(type)) {
      return false;
    }
    const componentType = property.componentType;
    if (!defined(componentType)) {
      return false;
    }
    if (!MetadataComponentTypes.allComponentTypes.includes(componentType!)) {
      return false;
    }
    return true;
  }
}
