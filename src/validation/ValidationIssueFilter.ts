import { ValidationIssue } from "./ValidationIssue";

/**
 * A predicate that is used for filtering issues that
 * are contained in a `ValidationResult`.
 *
 * It receives the "stack" of issues, i.e. the path
 * leading from the top-level issue through its
 * 'causes', and returns whether the leaf issue
 * (i.e. the last element of the issues stack)
 * should be included in the filtered result.
 *
 * @beta
 */
export type ValidationIssueFilter = (issuesStack: ValidationIssue[]) => boolean;
