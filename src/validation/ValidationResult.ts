import { ValidationIssue } from "./ValidationIssue";
import { ValidationIssueSeverity } from "./ValidationIssueSeverity";

/**
 * A class summarizing the result of a validation pass.
 *
 * It mayinly summarizes a set of `ValicationIssue` instances.
 *
 * TODO: Further functionalities will likely be added here,
 * including JSON serialization, functions to obtain all
 * errors or all warnings, functions that provide
 * summary information, or details like a timestamp for
 * the time of the validation.
 */
export class ValidationResult {
  private readonly _date: Date;
  /**
   * The list of `ValidationIssue` instances
   */
  private readonly _issues: ValidationIssue[];

  constructor() {
    this._date = new Date(Date.now());
    this._issues = [];
  }

  /**
   * Adds a new `ValidationIssue` to this result. This method
   * should usually not be called by clients. It is only
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

  get(index: number): ValidationIssue {
    return this._issues[index];
  }

  private count(severity: string): number {
    return this._issues.filter((i) => i.severity === severity).length;
  }

  toJson(): any {
    const issuesJson =
      this._issues.length > 0 ? this._issues.map((i) => i.toJson()) : undefined;
    const numErrors = this.count(ValidationIssueSeverity.ERROR);
    const numWarnings = this.count(ValidationIssueSeverity.WARNING);
    return {
      date: this._date,
      numErrors: numErrors,
      numWarnings: numWarnings,
      issues: issuesJson,
    };
  }
  serialize() {
    return JSON.stringify(this.toJson(), undefined, 2);
  }
}
