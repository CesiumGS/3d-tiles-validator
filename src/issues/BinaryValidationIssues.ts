import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";

/**
 * Methods to create `ValidationIssue` instances that describe
 * issues related to binary data of tile content or subtree files.
 */
export class BinaryValidationIssues {
  /**
   * Indicates that the binary data was fundamentally invalid (usually
   * caused by not even being able to read a header)
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static BINARY_INVALID(path: string, message: string) {
    const type = "BINARY_INVALID";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that an unexpected value was found in the binary -
   * for example, an unexpected magic value or version.
   *
   * @param path - The path for the `ValidationIssue`
   * @param name - The name of the value
   * @param expected - The expected value
   * @param actual - The actual value
   * @returns The `ValidationIssue`
   */
  static BINARY_INVALID_VALUE(
    path: string,
    name: string,
    expected: any,
    actual: any
  ) {
    const message = `The ${name} must be ${expected} but is ${actual}`;
    return BinaryValidationIssues._BINARY_INVALID_VALUE(path, message);
  }

  // Internal method for BINARY_INVALID_VALUE
  private static _BINARY_INVALID_VALUE(path: string, message: string) {
    const type = "BINARY_INVALID_VALUE";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the byte length information that was read from
   * binary was inconsistent. For example, when the total byte length
   * from the header does not match the length of the binary blob.
   *
   * @param path - The path for the `ValidationIssue`
   * @param name - A short name for the length
   * @param expectedLength - The expected length
   * @param actualLength - The actual length
   * @returns The `ValidationIssue`
   */
  static BINARY_INVALID_LENGTH(
    path: string,
    name: string,
    expectedLength: number | bigint,
    actualLength: number | bigint
  ) {
    const message =
      `The length of ${name} must be ${expectedLength} ` +
      `but is ${actualLength}`;
    return BinaryValidationIssues._BINARY_INVALID_LENGTH(path, message);
  }

  // Internal method for BINARY_INVALID_LENGTH
  private static _BINARY_INVALID_LENGTH(path: string, message: string) {
    const type = "BINARY_INVALID_LENGTH";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that an alignment requirement for a part of the
   * binary data was not met.
   *
   * @param path - The path for the `ValidationIssue`
   * @param name - A short name for the part of the binary data
   * @param expectedAlignment - The expected alignment
   * @returns The `ValidationIssue`
   */
  static BINARY_INVALID_ALIGNMENT(
    path: string,
    name: string,
    expectedAlignment: number | bigint,
    actualValue: number | bigint,
    misalignment: number | bigint
  ) {
    const message =
      `The ${name} must be aligned to ${expectedAlignment} bytes, ` +
      `but is ${actualValue}, causing a misalignment of ${misalignment}`;
    return BinaryValidationIssues._BINARY_INVALID_ALIGNMENT(path, message);
  }

  // Internal method for BINARY_INVALID_ALIGNMENT
  static _BINARY_INVALID_ALIGNMENT(path: string, message: string) {
    const type = "BINARY_INVALID_ALIGNMENT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that an alignment requirement for a part of the
   * binary data was not met.
   *
   * This is only used for the legacy tile formats validations.
   * New alignment checks should use the convenience method
   * `BinaryValidator#validateAlignment`, which creates more
   * elaborate messages.
   *
   * @param path - The path for the `ValidationIssue`
   * @param name - A short name for the part of the binary data
   * @param expectedAlignment - The expected alignment
   * @returns The `ValidationIssue`
   */
  static BINARY_INVALID_ALIGNMENT_legacy(
    path: string,
    name: string,
    expectedAlignment: number
  ) {
    const message = `The ${name} must be aligned to ${expectedAlignment} bytes`;
    return BinaryValidationIssues._BINARY_INVALID_ALIGNMENT(path, message);
  }
}
