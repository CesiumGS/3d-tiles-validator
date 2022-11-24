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
    return this.count(ValidationIssueSeverity.ERROR);
  }

  /**
   * Computes the number of issues in this result that have
   * the `WARNING` severity level
   *
   * @internal
   */
  get numWarnings(): number {
    return this.count(ValidationIssueSeverity.WARNING);
  }

  /**
   * Computes the number of issues in this result that have
   * the `INFO` severity level
   *
   * @internal
   */
  get numInfos(): number {
    return this.count(ValidationIssueSeverity.INFO);
  }

  /**
   * Counts the number of issues in this result that have the
   * given severity level
   *
   * @param severity - The severity level
   * @returns The number of issues
   */
  private count(severity: ValidationIssueSeverity): number {
    return this._issues.reduce((accumulator, element) => {
      if (element.severity === severity) {
        return accumulator + 1;
      }
      return accumulator;
    }, 0);
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
    const numErrors = this.numErrors;
    const numWarnings = this.numWarnings;
    const numInfos = this.numInfos;
    return {
      date: this._date,
      numErrors: numErrors,
      numWarnings: numWarnings,
      numInfos: numInfos,
      issues: issuesJson,
    };
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
}
