import { ValidationIssueSeverity } from "./ValidationIssueSeverity";

/**
 * A class summarizing the information about an issue that was
 * encountered during the validation process.
 */
export class ValidationIssue {
  /**
   * The type of the issue. This should be an identifier for the
   * type of the issue, in `UPPER_SNAKE_CASE`, describing what
   * caused the issue.
   */
  private _type: string;

  /**
   * The JSON path leading to the element that caused the issue.
   */
  private _path: string;

  /**
   * The human-readable message that describes the issue, preferably
   * with information that indicates how to resolve the issue.
   */
  private _message: string;

  /**
   * A severity level for the issue (e.g. WARNING or ERROR)
   */
  private _severity: ValidationIssueSeverity;

  /**
   * Validation issues that are individual issues, which, as a whole,
   * caused this validation issue.
   *
   * (Right now, this is mainly used to summarize issues that may
   * occur during the validation of tile content, and which are
   * combined into a general `CONTENT_VALIDATION_ERROR`)
   */
  private _internalIssues: ValidationIssue[];

  constructor(
    type: string,
    path: string,
    message: string,
    severity: ValidationIssueSeverity
  ) {
    this._type = type;
    this._path = path;
    this._message = message;
    this._severity = severity;
    this._internalIssues = [];
  }

  get type(): string {
    return this._type;
  }

  get path(): string {
    return this._path;
  }

  get message(): string {
    return this._message;
  }

  get severity(): ValidationIssueSeverity {
    return this._severity;
  }

  addInternalIssue(issue: ValidationIssue) {
    this._internalIssues.push(issue);
  }

  get internalIssues(): ValidationIssue[] {
    return this._internalIssues;
  }

  toJson(): any {
    const internalIssuesJson =
      this.internalIssues.length > 0
        ? this.internalIssues.map((i) => i.toJson())
        : undefined;
    return {
      type: this.type,
      path: this.path,
      message: this.message,
      severity: this.severity,
      internalIssues: internalIssuesJson,
    };
  }
  serialize() {
    return JSON.stringify(this.toJson(), undefined, 2);
  }
}