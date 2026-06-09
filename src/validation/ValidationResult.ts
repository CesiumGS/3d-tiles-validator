import { ValidationIssue } from "./ValidationIssue";
import { ValidationIssueFilter } from "./ValidationIssueFilter";
import { ValidationIssueSeverity } from "./ValidationIssueSeverity";
import { ValidationResults } from "./ValidationResults";

/**
 * A class summarizing the result of a validation pass.
 *
 * It mainly summarizes a set of `ValidationIssue` instances.
 *
 * @beta
 */
export class ValidationResult {
  /**
   * The date when this instance was created (this
   * indicates the start of the validation process)
   */
  private readonly _date: Date;

  /**
   * The list of `ValidationIssue` instances
   */
  private readonly _issues: ValidationIssue[];

  private _numErrors: number;

  private _numWarnings: number;

  private _numInfos: number;

  private _totalNumErrors: number;

  private _totalNumWarnings: number;

  private _totalNumInfos: number;

  /**
   * Creates a new, empty validation result.
   *
   * Clients should not call this method. They only receive
   * validation results from the validation methods.
   *
   * @returns The new `ValidationResult`
   * @internal
   */
  static create(): ValidationResult {
    return new ValidationResult(new Date(Date.now()));
  }

  /**
   * Private constructor for `filter`
   *
   * @param date - The date that is stored in the result
   */
  private constructor(date: Date) {
    this._date = date;
    this._issues = [];
    this._numErrors = 0;
    this._numWarnings = 0;
    this._numInfos = 0;
    this._totalNumErrors = 0;
    this._totalNumWarnings = 0;
    this._totalNumInfos = 0;
  }

  /**
   * Creates a new `ValidationResult` by filtering this one,
   * using the given `ValidationIssueFilter` as the inclusion
   * predicate.
   *
   * @param includePredicate - The predicate that determines whether
   * a certain issue should be included in the result
   * @returns The filtered result
   */
  filter(includePredicate: ValidationIssueFilter): ValidationResult {
    const result = new ValidationResult(this._date);
    ValidationResults.filter(this, includePredicate, result);
    return result;
  }

  /**
   * Returns a read-only view on the issues of this result
   */
  get issues(): readonly ValidationIssue[] {
    return this._issues;
  }

  /**
   * Adds a new `ValidationIssue` to this result.
   *
   * This method should not be called by clients. It is mainly
   * intended for the `ValidationContext#addIssue` method,
   * to collect the issues during validation.
   *
   * @param issue - The `ValidationIssue` to add.
   * @internal
   */
  add(issue: ValidationIssue): void {
    this._issues.push(issue);

    if (issue.severity === ValidationIssueSeverity.ERROR) {
      this._numErrors++;
    } else if (issue.severity === ValidationIssueSeverity.WARNING) {
      this._numWarnings++;
    } else if (issue.severity === ValidationIssueSeverity.INFO) {
      this._numInfos++;
    }

    this._totalNumErrors += ValidationResult.countLeaves(
      issue,
      ValidationIssueSeverity.ERROR
    );
    this._totalNumWarnings += ValidationResult.countLeaves(
      issue,
      ValidationIssueSeverity.WARNING
    );
    this._totalNumInfos += ValidationResult.countLeaves(
      issue,
      ValidationIssueSeverity.INFO
    );
  }

  /**
   * Returns the number of "leaves" in the given issue that have the
   * given severity.
   *
   * In this context, "leaves" are issues that do not have any direct
   * "causes". So for example, for an issue that has three "causes"
   * with two of them being a WARNING, then calling this method with
   * the root issue and WARNING severity will return 2.
   *
   * @param issue - The issue
   * @param severity - The severity
   * @returns The result
   */
  private static countLeaves(
    issue: ValidationIssue,
    severity: ValidationIssueSeverity
  ): number {
    const causes = issue.causes;
    if (causes.length === 0) {
      if (issue.severity === severity) {
        return 1;
      }
      return 0;
    }
    let sum = 0;
    for (const cause of causes) {
      sum += ValidationResult.countLeaves(cause, severity);
    }
    return sum;
  }

  /**
   * Returns the number of issues that are contained in this result
   *
   * @returns The number of issues
   */
  get length(): number {
    return this._issues.length;
  }

  /**
   * Returns the validation issue at the specified index in this
   * result
   *
   * @param index - The index
   * @returns The validation issue
   */
  get(index: number): ValidationIssue {
    return this._issues[index];
  }

  /**
   * Computes the number of issues in this result that have
   * the `ERROR` severity level
   *
   * @internal
   */
  get numErrors(): number {
    return this._numErrors;
  }

  /**
   * Computes the number of issues in this result that have
   * the `WARNING` severity level
   *
   * @internal
   */
  get numWarnings(): number {
    return this._numWarnings;
  }

  /**
   * Computes the number of issues in this result that have
   * the `INFO` severity level
   *
   * @internal
   */
  get numInfos(): number {
    return this._numInfos;
  }

  /**
   * Creates a JSON representation of this result and all the
   * issues that it contains.
   *
   * @returns The JSON representation of this result
   * @internal
   */
  toJson(): any {
    const issuesJson =
      this._issues.length > 0 ? this._issues.map((i) => i.toJson()) : undefined;
    return {
      date: this._date,
      numErrors: this._numErrors,
      numWarnings: this._numWarnings,
      numInfos: this._numInfos,
      totalNumErrors: this._totalNumErrors,
      totalNumWarnings: this._totalNumWarnings,
      totalNumInfos: this._totalNumInfos,
      issues: issuesJson,
    };
  }

  /**
   * Converts the given JSON object into a `ValidationResult` instance.
   *
   * This does not perform any sanity checks on the given object.
   * The object is assumed to be one that was created with `toJson`.
   *
   * @param object - The object
   * @returns The `ValidationResult`
   */
  static fromJson(object: any) {
    const result = ValidationResult.create();
    const issues = object.issues;
    for (const issue of issues) {
      result.add(ValidationIssue.fromJson(issue));
    }
    return result;
  }

  /**
   * Creates a JSON string representation of this result.
   *
   * Some details about the format of this result are not yet
   * specified, and might change in future releases.
   *
   * @returns The string representation
   */
  serialize(): string {
    return JSON.stringify(this.toJson(), undefined, 2);
  }

  /**
   * Parse a `ValidationResult` from the given JSON string.
   *
   * This does not perform any sanity checks. The given string is assumed
   * to be in the shape that is created with `serialize`.
   *
   * @param jsonString - The JSON string
   * @returns The `ValidationResult`
   */
  static deserialize(jsonString: string): ValidationResult {
    const object = JSON.parse(jsonString);
    return ValidationResult.fromJson(object);
  }
}
