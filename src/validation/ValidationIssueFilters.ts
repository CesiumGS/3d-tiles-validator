import { ValidationIssue } from "./ValidationIssue";
import { ValidationIssueSeverity } from "./ValidationIssueSeverity";
import { ValidationIssueFilter } from "./ValidationIssueFilter";

/**
 * Methods related to `ValidationIssueFilter` instances.
 *
 * @beta
 */
export class ValidationIssueFilters {
  /**
   * Creates a `ValidationIssueFilter` that excludes all
   * `ValidationIssue` instances where the `ValidationIssue#type`
   * is one of the given strings.
   *
   * @param excludedTypes - The excluded type strings
   * @returns The `ValidationIssueFilter`
   */
  static byExcludedTypes(...excludedTypes: string[]): ValidationIssueFilter {
    const predicate = (issues: ValidationIssue[]) =>
      !excludedTypes.includes(issues[issues.length - 1].type);
    return predicate;
  }

  /**
   * Creates a `ValidationIssueFilter` that includes all
   * `ValidationIssue` instances where the `ValidationIssue#severity`
   * is one of the given severities.
   *
   * @param includedServerities - The included severities
   * @returns The `ValidationIssueFilter`
   */
  static byIncludedSeverities(
    ...includedServerities: ValidationIssueSeverity[]
  ): ValidationIssueFilter {
    const predicate = (issues: ValidationIssue[]) =>
      includedServerities.includes(issues[issues.length - 1].severity);
    return predicate;
  }
}
