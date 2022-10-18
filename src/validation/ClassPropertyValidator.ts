import { defined } from "../base/defined";
import { defaultValue } from "../base/defaultValue";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";
import { MetadataValueValidator } from "./MetadataValueValidator";

import { Schema } from "../structure/Metadata/Schema";
import { ClassProperty } from "../structure/Metadata/ClassProperty";

import { MetadataTypes } from "../metadata/MetadataTypes";
import { MetadataComponentTypes } from "../metadata/MetadataComponentTypes";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";
import { JsonValidationIssues } from "../issues/JsonValidationIssues";

/**
 * A class for validations related to `class.property` objects.
 *
 * @private
 */
export class ClassPropertyValidator {
  /**
   * Validates that the given object is a valid `class.property` object.
   *
   * @param schema The `Schema`
   * @param propertyPath The path for the `ValidationIssue` instances
   * @param propertyName The name of the property
   * @param property The property
   * @param context The `ValidationContext`
   * @returns Whether the object was valid
   */
  static validateClassProperty(
    schema: Schema,
    propertyPath: string,
    propertyName: string,
    property: ClassProperty | undefined,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        propertyPath,
        propertyName,
        property,
        context
      )
    ) {
      return false;
    }
    return ClassPropertyValidator.validateClassPropertyInternal(
      schema,
      propertyPath,
      propertyName,
      property!,
      context
    );
  }

  /**
   * Internal method for `validateClassProperty` that just
   * assumes that the property is defined and an `"object"`.
   *
   * @param schema The `Schema`
   * @param propertyPath The path for the `ValidationIssue` instances
   * @param propertyName The name of the property
   * @param property The property
   * @param context The `ValidationContext`
   * @returns Whether the object was valid
   */
  private static validateClassPropertyInternal(
    schema: Schema,
    propertyPath: string,
    propertyName: string,
    property: ClassProperty,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate the name.
    // If the name is defined, it MUST be a string.
    if (
      !BasicValidator.validateOptionalString(
        propertyPath,
        property,
        "name",
        context
      )
    ) {
      result = false;
    }

    // Validate the description.
    // If the description is defined, it MUST be a string.
    if (
      !BasicValidator.validateOptionalString(
        propertyPath,
        property,
        "description",
        context
      )
    ) {
      result = false;
    }

    // Validate the type
    // The type MUST be defined
    // The type MUST be a string
    const type = property.type;
    const typePath = propertyPath + "/type";
    if (!BasicValidator.validateString(typePath, "type", type, context)) {
      result = false;
    } else {
      // The type MUST be one of the allowed types
      if (
        !BasicValidator.validateEnum(
          typePath,
          "type",
          type,
          MetadataTypes.allTypes,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the componentType
    const componentType = property.componentType;
    const componentTypePath = propertyPath + "/componentType";
    const isNumericType = MetadataTypes.isNumericType(type);
    if (isNumericType && !defined(componentType)) {
      // For numeric types (SCALAR, VECn, or MATn) the
      // componentType MUST be defined
      if (isNumericType) {
        const issue =
          SemanticValidationIssues.CLASS_PROPERTY_COMPONENT_TYPE_MISSING(
            componentTypePath,
            type
          );
        context.addIssue(issue);
        result = false;
      }
    }
    if (!isNumericType && defined(componentType)) {
      // For non-numeric types the componentType MUST NOT be defined
      const issue =
        SemanticValidationIssues.CLASS_PROPERTY_COMPONENT_TYPE_WITH_INVALID_TYPE(
          componentTypePath,
          componentType!,
          type
        );
      context.addIssue(issue);
      result = false;
    } else if (defined(componentType)) {
      // The componentType MUST be a string
      if (
        !BasicValidator.validateString(
          componentTypePath,
          "componentType",
          componentType,
          context
        )
      ) {
        result = false;
      } else {
        // The componentType MUST be one of the allowed types
        if (
          !BasicValidator.validateEnum(
            componentTypePath,
            "componentType",
            componentType,
            MetadataComponentTypes.allComponentTypes,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate the enumType
    const enumType = property.enumType;
    const enumTypePath = propertyPath + "/enumType";

    // When the type is "ENUM", then the enumType MUST be defined
    if (type === "ENUM" && !defined(enumType)) {
      const issue =
        SemanticValidationIssues.CLASS_PROPERTY_ENUM_TYPE_WITHOUT_ENUMTYPE(
          propertyPath
        );
      context.addIssue(issue);
      result = false;
    } else if (type !== "ENUM" && defined(enumType)) {
      // When the type is not "ENUM", then the enumType MUST NOT be defined
      const issue =
        SemanticValidationIssues.CLASS_PROPERTY_ENUMTYPE_WITH_NON_ENUM_TYPE(
          enumTypePath,
          enumType!,
          type
        );
      context.addIssue(issue);
      result = false;
    } else if (defined(enumType)) {
      // The enumType MUST be a string
      if (
        !BasicValidator.validateString(
          enumTypePath,
          "enumType",
          enumType,
          context
        )
      ) {
        result = false;
      } else {
        // When the enumType is defined, then the schema MUST
        // define an enum with this name
        const enums = defaultValue(schema.enums, {});
        if (!Object.keys(enums).includes(enumType!)) {
          const issue =
            SemanticValidationIssues.CLASS_PROPERTY_ENUMTYPE_NOT_FOUND(
              propertyPath,
              propertyName,
              enumType!
            );
          context.addIssue(issue);
          result = false;
        }
      }
    }

    // Validate the 'array' property
    const array = property.array;
    const arrayPath = propertyPath + "/array";
    if (defined(array)) {
      // The array MUST be a boolean
      if (!BasicValidator.validateBoolean(arrayPath, "array", array, context)) {
        result = false;
      }
    }

    // Validate the count
    const count = property.count;
    const countPath = propertyPath + "/count";
    if (defined(count)) {
      // The count MUST be an integer
      // The count MUST be at least 2
      if (
        !BasicValidator.validateIntegerRange(
          countPath,
          "count",
          count!,
          2,
          true,
          undefined,
          false,
          context
        )
      ) {
        result = false;
      }

      // When the count is defined, then the property MUST be an array
      if (!array) {
        const issue =
          SemanticValidationIssues.CLASS_PROPERTY_COUNT_FOR_NON_ARRAY(
            propertyPath,
            propertyName
          );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate the 'normalized' property
    const normalized = property.normalized;
    const normalizedPath = propertyPath + "/normalized";
    if (defined(normalized)) {
      // The normalized MUST be a boolean
      if (
        !BasicValidator.validateBoolean(
          normalizedPath,
          "normalized",
          normalized,
          context
        )
      ) {
        result = false;
      }

      if (normalized) {
        // If normalized is 'true', then the type MUST be one
        // of the numeric types (SCALAR, VECn, MATn)
        if (!MetadataTypes.isNumericType(type)) {
          const issue =
            SemanticValidationIssues.CLASS_PROPERTY_NORMALIZED_FOR_NON_NORMALIZABLE_TYPE(
              propertyPath,
              propertyName,
              type
            );
          context.addIssue(issue);
          result = false;
        }
        if (defined(componentType)) {
          // If normalized is 'true', then the componentType (if present)
          // MUST be an integer type
          if (!MetadataComponentTypes.isIntegerComponentType(componentType!)) {
            const issue =
              SemanticValidationIssues.CLASS_PROPERTY_NORMALIZED_FOR_NON_INTEGER_COMPONENT_TYPE(
                propertyPath,
                propertyName,
                componentType!
              );
            context.addIssue(issue);
            result = false;
          }
        }
      }
    }

    // Validate the offset
    const offset = property.offset;
    if (defined(offset)) {
      if (
        !ClassPropertyValidator.validateOffsetScale(
          propertyPath,
          propertyName,
          property,
          "offset",
          offset,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the scale
    const scale = property.scale;
    if (defined(scale)) {
      if (
        !ClassPropertyValidator.validateOffsetScale(
          propertyPath,
          propertyName,
          property,
          "scale",
          scale,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the max
    const max = property.max;
    if (defined(max)) {
      if (
        !ClassPropertyValidator.validateMaxMin(
          propertyPath,
          propertyName,
          property,
          "max",
          max,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the min
    const min = property.min;
    if (defined(min)) {
      if (
        !ClassPropertyValidator.validateMaxMin(
          propertyPath,
          propertyName,
          property,
          "min",
          min,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the 'required' property
    const required = property.required;
    const requiredPath = propertyPath + "/required";
    if (defined(required)) {
      // The required MUST be a boolean
      if (
        !BasicValidator.validateBoolean(
          requiredPath,
          "required",
          required,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the 'noData' property
    const noData = property.noData;
    const noDataPath = propertyPath + "/noData";
    if (defined(noData)) {
      if (required) {
        // The noData value MUST not be given for 'required' properties
        const message =
          `The property '${propertyName}' defines a 'noData' ` +
          `value, but is 'required'`;
        const issue = SemanticValidationIssues.CLASS_PROPERTY_TYPE_ERROR(
          noDataPath,
          message
        );
        context.addIssue(issue);
        result = false;
      } else if (type === "BOOLEAN") {
        // The noData value MUST not be given for BOOLEAN types
        const message =
          `The property '${propertyName}' defines a 'noData' ` +
          `value, but has the type 'BOOLEAN'`;
        const issue = SemanticValidationIssues.CLASS_PROPERTY_TYPE_ERROR(
          noDataPath,
          message
        );
        context.addIssue(issue);
        result = false;
      } else {
        // Validate the structure of the noData value
        if (
          !MetadataValueValidator.validateValueStructure(
            propertyPath,
            propertyName,
            property,
            "noData",
            noData,
            schema,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate the 'default' property
    const theDefault = property.default;
    const defaultPath = propertyPath + "/default";
    if (defined(theDefault)) {
      if (required) {
        // The default value MUST not be given for 'required' properties
        const message =
          `The property '${propertyName}' defines a 'default' ` +
          `value, but is 'required'`;
        const issue = SemanticValidationIssues.CLASS_PROPERTY_TYPE_ERROR(
          defaultPath,
          message
        );
        context.addIssue(issue);
        result = false;
      } else {
        // Validate the structure of the default value
        if (
          !MetadataValueValidator.validateValueStructure(
            propertyPath,
            propertyName,
            property,
            "default",
            theDefault,
            schema,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate the semantic
    const semantic = property.semantic;
    const semanticPath = propertyPath + "/semantic";
    if (defined(semantic)) {
      // The semantic MUST be a string
      if (
        !BasicValidator.validateString(
          semanticPath,
          "semantic",
          semantic,
          context
        )
      ) {
        result = false;
      } else {
        // The semantic string MUST have a length of at least 1
        const minLength = 1;
        if (semantic!.length < minLength) {
          const message =
            `The 'semantic' must have a length of least ${minLength}, ` +
            `but has a length of ${semantic!.length}`;
          const issue = JsonValidationIssues.STRING_LENGTH_MISMATCH(
            semanticPath,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      }
    }
    return result;
  }

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
  private static validateMaxMin(
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
    if (!ClassPropertyValidator.hasNumericType(property)) {
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
  private static validateOffsetScale(
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
    if (!ClassPropertyValidator.hasEffectivelyFloatingPointType(property)) {
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
  static hasEffectivelyFloatingPointType(
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
