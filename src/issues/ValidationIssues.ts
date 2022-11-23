import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";

/**
 * Methods to create generic `ValidationIssue` instances
 */
export class ValidationIssues {
  /**
   * An issue that describes an internal error in the validator.
   * Clients should usually not receive this issue. It is used
   * as a last resort to gracefully handle internal issues
   * without breaking the validation process.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static INTERNAL_ERROR(path: string, message: string) {
    const type = "INTERNAL_ERROR";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
}
