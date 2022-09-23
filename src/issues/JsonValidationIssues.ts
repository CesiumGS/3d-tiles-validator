import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";
import { ValidationIssueUtils } from "./ValidationIssueUtils";

/**
 * Methods to create `ValidationIssue` instances that describe
 * issues on the level of JSON schema constraints.
 *
 * Most of the issues in this class are generated by the
 * `BasicValidator` functions.
 */
export class JsonValidationIssues {
  /**
   * A generic, unspecified error on the level of the JSON schema
   * of the specification.
   *
   * TODO: This is curently used for the generic issues that are
   * reported by the `JsonSchemaValidator` classes
   *
   * @param path The JSON path for the `ValidationIssue`
   * @param message The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static SCHEMA_ERROR(path: string, message: string) {
    const type = "SCHEMA_ERROR";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a property that is marked as 'required' in the
   * schema was missing.
   *
   * @param path The JSON path for the `ValidationIssue`
   * @param name The name of the missing property
   * @returns The `ValidationIssue`
   */
  static PROPERTY_MISSING(path: string, name: string) {
    const message = `The '${name}' property is required`;
    return JsonValidationIssues._PROPERTY_MISSING(path, message);
  }

  // Internal method for PROPERTY_MISSING
  private static _PROPERTY_MISSING(path: string, message: string) {
    const type = "PROPERTY_MISSING";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a property had a type that was different
   * than the one in the JSON schema.
   *
   * @param path The JSON path for the `ValidationIssue`
   * @param name The name of the property
   * @param expectedType The expected type
   * @param actualType The actual type
   * @returns The `ValidationIssue`
   */
  static TYPE_MISMATCH(
    path: string,
    name: string,
    expectedType: string,
    actualType: string
  ) {
    const message =
      `The '${name}' property must have ` +
      `type '${expectedType}', but has type '${actualType}'`;
    return JsonValidationIssues._TYPE_MISMATCH(path, message);
  }

  // Internal method for TYPE_MISMATCH
  private static _TYPE_MISMATCH(path: string, message: string) {
    const type = "TYPE_MISMATCH";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that an array element had a type that was different
   * than the one in the JSON schema.
   *
   * @param path The JSON path for the `ValidationIssue`
   * @param name The name of the array property
   * @param index The index of the element
   * @param expectedType The expected type
   * @param actualType The actual type
   * @returns The `ValidationIssue`
   */
  static ARRAY_ELEMENT_TYPE_MISMATCH(
    path: string,
    name: string,
    index: number,
    expectedType: string,
    actualType: string
  ) {
    const message =
      `The element at index ${index} of '${name}' must have type ` +
      `'${expectedType}', but has type '${actualType}'`;
    return JsonValidationIssues._ARRAY_ELEMENT_TYPE_MISMATCH(path, message);
  }

  // Internal method for ARRAY_ELEMENT_TYPE_MISMATCH
  private static _ARRAY_ELEMENT_TYPE_MISMATCH(path: string, message: string) {
    const type = "ARRAY_ELEMENT_TYPE_MISMATCH";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a numeric value was not in the range that
   * is specified by the JSON schema via the `minimum` and
   * `maximum` constraints.
   *
   * @param path The JSON path for the `ValidationIssue`
   * @param message The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static VALUE_NOT_IN_RANGE(path: string, message: string) {
    const type = "VALUE_NOT_IN_RANGE";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a value was not in the set of allowed
   * values. This usually refers to enum values.
   *
   * @param path The JSON path for the `ValidationIssue`
   * @param message The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static VALUE_NOT_IN_LIST(path: string, message: string) {
    const type = "VALUE_NOT_IN_LIST";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the length of an array does not match the length
   * that is specified via the JSON schema, using the `minItems`
   * and `maxItems` constraints.
   *
   * @param path The JSON path for the `ValidationIssue`
   * @param message The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static ARRAY_LENGTH_MISMATCH(path: string, message: string) {
    const type = "ARRAY_LENGTH_MISMATCH";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the length of a string does not match the length
   * that is specified via the JSON schema, using the `minLength`
   * and `maxLength` constraints.
   *
   * @param path The JSON path for the `ValidationIssue`
   * @param message The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static STRING_LENGTH_MISMATCH(path: string, message: string) {
    const type = "STRING_LENGTH_MISMATCH";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the number of properties of an object does not match
   * meet the constraints that are specified via the JSON schema, using
   * the `minProperties` and `maxProperties` properties.
   *
   * @param path The JSON path for the `ValidationIssue`
   * @param message The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static NUMBER_OF_PROPERTIES_MISMATCH(path: string, message: string) {
    const type = "NUMBER_OF_PROPERTIES_MISMATCH";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the pattern of a string property does not match the
   * required regular expression.
   *
   * @param path The JSON path for the `ValidationIssue`
   * @param name The name of the property
   * @param value The value of the property
   * @param pattern A string representation of the expected pattern
   * @returns The `ValidationIssue`
   */
  static STRING_PATTERN_MISMATCH(
    path: string,
    name: string,
    value: string,
    pattern: string
  ) {
    const message =
      `Property '${name}' must match the pattern '${pattern}', ` +
      `but has the value '${value}'`;
    return this._STRING_PATTERN_MISMATCH(path, message);
  }

  // Internal method for STRING_PATTERN_MISMATCH
  private static _STRING_PATTERN_MISMATCH(path: string, message: string) {
    const type = "STRING_PATTERN_MISMATCH";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that multiple properties have been defined, when
   * only one of them should have been defined.
   *
   * @param path The JSON path for the `ValidationIssue`
   * @param name The name of the containing object
   * @param properties The names of the properties
   * @returns The `ValidationIssue`
   */
  static ONE_OF_ERROR(path: string, name: string, ...properties: string[]) {
    const options = ValidationIssueUtils.joinNames("or", ...properties);
    const message = `The '${name}' may define ${options}, but not all of them`;
    return JsonValidationIssues._ONE_OF_ERROR(path, message);
  }

  // Internal method for ONE_OF_ERROR
  private static _ONE_OF_ERROR(path: string, message: string) {
    const type = "ONE_OF_ERROR";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that one of several properties must be defined,
   * but none of them was defined.
   *
   * @param path The JSON path for the `ValidationIssue`
   * @param name The name of the containing object
   * @param properties The names of the properties
   * @returns The `ValidationIssue`
   */
  static ANY_OF_ERROR(path: string, name: string, ...properties: string[]) {
    const options = ValidationIssueUtils.joinNames("or", ...properties);
    const message =
      `The '${name}' must define ${options}, ` +
      `but not does not define any of them`;
    return JsonValidationIssues._ANY_OF_ERROR(path, message);
  }

  // Internal method for ANY_OF_ERROR
  private static _ANY_OF_ERROR(path: string, message: string) {
    const type = "ANY_OF_ERROR";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
}
