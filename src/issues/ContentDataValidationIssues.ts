import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";

/**
 * Methods to create `ValidationIssue` instances that describe
 * issues related to content data.
 */
export class ContentDataValidationIssues {
  /**
   * Indicates that tile content was not fully enclosed by a
   * bounding volume.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static CONTENT_NOT_ENCLOSED_BY_BOUNDING_VOLUME(path: string, message: string) {
    const type = "CONTENT_NOT_ENCLOSED_BY_BOUNDING_VOLUME";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

}
