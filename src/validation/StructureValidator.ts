import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { StructureValidationIssues } from "../issues/StructureValidationIssues";

/**
 * A class for the validation of JSON structures.
 *
 * This checks for the presence of properties that are required
 * and the absence of properties that are disallowed, based on
 * the absence or presence of other properties or their values.
 *
 * @internal
 */
export class StructureValidator {
  /**
   * Validate that the given value does not have any of the
   * given disallowed properties.
   *
   * If the given value is an object that contains any of the disallowed
   * properties, then a `DISALLOWED_VALUE_FOUND` issue is added to the
   * given validation context (for each of them), and `false` is
   * returned.
   *
   * Otherwise, `true` is returned.
   *
   * @param path - The path for the `ValidationIssue` message
   * @param name - The name for the `ValidationIssue` message
   * @param value - The object that may contain the properties
   * @param disallowedProperties - The array of names of properties
   * that may not be defined
   * @param context - The `ValidationContext` to add the issue to
   * @returns Whether the given value is one of the allowed values
   */
  static validateDisallowedProperties(
    path: string,
    name: string,
    value: any,
    disallowedProperties: string[],
    context: ValidationContext
  ) {
    let result = true;
    for (const propertyName of disallowedProperties) {
      const propertyValue = value[propertyName];
      if (defined(propertyValue)) {
        const message = `The ${name} may not define the ${propertyName}`;
        const issue = StructureValidationIssues.DISALLOWED_VALUE_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }
    return result;
  }
}
