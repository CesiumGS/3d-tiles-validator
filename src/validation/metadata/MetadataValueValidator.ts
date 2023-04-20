import { ValidationContext } from "./../ValidationContext";
import { BasicValidator } from "./../BasicValidator";
import { NumberValidator } from "./../NumberValidator";

import { MetadataUtilities } from "3d-tiles-tools";
import { defined } from "3d-tiles-tools";
import { MetadataTypes } from "3d-tiles-tools";

import { Schema } from "3d-tiles-tools";
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
export class MetadataValueValidator {
  /**
   * Validate the structure of the given value against the given
   * property definition.
   *
   * If will check the structure of the values based on the
   * type of the property:
   * - For STRING properties, they must be strings
   * - For ENUM properties, they must be strings that are the
   *   names of enum values
   * - For BOOLEAN properties, they must be booleans
   * - For arrays, they must be arrays accordingly
   * - For numeric types, they must be numbers or numeric arrays,
   *   as checked with `validateNumericValueStructure`
   *
   * @param propertyPath - The path for the property
   * @param propertyName - The name of the property
   * @param property - The actual property
   * @param valueName - The name of the value, to be used for the
   * validation issue message. For example, this may be "noData"
   * or "default".
   * @param value - The value
   * @param context - The `ValidationContext`
   * @returns Whether the object was valid
   */
  static validateValueStructure(
    propertyPath: string,
    propertyName: string,
    property: ClassProperty,
    valueName: string,
    value: any,
    schema: Schema,
    context: ValidationContext
  ): boolean {
    const path = propertyPath;
    const type = property.type;

    if (type === "STRING") {
      return MetadataValueValidator.validateStringValueStructure(
        propertyPath,
        property,
        valueName,
        value,
        context
      );
    }
    if (type === "ENUM") {
      return MetadataValueValidator.validateEnumValueStructure(
        propertyPath,
        propertyName,
        property,
        valueName,
        value,
        schema,
        context
      );
    }
    if (type === "BOOLEAN") {
      return MetadataValueValidator.validateBooleanValueStructure(
        propertyPath,
        property,
        valueName,
        value,
        context
      );
    }

    // Here, the type must be a numeric type. Check the value
    // to have the proper structure.
    return MetadataValueValidator.validateNumericValueStructure(
      property,
      path,
      valueName,
      value,
      context
    );
  }

  /**
   * Validates that the given value is a value that matches the
   * given class property, which has type `"STRING"`.
   *
   * The general validity of the class property has already
   * been validated with the `ClassPropertyValidator`.
   *
   * @param propertyPath - The path for `ValidationIssue` instances
   * @param property - The `ClassProperty`
   * @param valueName - The name of the value
   * @param value - The value
   * @param context - The `ValidationContext`
   * @returns Whether the value was valid
   */
  private static validateStringValueStructure(
    propertyPath: string,
    property: ClassProperty,
    valueName: string,
    value: any,
    context: ValidationContext
  ): boolean {
    const path = propertyPath;
    const array = property.array;
    const count = property.count;
    if (!array) {
      // For non-array STRING types, the value MUST be a string
      if (!BasicValidator.validateString(path, valueName, value, context)) {
        return false;
      }
      return true;
    }
    // For STRING array types, the value MUST be a string array
    const expectedLength = count;
    if (
      !BasicValidator.validateArray(
        path,
        valueName,
        value,
        expectedLength,
        expectedLength,
        "string",
        context
      )
    ) {
      return false;
    }
    return true;
  }

  /**
   * Validates that the given value is a value that matches the
   * given class property, which has type `"ENUM"`.
   *
   * The general validity of the class property has already
   * been validated with the `ClassPropertyValidator`.
   *
   * @param propertyPath - The path for `ValidationIssue` instances
   * @param property - The `ClassProperty`
   * @param valueName - The name of the value
   * @param value - The value
   * @param context - The `ValidationContext`
   * @returns Whether the value was valid
   */
  private static validateEnumValueStructure(
    propertyPath: string,
    propertyName: string,
    property: ClassProperty,
    valueName: string,
    value: any,
    schema: Schema,
    context: ValidationContext
  ): boolean {
    const path = propertyPath;
    const array = property.array;
    const count = property.count;
    const enumType = property.enumType;
    if (!array) {
      // For non-array ENUM types, the enum value MUST be a string
      // that appears in the names of the enum values
      const enumValueNames = MetadataUtilities.obtainEnumValueNames(
        property,
        schema
      );
      if (
        !MetadataValueValidator.validateEnumValueName(
          path,
          valueName,
          propertyName,
          enumType,
          value,
          enumValueNames,
          context
        )
      ) {
        return false;
      }
      return true;
    }

    // For array ENUM types, the value must be an array of strings
    if (
      !BasicValidator.validateArray(
        path,
        valueName,
        value,
        count,
        count,
        "string",
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Each element of the array MUST appear in the
    // names of the enum values
    const enumValueNames = MetadataUtilities.obtainEnumValueNames(
      property,
      schema
    );
    for (let i = 0; i < value.length; i++) {
      const enumValueName = value[i];
      if (
        !MetadataValueValidator.validateEnumValueName(
          path + "/" + i,
          valueName + "/" + i,
          propertyName,
          enumType,
          enumValueName,
          enumValueNames,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Make sure that the given `enumValueName` is valid.
   *
   * This is used for the validation of the names that appear in
   * the actual values that are supposed to represent enums. For
   * example, a `noData` value for an enum type may have the
   * value `"EXAMPLE_ENUM_VALUE`". This must be a string that
   * appears as the `enums[enumType].values[i].name` of the
   * corresponding enum type in the schema.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param name - The name of the enum value to be used in the
   * `ValidationIssue` message.
   * @param propertyName - The name of the property
   * @param enumType - The `enumType` of the property
   * @param enumValueName - The name of the enum value
   * @param enumValueNames - The valid enum value names
   * @param context - The `ValidationContext`
   * @returns Whether the name is valid
   */
  private static validateEnumValueName(
    path: string,
    name: string,
    propertyName: string,
    enumType: string | undefined,
    enumValueName: any,
    enumValueNames: any[],
    context: ValidationContext
  ): boolean {
    // The enum value name MUST be a string
    if (!BasicValidator.validateString(path, name, enumValueName, context)) {
      return false;
    }

    // Each enum value MUST appear as the name of the
    // values from the enum definition
    if (!enumValueNames.includes(enumValueName)) {
      const issue =
        MetadataValidationIssues.CLASS_PROPERTY_ENUM_VALUE_NAME_NOT_FOUND(
          path,
          name,
          propertyName,
          enumType,
          enumValueName
        );
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Validates that the given value is a value that matches the
   * given class property, which has type `"BOOLEAN"`.
   *
   * The general validity of the class property has already
   * been validated with the `ClassPropertyValidator`.
   *
   * @param propertyPath - The path for `ValidationIssue` instances
   * @param property - The `ClassProperty`
   * @param valueName - The name of the value
   * @param value - The value
   * @param context - The `ValidationContext`
   * @returns Whether the value was valid
   */
  private static validateBooleanValueStructure(
    propertyPath: string,
    property: ClassProperty,
    valueName: string,
    value: any,
    context: ValidationContext
  ): boolean {
    const path = propertyPath;
    const array = property.array;
    const count = property.count;
    if (!array) {
      // For non-array BOOLEAN types, the value MUST be a boolean
      if (!BasicValidator.validateBoolean(path, valueName, value, context)) {
        return false;
      }
      return true;
    }
    // For BOOLEAN array types, the value MUST be a boolean array
    const expectedLength = count;
    if (
      !BasicValidator.validateArray(
        path,
        valueName,
        value,
        expectedLength,
        expectedLength,
        "boolean",
        context
      )
    ) {
      return false;
    }
    return true;
  }

  /**
   * Validates that a value that appears in a property is a proper
   * numeric value that matches the type of the property.
   *
   * This is intended for the values that can be given as `offset`,
   * `scale`, `max`, and `min`, and performs the checks as defined in
   * `definitions.schema.json#/definitions/numericValue`.
   *
   * @param property - The ClassProperty
   * @param valueName - The name of the value (e.g. 'min' or 'offset')
   * @param value - The actual value
   * @param context - The `ValidationContext`
   * @returns Whether the value was valid
   */
  static validateNumericValueStructure(
    property: ClassProperty,
    valuePath: string,
    valueName: string,
    value: any,
    context: ValidationContext
  ): boolean {
    // This assumes that the validity of the given property has
    // already been validated by the `ClassPropertyValidator`
    const type = property.type;
    const array = property.array;
    const componentType = property.componentType;
    if (!defined(componentType)) {
      return false;
    }

    // Check non-array types
    if (!array) {
      // For SCALAR types, the value MUST be a number
      if (type === "SCALAR") {
        if (
          !BasicValidator.validateNumber(valuePath, valueName, value, context)
        ) {
          return false;
        }
        // The value MUST be in the range that is
        // determined by the componentType
        if (
          !NumberValidator.validateRange(
            valuePath,
            "value",
            value,
            componentType,
            context
          )
        ) {
          return false;
        }
        return true;
      }

      // For non-SCALAR types, the value must be an
      // array of numbers, with the length matching
      // the componentCount of the type
      const componentCount = MetadataTypes.componentCountForType(type);
      if (
        !BasicValidator.validateArray(
          valuePath,
          valueName,
          value,
          componentCount,
          componentCount,
          "number",
          context
        )
      ) {
        return false;
      }
      // Each element MUST be in the range that is
      // determined by the componentType
      return NumberValidator.validateRanges(
        valuePath,
        value,
        componentType,
        context
      );
    }

    // Here, the value must be an array.

    // The expected length is only defined when a count was given.
    // (If it is undefined, it will be ignored in `validateArray`)
    const count = property.count;

    // For SCALAR arrays, the value must be an array of numbers
    if (type === "SCALAR") {
      // The value MUST be an array of numbers
      if (
        !BasicValidator.validateArray(
          valuePath,
          valueName,
          value,
          count,
          count,
          "number",
          context
        )
      ) {
        return false;
      }

      // Each element MUST be in the range that is
      // determined by the componentType
      return NumberValidator.validateRanges(
        valuePath,
        value,
        componentType,
        context
      );
    }

    // For non-SCALAR arrays, the value MUST be an array of objects
    if (
      !BasicValidator.validateArray(
        valuePath,
        valueName,
        value,
        count,
        count,
        "object",
        context
      )
    ) {
      return false;
    }

    // Each element MUST be an array of numbers, with a length
    // that matches the componentCount of the type
    let allElementsValid = true;
    const componentCount = MetadataTypes.componentCountForType(type);
    for (let i = 0; i < value.length; i++) {
      const valueElement = value[i];
      const valueElementPath = valuePath + "/" + i;
      if (
        !BasicValidator.validateArray(
          valueElementPath,
          valueName,
          valueElement,
          componentCount,
          componentCount,
          "number",
          context
        )
      ) {
        allElementsValid = false;
      } else {
        // Each element of the array MUST be in the range that is
        // determined by the componentType
        if (
          !NumberValidator.validateRanges(
            valueElementPath,
            valueElement,
            componentType,
            context
          )
        ) {
          allElementsValid = false;
        }
      }
    }
    return allElementsValid;
  }
}
