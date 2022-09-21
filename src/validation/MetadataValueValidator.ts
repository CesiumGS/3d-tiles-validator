import { defined } from "../base/defined";
import { defaultValue } from "../base/defaultValue";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";

import { MetadataTypes } from "../metadata/MetadataTypes";

import { Schema } from "../structure/Metadata/Schema";
import { ClassProperty } from "../structure/Metadata/ClassProperty";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A class for validations of metadata values against the definitions
 * from a `ClassProperty` from a metadata schema.
 *
 * @private
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
   * @param propertyPath The path for the property
   * @param propertyName The name of the property
   * @param property The actual property
   * @param valueName The name of the value, to be used for the
   * validation issue message. For example, this may be "noData"
   * or "default".
   * @param value The value
   * @param context The `ValidationContext`
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
    let result = true;

    const path = propertyPath;
    const type = property.type;
    const array = property.array;
    const count = property.count;
    const enumType = property.enumType;
    if (type === "STRING") {
      if (!array) {
        // For non-array STRING types, the value MUST be a string
        if (!BasicValidator.validateString(path, valueName, value, context)) {
          result = false;
        }
      } else {
        // For STRING array types, the value MUST be a string array
        let expectedLength = count;
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
          result = false;
        }
      }
    } else if (type === "ENUM") {
      if (!array) {
        // For non-array ENUM types, the enum value MUST be a string
        // that appears in the names of the enum values
        const enumValueNames = MetadataValueValidator.obtainEnumValueNames(
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
          result = false;
        }
      } else {
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
          result = false;
        } else {
          // Each element of the array MUST appear in the
          // names of the enum values
          const enumValueNames = MetadataValueValidator.obtainEnumValueNames(
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
        }
      }
    } else if (type === "BOOLEAN") {
      if (!array) {
        // For non-array BOOLEAN types, the value MUST be a boolean
        if (!BasicValidator.validateBoolean(path, valueName, value, context)) {
          result = false;
        }
      } else {
        // For BOOLEAN array types, the value MUST be a boolean array
        let expectedLength = count;
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
          result = false;
        }
      }
    } else {
      // The type is a numeric type. Check the value
      // to have the proper structure.
      if (
        !MetadataValueValidator.validateNumericValueStructure(
          property,
          path,
          valueName,
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
   * Make sure that the given `enumValueName` is valid.
   *
   * This is used for the validation of the names that appear in
   * the actual values that are supposed to represent enums. For
   * example, a `noData` value for an enum type may have the
   * value `"EXAMPLE_ENUM_VALUE`". This must be a string that
   * appears as the `enums[enumType].values[i].name` of the
   * corresponding enum type in the schema.
   *
   * @param path The path for `ValidationIssue` instances
   * @param name The name of the enum value to be used in the
   * `ValidationIssue` message.
   * @param propertyName The name of the property
   * @param enumType The `enumType` of the property
   * @param enumValueName The name of the enum value
   * @param enumValueNames The valid enum value names
   * @param context The `ValidationContext`
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
        SemanticValidationIssues.CLASS_PROPERTY_VALUE_ENUM_VALUE_NOT_FOUND(
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
   * Validates that a value that appears in a property is a proper
   * numeric value that matches the type of the property.
   *
   * This is intended for the values that can be given as `offset`,
   * `scale`, `max`, and `min`, and performs the checks as defined in
   * `definitions.schema.json#/definitions/numericValue`.
   *
   * @param property The ClassProperty
   * @param valueName The name of the value (e.g. 'min' or 'offset')
   * @param value The actual value
   * @param context The `ValidationContext`
   * @returns Whether the value was valid
   */
  static validateNumericValueStructure(
    property: ClassProperty,
    valuePath: string,
    valueName: string,
    value: any,
    context: ValidationContext
  ): boolean {
    const type = property.type;
    const array = property.array;

    // TODO These checks currently do not cover whether
    // each value in an array is in the valid range, e.g.
    // whether a UINT8 value is indeed in [0,255].

    // CHeck non-array types
    if (!array) {
      // For SCALAR types, the value MUST be a number
      if (type === "SCALAR") {
        return BasicValidator.validateNumber(
          valuePath,
          valueName,
          value,
          context
        );
      }

      // For non-SCALAR types, the value must be an
      // array of numbers, with the length matching
      // the componentCount of the type
      const componentCount = MetadataTypes.componentCountForType(type);
      return BasicValidator.validateArray(
        valuePath,
        valueName,
        value,
        componentCount,
        componentCount,
        "number",
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
      return BasicValidator.validateArray(
        valuePath,
        valueName,
        value,
        count,
        count,
        "number",
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
      }
    }
    return allElementsValid;
  }

  /**
   * Internal method to obtain the names of enum values for the
   * given property.
   *
   * This tries to return the list of all
   * `schema.enums[classProperty.enumType].values[i].name`
   * values, returning the empty list the property does not have an
   * enum type or any element is not defined.
   *
   * @param classProperty The `ClassProperty`
   * @param schema The `Schema`
   * @returns The enum value names
   */
  private static obtainEnumValueNames(
    classProperty: ClassProperty,
    schema: Schema
  ): string[] {
    const type = classProperty.type;
    if (type !== "ENUM") {
      return [];
    }
    const enumType = classProperty.enumType;
    if (!defined(enumType)) {
      return [];
    }
    const enums = defaultValue(schema.enums, {});
    const theEnum = enums[enumType!];
    if (!defined(theEnum)) {
      return [];
    }
    const enumValues = theEnum.values;
    if (!defined(enumValues)) {
      return [];
    }
    const enumValueNames = enumValues.map((e: { name: string }) => e.name);
    return enumValueNames;
  }
}
