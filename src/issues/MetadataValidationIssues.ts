import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";

/**
 * Methods to create `ValidationIssue` instances that describe
 * issues related to (binary) metadata)
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
}
