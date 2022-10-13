import { ValidationIssue } from "../../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../../validation/ValidationIssueSeverity";

export class BoundingVolumeS2ValidationIssues {
  static S2_TOKEN_INVALID(path: string, message: string) {
    const type = "S2_TOKEN_INVALID";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
}
