import { ValidationIssue } from "./ValidationIssue";
import { ValidationResult } from "./ValidationResult";
import { ValidationIssueFilter } from "./ValidationIssueFilter";

/**
 * Methods related to `ValidationResult` instances.
 *
 * These are used internally, for the implementation of the
 * `ValidationResult#filter` operation.
 *
 * @internal
 */
export class ValidationResults {
  /**
   * Filters the issues of the given input `ValidationResults`,
   * and passes the includes ones to the given output.
   *
   * @param input - The input `ValidationResult`
   * @param inclusionPredicate - The predicate that says whether
   * a certain issue should be included in the result.
   * @param output - The `ValidationResult` to which
   * the included issues will be added.
   */
  static filter(
    input: ValidationResult,
    inclusionPredicate: ValidationIssueFilter,
    output: ValidationResult
  ): void {
    const inputIssues = input.issues;
    const outputIssues = ValidationResults.filterIssues(
      inputIssues,
      [],
      inclusionPredicate
    );
    for (const outputIssue of outputIssues) {
      output.add(outputIssue);
    }
  }

  /**
   * Filters the given array of issues, and returns a new
   * array with the filtered issues.
   *
   * Note that this does a "deep" filtering: It applies the
   * given predicate to each element of the given array, and
   * to all 'causes' of each element, recursively.
   *
   * The 'issuesStack' keeps track of the path from the
   * root issue to the current issue during that recursion.
   *
   * @param inputIssues - The input issues
   * @param issuesStack - The stack of issues
   * @param inclusionPredicate - The inclusion predicate
   * @returns The filtered issues
   */
  private static filterIssues(
    inputIssues: readonly ValidationIssue[],
    issuesStack: ValidationIssue[],
    inclusionPredicate: ValidationIssueFilter
  ): ValidationIssue[] {
    const outputIssues = [];
    for (let i = 0; i < inputIssues.length; i++) {
      const inputIssue = inputIssues[i];
      issuesStack.push(inputIssue);
      const included = inclusionPredicate(issuesStack);
      if (included) {
        const outputIssue = ValidationResults.filterCauses(
          inputIssue,
          issuesStack,
          inclusionPredicate
        );
        outputIssues.push(outputIssue);
      }
      issuesStack.pop();
    }
    return outputIssues;
  }

  /**
   * Applies the given filter to all 'causes' of the given
   * issue, and returns a new issue that is equal to the
   * given input, but with the 'causes' filtered accordingly.
   *
   * @param inputIssue - The input issue
   * @param issuesStack - The issues stack
   * @param inclusionPredicate - The inclusion predicate
   * @returns The filtered issue
   */
  private static filterCauses(
    inputIssue: ValidationIssue,
    issuesStack: ValidationIssue[],
    inclusionPredicate: ValidationIssueFilter
  ): ValidationIssue {
    const outputIssue = new ValidationIssue(
      inputIssue.type,
      inputIssue.path,
      inputIssue.message,
      inputIssue.severity
    );
    const inputCauses = inputIssue.causes;
    const outputCauses = ValidationResults.filterIssues(
      inputCauses,
      issuesStack,
      inclusionPredicate
    );
    for (const outputCause of outputCauses) {
      outputIssue.addCause(outputCause);
    }
    return outputIssue;
  }

  /**
   * Only used for tests and debugging:
   *
   * Creates a string representation of the given validation result
   * that only consists of the 'type' of each validation issue,
   * indented to reflect the structure of the issues and their causes.
   *
   * @param inputResult - The validation result
   * @returns The string representation
   */
  static createSimpleResultString(inputResult: ValidationResult): string {
    let result = "";
    const inputIssues = inputResult.issues;
    for (const inputIssue of inputIssues) {
      const issueString = ValidationResults.createSimpleIssueString(
        inputIssue,
        ""
      );
      result += issueString;
    }
    return result;
  }

  /**
   * Only used for tests and debugging:
   *
   * Creates a string representation of the given validation issue that
   * only consists of the 'type' of this issue and all its causes.
   *
   * @param inputIssue - The issue
   * @param indentation - The indentation to use
   * @returns The string representation
   */
  private static createSimpleIssueString(
    inputIssue: ValidationIssue,
    indentation: string
  ): string {
    let result = "";
    result += indentation + inputIssue.type + "\n";
    for (const cause of inputIssue.causes) {
      const causeString = ValidationResults.createSimpleIssueString(
        cause,
        indentation + "    "
      );
      result += causeString;
    }
    return result;
  }
}
