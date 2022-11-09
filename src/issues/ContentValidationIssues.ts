import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";
import { ValidationResult } from "../validation/ValidationResult";

/**
 * Methods to create `ValidationIssue` instances that describe
 * issues related to external content. This may be (binary)
 * tile content, or any other external resource.
 */
export class ContentValidationIssues {
  /**
   * Creates a new content `ValidationIssue` that summarizes the
   * given `ValidationResult`, or `undefined` if the given result
   * is empty.
   *
   * If the given result contains errors, then a
   * `CONTENT_VALIDATION_ERROR` will be created, with the
   * issues from the given result as its causes.
   *
   * Otherwsie, if the given result contains warnings, then a
   * `CONTENT_VALIDATION_WARNING` will be created, with the
   * issues from the given result as its causes.
   *
   * @param path The path
   * @param result The `ValidationResult`
   * @returns The `ValidationIssue`, or `undefined`
   */
  static createFrom(
    path: string,
    result: ValidationResult
  ): ValidationIssue | undefined {
    let hasErrors = false;
    let hasWarnings = false;
    let hasInfos = false;
    for (let i = 0; i < result.length; i++) {
      const issue = result.get(i);
      if (issue.severity == ValidationIssueSeverity.ERROR) {
        hasErrors = true;
      }
      if (issue.severity == ValidationIssueSeverity.WARNING) {
        hasWarnings = true;
      }
      if (issue.severity == ValidationIssueSeverity.INFO) {
        hasInfos = true;
      }
    }
    if (!hasErrors && !hasWarnings && !hasInfos) {
      return undefined;
    }
    let resultIssue;
    if (hasErrors) {
      const message = `Content ${path} caused validation errors`;
      resultIssue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
        path,
        message
      );
    } else if (hasWarnings) {
      const message = `Content ${path} caused validation warnings`;
      resultIssue = ContentValidationIssues.CONTENT_VALIDATION_WARNING(
        path,
        message
      );
    } else {
      const message = `Content ${path} caused validation infos`;
      resultIssue = ContentValidationIssues.CONTENT_VALIDATION_INFO(
        path,
        message
      );
    }
    for (let i = 0; i < result.length; i++) {
      const issue = result.get(i);
      resultIssue.addCause(issue);
    }
    return resultIssue;
  }

  /**
   * Indicates that the validation of content caused an error.
   *
   * The returned issue may have `causes` that summarize
   * the issues that eventually caused this issue.
   *
   * @param path The path for the `ValidationIssue`
   * @param message The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static CONTENT_VALIDATION_ERROR(path: string, message: string) {
    const type = "CONTENT_VALIDATION_ERROR";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the validation of content caused a warning.
   *
   * The returned issue may have `causes` that summarize
   * the issues that eventually caused this issue.
   *
   * @param path The path for the `ValidationIssue`
   * @param message The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static CONTENT_VALIDATION_WARNING(path: string, message: string) {
    const type = "CONTENT_VALIDATION_WARNING";
    const severity = ValidationIssueSeverity.WARNING;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the validation of content caused an issue
   * with severity level 'INFO'.
   *
   * The returned issue may have `causes` that summarize
   * the issues that eventually caused this issue.
   *
   * @param path The path for the `ValidationIssue`
   * @param message The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static CONTENT_VALIDATION_INFO(path: string, message: string) {
    const type = "CONTENT_VALIDATION_INFO";
    const severity = ValidationIssueSeverity.INFO;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the JSON part of a tile content was invalid.
   * This may refer to not being able to parse the JSON data
   * from a binary blob, or that the validation of the JSON
   * structure itself (using the legacy validation) caused an
   * error.
   *
   * @param path The path for the `ValidationIssue`
   * @param message The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static CONTENT_JSON_INVALID(path: string, message: string) {
    const type = "CONTENT_JSON_INVALID";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
}
