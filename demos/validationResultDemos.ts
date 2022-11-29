import { ValidationIssue } from "../src/validation/ValidationIssue";
import { ValidationIssueSeverity } from "../src/validation/ValidationIssueSeverity";
import { ValidationResult } from "../src/validation/ValidationResult";
import { ValidationIssueFilters } from "../src/validation/ValidationIssueFilters";
import { ValidationResults } from "../src/validation/ValidationResults";

// A function to create an unspecified `ValidationResult`
// that contains dummy issues for demonstrating the
// validation result filtering options
function createDemoResult() {
  function createError(id: string) {
    const issue = new ValidationIssue(
      `EXAMPLE_ERROR_${id}`,
      "example",
      `Example Error ${id}`,
      ValidationIssueSeverity.ERROR
    );
    return issue;
  }
  function createWarning(id: string) {
    const issue = new ValidationIssue(
      `EXAMPLE_WARNING_${id}`,
      "example",
      `Example Warning ${id}`,
      ValidationIssueSeverity.WARNING
    );
    return issue;
  }
  function createInfo(id: string) {
    const issue = new ValidationIssue(
      `EXAMPLE_INFO_${id}`,
      "example",
      `Example Info ${id}`,
      ValidationIssueSeverity.INFO
    );
    return issue;
  }
  function createContentWarning(id: string, childId: string) {
    const issue = new ValidationIssue(
      `EXAMPLE_CONTENT_WARNING_${id}`,
      "example/content/" + childId,
      `Example Content Warning ${id}`,
      ValidationIssueSeverity.WARNING
    );
    issue.addCause(createWarning(id + childId));
    issue.addCause(createInfo(id + childId));
    return issue;
  }

  function createContentError(id: string, childId: string) {
    const issue = new ValidationIssue(
      `EXAMPLE_CONTENT_ERROR_${id}`,
      "example/content/" + childId,
      `Example Content Error ${id}`,
      ValidationIssueSeverity.ERROR
    );
    issue.addCause(createError(id + childId));
    issue.addCause(createWarning(id + childId));
    issue.addCause(createInfo(id + childId));
    return issue;
  }

  function createNestedContentError(
    id: string,
    childId: string,
    grandChildId: string
  ) {
    const issue = new ValidationIssue(
      `EXAMPLE_CONTENT_ERROR_${id}`,
      "example/content/" + childId,
      `Example Content Error ${id}`,
      ValidationIssueSeverity.ERROR
    );
    issue.addCause(createContentError(id, childId + grandChildId));
    issue.addCause(createContentWarning(id, childId + grandChildId));
    issue.addCause(createError(id + childId));
    issue.addCause(createWarning(id + childId));
    issue.addCause(createInfo(id + childId));
    return issue;
  }

  const result = ValidationResult.create();

  result.add(createError("A"));
  result.add(createWarning("A"));
  result.add(createInfo("A"));

  result.add(createContentWarning("B", "0"));
  result.add(createContentWarning("B", "1"));

  result.add(createError("C"));
  result.add(createWarning("C"));
  result.add(createInfo("C"));

  result.add(createContentError("D", "0"));
  result.add(createContentError("D", "1"));

  result.add(createNestedContentError("E", "0", "x"));
  return result;
}

// A function that demonstrates the basic validation
// result filtering functionality
function validationResultFilterDemo() {
  const result = createDemoResult();

  console.log("Initial:");
  console.log(ValidationResults.createSimpleResultString(result));

  // Create some shortcuts for this demo:
  const byIncludedSeverities = ValidationIssueFilters.byIncludedSeverities;
  const byExcludedTypes = ValidationIssueFilters.byExcludedTypes;
  const ERROR = ValidationIssueSeverity.ERROR;
  const INFO = ValidationIssueSeverity.INFO;

  // Demonstrate basic filtering:
  console.log("Filtered by severities and types");
  console.log(" - include severities ERROR and INFO");
  console.log(" - exclude types EXAMPLE_ERROR_A and EXAMPLE_INFO_C");
  const filtered = result
    .filter(byIncludedSeverities(ERROR, INFO))
    .filter(byExcludedTypes("EXAMPLE_ERROR_A", "EXAMPLE_INFO_C"));
  console.log(ValidationResults.createSimpleResultString(filtered));

  // Demonstrate complex filtering:
  // Defines a filter that filters out all issues that are the causes
  // of issues with the type 'EXAMPLE_CONTENT...' (warning, info, or error)
  // and the actual issue is a 'EXAMPLE_WARNING...'
  console.log("Filtered by complex, custom filter:");
  console.log("(This filter is omitting, for example, issues like");
  console.log("[...] -> EXAMPLE_CONTENT_ERROR_E -> EXAMPLE_WARNING_E0x");
  const complexFilter = (issuesStack: ValidationIssue[]) => {
    if (issuesStack.length > 1) {
      const issue0 = issuesStack[issuesStack.length - 2];
      const issue1 = issuesStack[issuesStack.length - 1];
      if (
        issue0.type.startsWith("EXAMPLE_CONTENT") &&
        issue1.type.startsWith("EXAMPLE_WARNING")
      ) {
        return false;
      }
    }
    return true;
  };
  const filteredComplex = result.filter(complexFilter);
  console.log(ValidationResults.createSimpleResultString(filteredComplex));
}

validationResultFilterDemo();
