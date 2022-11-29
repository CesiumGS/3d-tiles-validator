import { ValidationContext } from "./ValidationContext";
import { BinaryValidationIssues } from "../issues/BinaryValidationIssues";

/**
 * A class for validations of binary data.
 *
 * @internal
 */
export class BinaryValidator {
  /**
   * Validates that the actual length is at least the minimum length.
   *
   * This is mainly used for early sanity checks, to make sure
   * that a buffer contains at least enough data for the
   * expected header.
   *
   * If the length is valid, then `true` is returned.
   *
   * If the length is too small, then a `BINARY_INVALID` issue
   * will be added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue`
   * @param name - The name of the length to be shown in the message
   * @param minLength - The minimum length, inclusive
   * @param actualLength - The actual length
   * @param context - The `ValidationContext`
   * @returns Whether the length is valid
   */
  static validateMinLength(
    path: string,
    name: string,
    minLength: number | bigint,
    actualLength: number | bigint,
    context: ValidationContext
  ): boolean {
    if (actualLength < minLength) {
      const message =
        `The ${name} must have at least ${minLength} bytes, ` +
        `but only has ${actualLength} bytes`;
      const issue = BinaryValidationIssues.BINARY_INVALID(path, message);
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Validates that the given length is the expected length.
   *
   * If the length is valid, then `true` is returned.
   *
   * If the length does not match, then a `BINARY_INVALID_LENGTH` issue
   * will be added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue`
   * @param name - The name of the length to be shown in the message
   * @param expectedLength - The expected length
   * @param actualLength - The actual length
   * @param context - The `ValidationContext`
   * @returns Whether the length is valid
   */
  static validateLength(
    path: string,
    name: string,
    expectedLength: number | bigint,
    actualLength: number | bigint,
    context: ValidationContext
  ): boolean {
    if (BigInt(actualLength) !== BigInt(expectedLength)) {
      const issue = BinaryValidationIssues.BINARY_INVALID_LENGTH(
        path,
        name,
        expectedLength,
        actualLength
      );
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Validates that the given value is the expected value.
   *
   * If the value is valid, then `true` is returned.
   *
   * If the values do not match, then a `BINARY_INVALID_VALUE` issue
   * will be added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue`
   * @param name - The name of the value to be shown in the message
   * @param expectedValue - The expected value
   * @param actualValue - The actual value
   * @param context - The `ValidationContext`
   * @returns Whether the value is valid
   */
  static validateValue(
    path: string,
    name: string,
    expectedValue: any,
    actualValue: any,
    context: ValidationContext
  ): boolean {
    if (actualValue !== expectedValue) {
      const issue = BinaryValidationIssues.BINARY_INVALID_VALUE(
        path,
        name,
        expectedValue,
        actualValue
      );
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Validates that the given value is properly aligned.
   *
   * If the value is properly aligned, then `true` is returned.
   *
   * If the value is not aligned, then a `BINARY_INVALID_ALIGNMENT` issue
   * will be added to the given context, and `false` is returned.
   *
   * @param path - The path for the `ValidationIssue`
   * @param name - The name of the value to be shown in the message
   * @param value - The actual value
   * @param expectedAlignment - The expected alignment
   * @param context - The `ValidationContext`
   * @returns Whether the value is valid
   */
  static validateAlignment(
    path: string,
    name: string,
    value: number | bigint,
    expectedAlignment: number | bigint,
    context: ValidationContext
  ): boolean {
    const misalignment = BigInt(value) % BigInt(expectedAlignment);
    if (misalignment > 0) {
      const issue = BinaryValidationIssues.BINARY_INVALID_ALIGNMENT(
        path,
        name,
        expectedAlignment,
        value,
        misalignment
      );
      context.addIssue(issue);
      return false;
    }

    return true;
  }
}
