import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { RootPropertyValidator } from "../RootPropertyValidator";
import { ExtendedObjectsValidators } from "../ExtendedObjectsValidators";
import { NumberValidator } from "../NumberValidator";

import { MetadataComponentTypes } from "3d-tiles-tools";

import { MetadataEnum } from "3d-tiles-tools";
import { EnumValue } from "3d-tiles-tools";

import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";

/**
 * A class for validations related to `MetadataEnum` objects.
 *
 * @internal
 */
export class MetadataEnumValidator {
  /**
   * Validate the given `MetadataEnum` object
   *
   * @param metadataEnumPath - The path for `ValidationIssue` instances
   * @param enumName - The name of the enum
   * @param metadataEnum - The actual `MetadataEnum`
   * @param context - The `ValidatonContext`
   * @returns Whether the object was valid
   */
  static validateMetadataEnum(
    metadataEnumPath: string,
    enumName: string,
    metadataEnum: MetadataEnum,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        metadataEnumPath,
        enumName,
        metadataEnum,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        metadataEnumPath,
        enumName,
        metadataEnum,
        context
      )
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(
        metadataEnumPath,
        metadataEnum,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(metadataEnum)) {
      return result;
    }

    // Validate the name.
    // If the name is defined, it MUST be a string.
    if (
      !BasicValidator.validateOptionalString(
        metadataEnumPath,
        metadataEnum,
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
        metadataEnumPath,
        metadataEnum,
        "description",
        context
      )
    ) {
      result = false;
    }

    // Validate the valueType
    let validatedValueType = undefined;
    const valueType = metadataEnum.valueType;
    const valueTypePath = metadataEnumPath + "/valueType";
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
    const values = metadataEnum.values;
    if (
      !MetadataEnumValidator.validateMetadataEnumValues(
        metadataEnumPath,
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
   * @param metadataEnumPath - The path of the enum for `ValidationIssue` instances
   * @param values - The actual values array
   * @param validatedValueType - The valueType from the enum definition.
   * If there was no valueType definition, then this is the default
   * ("UINT16"). If the valueType was not valid, this is `undefined`.
   * @param context - The `ValidationContext`
   * @returns Whether the enum values are valid
   */
  private static validateMetadataEnumValues(
    metadataEnumPath: string,
    values: EnumValue[],
    validatedValueType: string | undefined,
    context: ValidationContext
  ): boolean {
    const valuesPath = metadataEnumPath + "/values";
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
        !MetadataEnumValidator.validateMetadataEnumValue(
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
        !MetadataEnumValidator.validateUniqueNames(
          metadataEnumPath,
          values,
          context
        )
      ) {
        result = false;
      }
      if (
        !MetadataEnumValidator.validateUniqueValues(
          metadataEnumPath,
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
   * @param path - The path for `ValidationIssue` instances
   * @param enumValues - The actual `enum.values` array
   * @param context - The `ValidationContext`
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
        const issue = MetadataValidationIssues.ENUM_VALUE_DUPLICATE_NAME(
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
   * @param path - The path for `ValidationIssue` instances
   * @param enumValues - The actual `enum.values` array
   * @param context - The `ValidationContext`
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
        const issue = MetadataValidationIssues.ENUM_VALUE_DUPLICATE_VALUE(
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
   * @param enumValuePath - The path for the `ValidationIssue` instances
   * @param enumValue - The actual `EnumValue`
   * @param validatedValueType - The valueType from the enum definition.
   * If there was no valueType definition, then this is the default
   * ("UINT16"). If the valueType was not valid, this is `undefined`.
   * @param context - The `ValidationContext`
   * @returns Whether the `EnumValue` is valid
   */
  private static validateMetadataEnumValue(
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
    // The value MUST be defined
    // The value MUST be an integer
    if (!BasicValidator.validateInteger(valuePath, "value", value, context)) {
      result = false;
    }

    if (defined(validatedValueType)) {
      if (
        !NumberValidator.validateRange(
          valuePath,
          "value",
          value,
          validatedValueType,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }
}
