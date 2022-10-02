import { defined } from "../base/defined";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";

import { MetadataComponentTypes } from "../metadata/MetadataComponentTypes";

import { SchemaEnum } from "../structure/Metadata/SchemaEnum";
import { EnumValue } from "../structure/Metadata/EnumValue";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";
import { NumberValidator } from "./NumberValidator";

/**
 * A class for validations related to `SchemaEnum` objects.
 *
 * @private
 */
export class SchemaEnumValidator {
  /**
   * Validate the given `SchemaEnum` object
   *
   * @param schemaEnumPath The path for `ValidationIssue` instances
   * @param enumName The name of the enum
   * @param schemaEnum The actual `SchemaEnum`
   * @param context The `ValidatonContext`
   * @returns Whether the object was valid
   */
  static validateSchemaEnum(
    schemaEnumPath: string,
    enumName: string,
    schemaEnum: SchemaEnum,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        schemaEnumPath,
        enumName,
        schemaEnum,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        schemaEnumPath,
        enumName,
        schemaEnum,
        context
      )
    ) {
      result = false;
    }

    // Validate the name.
    // If the name is defined, it MUST be a string.
    if (
      !BasicValidator.validateOptionalString(
        schemaEnumPath,
        schemaEnum,
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
        schemaEnumPath,
        schemaEnum,
        "description",
        context
      )
    ) {
      result = false;
    }

    // Validate the valueType
    let validatedValueType = undefined;
    const valueType = schemaEnum.valueType;
    const valueTypePath = schemaEnumPath + "/valueType";
    if (!defined(valueType)) {
      validatedValueType = "UINT16";
    } else {
      // The valueType MUST be a string
      if (
        !BasicValidator.validateString(
          valueTypePath,
          "valueType",
          valueType,
          context
        )
      ) {
        result = false;
      } else {
        // The valueType MUST be one of the allowed types
        if (
          !BasicValidator.validateEnum(
            valueTypePath,
            "valueType",
            valueType,
            MetadataComponentTypes.integerComponentTypes,
            context
          )
        ) {
          result = false;
        } else {
          validatedValueType = valueType;
        }
      }
    }

    // Validate the values
    const values = schemaEnum!.values;
    if (
      !SchemaEnumValidator.validateSchemaEnumValues(
        schemaEnumPath,
        values,
        validatedValueType,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validates the given `enum.values` array
   *
   * @param schemaEnumPath The path of the enum for `ValidationIssue` instances
   * @param values The actual values array
   * @param validatedValueType The valueType from the enum definition.
   * If there was no valueType definition, then this is the default
   * ("UINT16"). If the valueType was not valid, this is `undefined`.
   * @param context The `ValidationContext`
   * @returns Whether the enum values are valid
   */
  private static validateSchemaEnumValues(
    schemaEnumPath: string,
    values: EnumValue[],
    validatedValueType: string | undefined,
    context: ValidationContext
  ): boolean {
    const valuesPath = schemaEnumPath + "/values";
    // The values MUST be defined
    // The values MUST be an array of "object"
    // The values MUST have at least 1 item
    const minItems = 1;
    if (
      !BasicValidator.validateArray(
        valuesPath,
        "values",
        values,
        minItems,
        undefined,
        "object",
        context
      )
    ) {
      return false;
    }

    // Validate each value
    let result = true;
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const valuePath = valuesPath + "/" + i;
      if (
        !SchemaEnumValidator.validateSchemaEnumValue(
          valuePath,
          value,
          validatedValueType,
          context
        )
      ) {
        result = false;
      }
    }

    // If all values are valid, ensure that there are no
    // duplicates for `values[i].name` or `values[i].value`
    if (result) {
      if (
        !SchemaEnumValidator.validateUniqueNames(
          schemaEnumPath,
          values,
          context
        )
      ) {
        result = false;
      }
      if (
        !SchemaEnumValidator.validateUniqueValues(
          schemaEnumPath,
          values,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate that the names of the given enum values, as referred to
   * by `enum.values[i].name`, are unique.
   *
   * @param path The path for `ValidationIssue` instances
   * @param enumValues The actual `enum.values` array
   * @param context The `ValidationContext`
   * @returns Whether the names are unique
   */
  private static validateUniqueNames(
    path: string,
    enumValues: EnumValue[],
    context: ValidationContext
  ): boolean {
    let result = true;
    const array = enumValues.map((v) => v.name);
    for (let i = 0; i < array.length; i++) {
      const value = array[i];
      const index = array.indexOf(value);
      if (index != i) {
        const issue = SemanticValidationIssues.ENUM_VALUE_DUPLICATE_NAME(
          path,
          value
        );
        context.addIssue(issue);
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate that the values of the given enum values, as referred to
   * by `enum.values[i].value`, are unique.
   *
   * @param path The path for `ValidationIssue` instances
   * @param enumValues The actual `enum.values` array
   * @param context The `ValidationContext`
   * @returns Whether the values are unique
   */
  private static validateUniqueValues(
    path: string,
    enumValues: EnumValue[],
    context: ValidationContext
  ): boolean {
    let result = true;
    const array = enumValues.map((v) => v.value);
    for (let i = 0; i < array.length; i++) {
      const value = array[i];
      const index = array.indexOf(value);
      if (index != i) {
        const issue = SemanticValidationIssues.ENUM_VALUE_DUPLICATE_VALUE(
          path,
          value
        );
        context.addIssue(issue);
        result = false;
      }
    }
    return result;
  }

  /**
   * Validates a single `enum.values[i]` value
   *
   * @param enumValuePath The path for the `ValidationIssue` instances
   * @param enumValue The actual `EnumValue`
   * @param validatedValueType The valueType from the enum definition.
   * If there was no valueType definition, then this is the default
   * ("UINT16"). If the valueType was not valid, this is `undefined`.
   * @param context The `ValidationContext`
   * @returns Whether the `EnumValue` is valid
   */
  private static validateSchemaEnumValue(
    enumValuePath: string,
    enumValue: EnumValue,
    validatedValueType: string | undefined,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(enumValuePath, "value", enumValue, context)
    ) {
      return false;
    }

    let result = true;

    // Validate the name
    const name = enumValue.name;
    const namePath = enumValuePath + "/name";
    // The name MUST be defined
    // The name MUST be a string
    if (!BasicValidator.validateString(namePath, "name", name, context)) {
      result = false;
    }

    // Validate the description
    // If the description is defined, it MUST be a string
    if (
      !BasicValidator.validateOptionalString(
        enumValuePath,
        enumValue,
        "description",
        context
      )
    ) {
      result = false;
    }

    // Validate the value
    const value = enumValue.value;
    const valuePath = enumValuePath + "/value";
    // The name MUST be defined
    // The name MUST be an integer
    if (!BasicValidator.validateInteger(valuePath, "value", value, context)) {
      result = false;
    }

    if (defined(validatedValueType)) {
      if (
        !NumberValidator.validateRange(
          valuePath,
          "value",
          value,
          validatedValueType!,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }
}
