import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";

/**
 * Methods to create `ValidationIssue` instances that describe
 * generic, structural errors.
 */
export class StructureValidationIssues {
  /**
   * Indicates that a certain identifier was not found as
   * a key in a dictionary.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static IDENTIFIER_NOT_FOUND(path: string, message: string) {
    const type = "IDENTIFIER_NOT_FOUND";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a value that is required based on the presence
   * or absence of another value has not been defined.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static REQUIRED_VALUE_NOT_FOUND(path: string, message: string) {
    const type = "REQUIRED_VALUE_NOT_FOUND";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
}
