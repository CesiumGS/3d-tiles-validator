import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";

/**
 * Methods to create `ValidationIssue` instances that describe
 * issues related to metadata
 */
export class MetadataValidationIssues {
  static METADATA_INVALID_SIZE(path: string, message: string) {
    const type = "METADATA_INVALID_SIZE";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
  static METADATA_INVALID_ALIGNMENT(path: string, message: string) {
    const type = "METADATA_INVALID_ALIGNMENT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
  static METADATA_INVALID_OFFSETS(path: string, message: string) {
    const type = "METADATA_INVALID_OFFSETS";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
  static METADATA_VALUE_NOT_IN_RANGE(path: string, message: string) {
    const type = "METADATA_VALUE_NOT_IN_RANGE";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  static METADATA_VALUE_REQUIRED_BUT_MISSING(
    path: string,
    propertyName: string
  ) {
    const type = "METADATA_VALUE_REQUIRED_BUT_MISSING";
    const severity = ValidationIssueSeverity.ERROR;
    const message =
      `The property '${propertyName}' is 'required', but ` +
      `no value has been given`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
  static METADATA_SEMANTIC_UNKNOWN(
    path: string,
    propertyName: string,
    semantic: string
  ) {
    const type = "METADATA_SEMANTIC_UNKNOWN";
    const severity = ValidationIssueSeverity.WARNING;
    const message = `The property '${propertyName}' has unknown semantic '${semantic}'`;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
  static METADATA_SEMANTIC_INVALID(path: string, message: string) {
    const type = "METADATA_SEMANTIC_INVALID";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
}
