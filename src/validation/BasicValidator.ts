import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";

import { JsonValidationIssues } from "../issues/JsonValidationIssues";
import { ValidationIssueUtils } from "../issues/ValidationIssueUtils";

// TODO Some of these functions are not as regular as they should be.
// For example, validateString expects the string, whereas
// validateOptionalString expects the containing object and
// does the lookup internally. This should be made more consistent,
// and better aligned with the actual, final issues that are
// defined in `JsonValidationIssues`

/**
 * A class for generic, basic validations. These are mainly checks for
 * definedness of values, their types, and their ranges, that may lead
 * to different `JsonValidationIssues`.
 *
 * @internal
 */
export class BasicValidator {
  /**
   * Validate that the given string is a valid identifier string,
   * as defined in the 3D Metadata Specification.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value is an identifier string
   */
  static validateIdentifierString(
    path: string,
    name: string,
    value: string,
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateDefined(path, name, value, context)) {
      return false;
    }
    const idRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!idRegex.test(value)) {
      const issue = JsonValidationIssues.STRING_PATTERN_MISMATCH(
        path,
        name,
        value,
        idRegex.toString()
      );
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Validate that the specified value has the type `"string"`,
   * if it is present.
   *
   * If the value has the expected type, then `true` is returned.
   *
   * If the value does not have the expeced type, a `TYPE_MISMATCH`
   * validation issue is added to the given context, and `false`
   * is returned.
   *
   * @param containingPath - The path of the object containing
   * the property, for the `ValidationIssue` message
   * @param containingObject - The object that may contain the
   * property
   * @param name - The name of the property
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the specified value has the expected type
   */
  static validateOptionalString(
    containingPath: string,
    containingObject: any,
    name: string,
    context: ValidationContext
  ): boolean {
    const value = containingObject[name];
    if (defined(value)) {
      const path = containingPath + "/" + name;
      return BasicValidator.validateString(path, name, value, context);
    }
    return true;
  }

  /**
   * Validate that the given value is defined.
   *
   * If the value is defined, then `true` is returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value is defined
   */
  static validateDefined(
    path: string,
    name: string,
    value: any,
    context: ValidationContext
  ): boolean {
    if (defined(value)) {
      return true;
    }
    const issue = JsonValidationIssues.PROPERTY_MISSING(path, name);
    context.addIssue(issue);
    return false;
  }

  /**
   * Validate that the given value is an array.
   *
   * If the value is an array with the expected length, then `true` is
   * returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the value is not an array, then a `TYPE_MISMATCH` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the expected length is given, and the array does not have
   * this length, then an `ARRAY_LENGTH_MISMATCH` validation issue
   * is added to the given context, and `false` is returned.
   *
   * If the expected type is given, and any element of the array does
   * not have the expcected type, then a `TYPE_MISMATCH` validation
   * issue is added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param minLength - The optional minimum length
   * @param maxLength - The optional maximum length
   * @param expectedElementType - The optional expected element type
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value is an array with the expected
   * length
   */
  static validateArray(
    path: string,
    name: string,
    value: any,
    minLength: number | undefined,
    maxLength: number | undefined,
    expectedElementType: string | undefined,
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateDefined(path, name, value, context)) {
      return false;
    }
    if (!Array.isArray(value)) {
      const issue = JsonValidationIssues.TYPE_MISMATCH(
        path,
        name,
        "Array",
        typeof value
      );
      context.addIssue(issue);
      return false;
    }
    if (
      (defined(minLength) && value.length < minLength) ||
      (defined(maxLength) && value.length > maxLength)
    ) {
      const rangeDescription = ValidationIssueUtils.describeSimpleRange(
        minLength,
        maxLength
      );
      const message =
        `Array '${name}' must have a length of ${rangeDescription}, ` +
        `but the actual length is ${value.length}`;
      const issue = JsonValidationIssues.ARRAY_LENGTH_MISMATCH(path, message);
      context.addIssue(issue);
      return false;
    }
    if (defined(expectedElementType)) {
      for (let index = 0; index < value.length; index++) {
        const element = value[index];
        if (typeof element !== expectedElementType) {
          const issue = JsonValidationIssues.ARRAY_ELEMENT_TYPE_MISMATCH(
            path + "/" + index,
            name,
            index,
            expectedElementType,
            typeof element
          );
          context.addIssue(issue);
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Validates that the elements in the given array are unique.
   *
   * This assumes that the basic validation of the array has already
   * been peformed. It **ONLY** checks the uniqueness of the elements.
   *
   * If the elements are unique, then `true` is returned.
   *
   * Otherwise, one `ARRAY_ELEMENT_NOT_UNIQUE` issue will be added
   * for each non-unique element, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param array - The array
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the elements have been unique
   */
  static validateArrayElementsUnique(
    path: string,
    name: string,
    array: any,
    context: ValidationContext
  ): boolean {
    let result = true;
    for (let i = 0; i < array.length; i++) {
      const value = array[i];
      const index = array.indexOf(value);
      if (index != i) {
        const issue = JsonValidationIssues.ARRAY_ELEMENT_NOT_UNIQUE(
          path,
          name,
          value
        );
        context.addIssue(issue);
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate that the given value has the type `"object"`.
   *
   * If the value has the expected type, then `true` is returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the given object does not have the expeced type, a `TYPE_MISMATCH`
   * validation issue is added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value has the expected type
   */
  static validateObject(
    path: string,
    name: string,
    value: any,
    context: ValidationContext
  ): value is { [key: string]: any } {
    if (!BasicValidator.validateDefined(path, name, value, context)) {
      return false;
    }
    return BasicValidator.validateType(path, name, value, "object", context);
  }

  /**
   * Validate that the given value has the type `"string"`.
   *
   * If the value has the expected type, then `true` is returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the given object does not have the expeced type, a `TYPE_MISMATCH`
   * validation issue is added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value has the expected type
   */
  static validateString(
    path: string,
    name: string,
    value: any,
    context: ValidationContext
  ): value is string {
    if (!BasicValidator.validateDefined(path, name, value, context)) {
      return false;
    }
    return BasicValidator.validateType(path, name, value, "string", context);
  }

  /**
   * Validate that the given value has the type `"number"`.
   *
   * If the value has the expected type, then `true` is returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the given object does not have the expeced type, a `TYPE_MISMATCH`
   * validation issue is added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value has the expected type
   */
  static validateNumber(
    path: string,
    name: string,
    value: any,
    context: ValidationContext
  ): value is number {
    if (!BasicValidator.validateDefined(path, name, value, context)) {
      return false;
    }
    return BasicValidator.validateType(path, name, value, "number", context);
  }

  /**
   * Validate that the given value has the type `"boolean"`.
   *
   * If the value has the expected type, then `true` is returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the given object does not have the expeced type, a `TYPE_MISMATCH`
   * validation issue is added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value has the expected type
   */
  static validateBoolean(
    path: string,
    name: string,
    value: any,
    context: ValidationContext
  ): value is boolean {
    if (!BasicValidator.validateDefined(path, name, value, context)) {
      return false;
    }
    return BasicValidator.validateType(path, name, value, "boolean", context);
  }

  /**
   * Validate that the given object has the expected type.
   *
   * If the value has the expected type, then `true` is returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the given object does not have the expeced type, a `TYPE_MISMATCH`
   * validation issue is added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param expectedType - The expected type
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value has the expected type
   */
  static validateType(
    path: string,
    name: string,
    value: any,
    expectedType: string,
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateDefined(path, name, value, context)) {
      return false;
    }
    if (typeof value === expectedType) {
      return true;
    }
    const issue = JsonValidationIssues.TYPE_MISMATCH(
      path,
      name,
      expectedType,
      typeof value
    );
    context.addIssue(issue);
    return false;
  }

  /**
   * Validate that the given value is an integer.
   *
   * If the value has the expected type, then `true` is returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the given object does not have the expeced type, a `TYPE_MISMATCH`
   * validation issue is added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value has the expected type
   */
  static validateInteger(
    path: string,
    name: string,
    value: any,
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateDefined(path, name, value, context)) {
      return false;
    }
    if (Number.isInteger(value)) {
      return true;
    }
    const issue = JsonValidationIssues.TYPE_MISMATCH(
      path,
      name,
      "integer",
      typeof value
    );
    context.addIssue(issue);
    return false;
  }

  /**
   * Validate that the given value is in the specified range.
   *
   * If the value is in the specified range, then `true` is returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the given object is not a number, a `TYPE_MISMATCH`
   * validation issue is added to the given context, and `false` is returned.
   *
   * If the value is not in the required range, `VALUE_NOT_IN_RANGE`
   * validation issue is added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param min - The minimum value (optional)
   * @param minInclusive - Whether the minimum value is inclusive
   * @param max - The maximum value (optional)
   * @param maxInclusive - Whether the maximum value is inclusive
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value is in the expected range
   */
  static validateNumberRange(
    path: string,
    name: string,
    value: number,
    min: number | bigint | undefined,
    minInclusive: boolean,
    max: number | bigint | undefined,
    maxInclusive: boolean,
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateNumber(path, name, value, context)) {
      return false;
    }
    return BasicValidator._validateNumberRangeInternal(
      path,
      name,
      value,
      min,
      minInclusive,
      max,
      maxInclusive,
      context
    );
  }

  /**
   * Validate that the given value is in the specified range.
   *
   * If the value is in the specified range, then `true` is returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the given object is not an integer, a `TYPE_MISMATCH`
   * validation issue is added to the given context, and `false` is returned.
   *
   * If the value is not in the required range, `VALUE_NOT_IN_RANGE`
   * validation issue is added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param min - The minimum value (optional)
   * @param minInclusive - Whether the minimum value is inclusive
   * @param max - The maximum value (optional)
   * @param maxInclusive - Whether the maximum value is inclusive
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value is in the expected range
   */
  static validateIntegerRange(
    path: string,
    name: string,
    value: number,
    min: number | undefined,
    minInclusive: boolean,
    max: number | undefined,
    maxInclusive: boolean,
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateInteger(path, name, value, context)) {
      return false;
    }
    return BasicValidator._validateNumberRangeInternal(
      path,
      name,
      value,
      min,
      minInclusive,
      max,
      maxInclusive,
      context
    );
  }

  /**
   * Validate that the given number is in the specified range.
   *
   * This function assumes the given value to be defined and
   * to be a number.
   *
   * If the value is not in the required range, `VALUE_NOT_IN_RANGE`
   * validation issue is added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param min - The minimum value (optional)
   * @param minInclusive - Whether the minimum value is inclusive
   * @param max - The maximum value (optional)
   * @param maxInclusive - Whether the maximum value is inclusive
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value is in the expected range
   */
  static _validateNumberRangeInternal(
    path: string,
    name: string,
    value: number,
    min: number | bigint | undefined,
    minInclusive: boolean,
    max: number | bigint | undefined,
    maxInclusive: boolean,
    context: ValidationContext
  ): boolean {
    if (defined(min) && defined(max)) {
      const validMin = minInclusive ? value >= min : value > min;
      const validMax = maxInclusive ? value <= max : value < max;
      if (!validMin || !validMax) {
        const minBracket = minInclusive ? "[" : "(";
        const maxBracket = maxInclusive ? "]" : ")";
        const rangeDescription = `in ${minBracket}${min},${max}${maxBracket}`;
        const message = `The '${name}' property must be ${rangeDescription}, but is ${value}`;
        const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(path, message);
        context.addIssue(issue);
        return false;
      }
    } else if (defined(min)) {
      const validMin = minInclusive ? value >= min : value > min;
      if (!validMin) {
        const minComparison = minInclusive
          ? "greater than or equal to"
          : "greater than";
        const message =
          `The '${name}' property must be ` +
          `${minComparison} ${min}, but is ${value}`;
        const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(path, message);
        context.addIssue(issue);
        return false;
      }
    } else if (defined(max)) {
      const validMax = maxInclusive ? value <= max : value < max;
      if (!validMax) {
        const maxComparison = maxInclusive
          ? "less than or equal to"
          : "less than";
        const message =
          `The '${name}' property must be ` +
          `${maxComparison} ${max}, but is ${value}`;
        const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(path, message);
        context.addIssue(issue);
        return false;
      }
    }
    return true;
  }

  /**
   * Validate that the given value is a valid enum value.
   *
   * If the value is valid, then `true` is returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the given object is not contained in the given array of
   * allowed values, then a `VALUE_NOT_IN_LIST` validation issue is
   * added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param allowedValues - The array of allowed values
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value has the expected type
   */
  static validateEnum(
    path: string,
    name: string,
    value: any,
    allowedValues: any[],
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateDefined(path, name, value, context)) {
      return false;
    }
    if (!allowedValues.includes(value)) {
      const message =
        `The '${name}' property has the value ` +
        `${value}, but must be one of ${allowedValues}`;
      const issue = JsonValidationIssues.VALUE_NOT_IN_LIST(path, message);
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Validate that the given object has the required number of properties.
   *
   * If the object has the required number, then `true` is returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the value is not an object, then a `TYPE_MISMATCH` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the given value does not have the required number of properties,
   * then a `NUMBER_OF_PROPERTIES_MISMATCH` issue is added to the given
   * context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param minProperties - The minimum number of properties
   * @param maxProperties - The maximum number of properties
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value has the expected type
   */
  static validateNumberOfProperties(
    path: string,
    name: string,
    value: any,
    minProperties: number | undefined,
    maxProperties: number | undefined,
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateObject(path, name, value, context)) {
      return false;
    }
    const numProperties = Object.keys(value).length;
    if (
      (defined(minProperties) && numProperties < minProperties) ||
      (defined(maxProperties) && numProperties > maxProperties)
    ) {
      const rangeDescription = ValidationIssueUtils.describeSimpleRange(
        minProperties,
        maxProperties
      );
      const message =
        `Object '${name}' must have ${rangeDescription} ` +
        `properties, but has ${numProperties} properties`;
      const issue = JsonValidationIssues.NUMBER_OF_PROPERTIES_MISMATCH(
        path,
        message
      );
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Validate that the given value is a string with the required length.
   *
   * If the value has the expected length, then `true` is returned.
   *
   * If the given value is not defined, a `PROPERTY_MISSING` validation
   * issue is added to the given context, and `false` is returned.
   *
   * If the given object does not have the type `"string"`, a `TYPE_MISMATCH`
   * validation issue is added to the given context, and `false` is returned.
   *
   * If the given object does not have the required length, then a
   * `STRING_LENGTH_MISMATCH` issue will be added to the given context,
   * and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The value
   * @param minLength - The optional minimum length
   * @param maxLength - The optional maximum length
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value has the expected type
   */
  static validateStringLength(
    path: string,
    name: string,
    value: any,
    minLength: number | undefined,
    maxLength: number | undefined,
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateString(path, name, value, context)) {
      return false;
    }
    if (
      (defined(minLength) && value.length < minLength) ||
      (defined(maxLength) && value.length > maxLength)
    ) {
      const rangeDescription = ValidationIssueUtils.describeSimpleRange(
        minLength,
        maxLength
      );
      const message =
        `String '${name}' must have a length of ${rangeDescription}, ` +
        `but the actual length is ${value.length}`;
      const issue = JsonValidationIssues.ARRAY_LENGTH_MISMATCH(path, message);
      context.addIssue(issue);
      return false;
    }
    return true;
  }
}
