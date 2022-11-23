import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A class for validations related to tempalte URIs for implicit tiling
 *
 * @internal
 */
export class TemplateUriValidator {
  /**
   * Validate that the given URI is a valid template URI.
   *
   * If the URI is valid, then `true` is returned.
   *
   * If the URI contains a `{variable}` expression with a variable
   * name that is not `level`, `x`, `y` (or `z` for "OCTREE"), then
   * a `TEMPLATE_URI_INVALID_VARIABLE_NAME` validation issue will
   * be added to the given context, and `false` is returned.
   *
   * If the URI does not contain one of these (expected) variable names,
   * then a `TEMPLATE_URI_MISSING_VARIABLE_NAME` (warning) issue will
   * be added to the given context, but `true` will still be returned.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param name - A name for the uri
   * @param uri - The uri
   * @param subdivisionScheme - The subdivisionScheme, "QUADTREE" or "OCTREE"
   * @param context - The `ValidationContext`
   * @returns Whether the given URI is a valid template URI
   */
  static validateTemplateUri(
    path: string,
    name: string,
    uri: string,
    subdivisionScheme: string,
    context: ValidationContext
  ): boolean {
    // The uri MUST be a string
    if (!BasicValidator.validateString(path, name, uri, context)) {
      return false;
    }

    let result = true;

    // Obtain all {expressions} from the URI
    const expressionRegex = /{([^}]*)}/g;
    const expressions = [...uri.matchAll(expressionRegex)];

    // Define the set of valid and expected variable names
    const validVariableNames = ["level", "x", "y"];
    if (subdivisionScheme === "OCTREE") {
      validVariableNames.push("z");
    }
    let expectedVariableNames = [...validVariableNames];
    for (let i = 0; i < expressions.length; i++) {
      const variableName = expressions[i][1];

      // Each variable name MUST be one of the valid ones
      if (!validVariableNames.includes(variableName)) {
        const issue =
          SemanticValidationIssues.TEMPLATE_URI_INVALID_VARIABLE_NAME(
            path,
            variableName,
            validVariableNames
          );
        context.addIssue(issue);
        result = false;
      } else {
        // If the variable name was used, remove it from
        // the set of expected ones
        expectedVariableNames = expectedVariableNames.filter(
          (e) => e !== variableName
        );
      }
    }

    // If one of the valid variable names was not used,
    // create a warning
    if (expectedVariableNames.length > 0) {
      const issue = SemanticValidationIssues.TEMPLATE_URI_MISSING_VARIABLE_NAME(
        path,
        expectedVariableNames
      );
      context.addIssue(issue);
    }
    return result;
  }
}
