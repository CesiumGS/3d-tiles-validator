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
  private readonly _type: string;

  /**
   * The path leading to the element that caused the issue.
   *
   * This resembles a "JSON path", but may contain elements
   * that go outside of the actual containing JSON (for example,
   * it may contain the name of a tile content file)
   */
  private readonly _path: string;

  /**
   * The human-readable message that describes the issue, preferably
   * with information that indicates how to resolve the issue.
   */
  private readonly _message: string;

  /**
   * A severity level for the issue (e.g. WARNING or ERROR)
   */
  private readonly _severity: ValidationIssueSeverity;

  /**
   * Validation issues that are individual issues, which, as a whole,
   * caused this validation issue.
   *
   * This is used to summarize issues that may occur during the
   * validation of tile content or external tilesets, and which
   * are combined into a single validation issue.
   */
  private readonly _causes: ValidationIssue[];

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
    this._causes = [];
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

  /**
   * Adds the given validation issue as one of the 'causes' of
   * this issue.
   *
   * Clients should not call this function. It is only used
   * to construct validation issues internally.
   *
   * @param cause - The issue to add as a cause
   */
  addCause(cause: ValidationIssue) {
    this._causes.push(cause);
  }

  get causes(): readonly ValidationIssue[] {
    return this._causes;
  }

  toJson(): any {
    const causesJson =
      this.causes.length > 0 ? this.causes.map((i) => i.toJson()) : undefined;
    return {
      type: this.type,
      path: this.path,
      message: this.message,
      severity: this.severity,
      causes: causesJson,
    };
  }
  serialize() {
    return JSON.stringify(this.toJson(), undefined, 2);
  }
}
