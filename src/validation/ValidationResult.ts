import { ValidationIssue } from "./ValidationIssue";
import { ValidationIssueFilter } from "./ValidationIssueFilter";
import { ValidationIssueSeverity } from "./ValidationIssueSeverity";
import { ValidationResults } from "./ValidationResults";

/**
 * A class summarizing the result of a validation pass.
 *
 * It mainly summarizes a set of `ValidationIssue` instances.
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
   * Creates a new, empty validation result
   *
   * @returns The new `ValidationResult`
   */
  static create(): ValidationResult {
    return new ValidationResult(new Date(Date.now()));
  }

  /**
   * Private constructor for `shallowCopy`
   *
   * @param date The date that is stored in the result
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
   * @param includePredicate The predicate that determines whether
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
   * Adds a new `ValidationIssue` to this result. This method
   * should usually not be called by clients. It is mainly
   * intended for the `ValidationContext#addIssue` method,
   * to collect the issues during validation.
   *
   * @param issue The `ValidationIssue` to add.
   */
  add(issue: ValidationIssue): void {
    this._issues.push(issue);
  }

  get length(): number {
    return this._issues.length;
  }

  get numErrors(): number {
    return this.count(ValidationIssueSeverity.ERROR);
  }

  get numWarnings(): number {
    return this.count(ValidationIssueSeverity.WARNING);
  }

  get numInfos(): number {
    return this.count(ValidationIssueSeverity.INFO);
  }

  get(index: number): ValidationIssue {
    return this._issues[index];
  }

  private count(severity: ValidationIssueSeverity): number {
    return this._issues.reduce((accumulator, element) => {
      if (element.severity === severity) {
        return accumulator + 1;
      }
      return accumulator;
    }, 0);
  }

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
  serialize() {
    return JSON.stringify(this.toJson(), undefined, 2);
  }
}
