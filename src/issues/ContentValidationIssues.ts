import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";
import { ValidationResult } from "../validation/ValidationResult";

/**
 * Methods to create `ValidationIssue` instances that describe
 * issues related to (binary) tile content.
 */
export class ContentValidationIssues {
  /**
   * Creates a new `ValidationIssue` that summarizes the
   * given `ValidationResult`, or `undefined` if the given
   * result is empty.
   *
   * The returned issue will have the issues from the given
   * result as its 'causes'.
   *
   * The type of the returned issue will be of the form
   * "CONTENT_VALIDATION_<severity>", with the 'severity'
   * being the highest severity of any issue in the given
   * result (ERROR, WARNING, or INFO).
   *
   * @param path - The path
   * @param result - The `ValidationResult`
   * @returns The `ValidationIssue`, or `undefined`
   */
  static createForContent(
    path: string,
    result: ValidationResult
  ): ValidationIssue | undefined {
    return ContentValidationIssues.createFrom(
      path,
      result,
      "CONTENT_VALIDATION"
    );
  }

  /**
   * Creates a new `ValidationIssue` that summarizes the
   * given `ValidationResult`, or `undefined` if the given
   * result is empty.
   *
   * The returned issue will have the issues from the given
   * result as its 'causes'.
   *
   * The type of the returned issue will be of the form
   * "EXTERNAL_TILESET_VALIDATION_<severity>", with the 'severity'
   * being the highest severity of any issue in the given
   * result (ERROR, WARNING, or INFO).
   *
   * @param path - The path
   * @param result - The `ValidationResult`
   * @returns The `ValidationIssue`, or `undefined`
   */
  static createForExternalTileset(
    path: string,
    result: ValidationResult
  ): ValidationIssue | undefined {
    return ContentValidationIssues.createFrom(
      path,
      result,
      "EXTERNAL_TILESET_VALIDATION"
    );
  }

  /**
   * Creates a new `ValidationIssue` that summarizes the
   * given `ValidationResult`, or `undefined` if the given
   * result is empty.
   *
   * The returned issue will have the issues from the given
   * result as its 'causes'.
   *
   * The severity of the returned issue will be the highest
   * severity of any issue in the given result (ERROR, WARNING,
   * or INFO).
   *
   * The type of the resulting issue will be of the form
   * "<prefix>_<severity>".
   *
   * @param path - The path
   * @param result - The `ValidationResult`
   * @returns The `ValidationIssue`, or `undefined`
   */
  private static createFrom(
    path: string,
    result: ValidationResult,
    prefix: string
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
      const message = `${path} caused validation errors`;
      resultIssue = ContentValidationIssues.createIssue(
        prefix,
        ValidationIssueSeverity.ERROR,
        path,
        message
      );
    } else if (hasWarnings) {
      const message = `${path} caused validation warnings`;
      resultIssue = ContentValidationIssues.createIssue(
        prefix,
        ValidationIssueSeverity.WARNING,
        path,
        message
      );
    } else {
      const message = `${path} caused validation infos`;
      resultIssue = ContentValidationIssues.createIssue(
        prefix,
        ValidationIssueSeverity.INFO,
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
   * Creates a new issue from the given input, with
   * the type of the resulting issue being of the 
   * form "<prefix>_<severity>".

   * @param prefix - The prefix for the 'type'
   * @param severity - The severity
   * @param path - The path
   * @param message - The message
   * @returns The new validation issue
   */
  private static createIssue(
    prefix: string,
    severity: ValidationIssueSeverity,
    path: string,
    message: string
  ) {
    const type = prefix + "_" + severity;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the validation of content caused an error.
   *
   * The returned issue may receive `causes` that summarize
   * the issues that eventually caused this issue.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
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
   * The returned issue may receive `causes` that summarize
   * the issues that eventually caused this issue.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
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
   * The returned issue may receive `causes` that summarize
   * the issues that eventually caused this issue.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
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
   *
   * This may refer to not being able to parse the JSON data
   * from a binary blob, or that the validation of the JSON
   * structure itself (using the legacy validation) caused an
   * error.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static CONTENT_JSON_INVALID(path: string, message: string) {
    const type = "CONTENT_JSON_INVALID";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
}
