import { ValidationIssueSeverity } from "./ValidationIssueSeverity";

/**
 * A class summarizing the information about an issue that was
 * encountered during the validation process.
 *
 * @beta
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

  /**
   * Creates a new instance. See the properties documentation for
   * details about the given parameters.
   *
   * @param type - The type
   * @param path - The path
   * @param message - The message
   * @param severity - The severity
   * @internal
   */
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

  /**
   * Returns the type of this issue.
   *
   * This is a an identifier for the type of the issue,
   * in `UPPER_SNAKE_CASE`, describing what caused the
   * issue.
   *
   * @returns The type
   */
  get type(): string {
    return this._type;
  }

  /**
   * Returns the path leading to the element that caused the issue.
   *
   * This resembles a "JSON path", but may contain elements
   * that go outside of the actual containing JSON (for example,
   * it may contain the name of a tile content file)
   *
   * @returns The path
   */
  get path(): string {
    return this._path;
  }

  /**
   * Returns the human-readable message that describes the issue.
   *
   * This contains further details about the issue, often with
   * information that indicates how to resolve the issue.
   *
   * @returns The message
   */
  get message(): string {
    return this._message;
  }

  /**
   * Returns the severity of this issue
   *
   * @returns The `ValidationIssueSeverity`
   */
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
   * @internal
   */
  addCause(cause: ValidationIssue) {
    this._causes.push(cause);
  }

  /**
   * Returns a read-only view of all issues that eventually
   * caused this issue (this may be an empty array).
   *
   * @returns The causes of this issue
   */
  get causes(): readonly ValidationIssue[] {
    return this._causes;
  }

  /**
   * Creates a JSON representation of this issue and all the
   * causes that it contains.
   *
   * @returns The JSON representation of this issue
   * @internal
   */
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

  /**
   * Converts the given JSON object into a `ValidationIssue` instance.
   *
   * This does not perform any sanity checks on the given object.
   * The object is assumed to be one that was created with `toJson`.
   *
   * @param object - The object
   * @returns The `ValidationIssue`
   */
  static fromJson(object: any): ValidationIssue {
    const type = object.type;
    const path = object.path;
    const message = object.message;
    const severity = object.severity;
    const issue = new ValidationIssue(type, path, message, severity);
    const causes = object.causes;
    if (causes != undefined) {
      for (const cause of causes) {
        const causeObject = ValidationIssue.fromJson(cause);
        issue.addCause(causeObject);
      }
    }
    return issue;
  }

  /**
   * Creates a JSON string representation of this issue
   *
   * @returns The string representation
   * @internal
   */
  serialize(): string {
    return JSON.stringify(this.toJson(), undefined, 2);
  }

  /**
   * Parse a `ValidationIssue` from the given JSON string.
   *
   * This does not perform any sanity checks. The given string is assumed
   * to be in the shape that is created with `serialize`.
   *
   * @param jsonString - The JSON string
   * @returns The `ValidationIssue`
   */
  static deserialize(jsonString: string): ValidationIssue {
    const object = JSON.parse(jsonString);
    return ValidationIssue.fromJson(object);
  }
}
