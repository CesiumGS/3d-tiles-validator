import { ValidationIssue } from "../../../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../../../validation/ValidationIssueSeverity";

/**
 * Methods to create `ValidationIssue` instances that describe
 * issues that are specific for the `NGA_gpm` (3D Tiles)
 * or `NGA_gpm_local` (glTF) extensions.
 */
export class NgaGpmValidationIssues {
  /**
   * Indicates that the length of an array was not consistent with the
   * constraints that are implied by the specification.
   *
   * In contrast to the `ARRAY_LENGTH_MISMATCH` issue, this one
   * specifically refers to a constraint that is not modeled by
   * the `minItems/maxItems` properties in the JSON schema, but
   * by the meaning of a certain array in a certain context.
   * For example, a covariance matrix that must have a specific
   * size depending on the value of another property. Details
   * are supposed to be given in the `message`.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static ARRAY_LENGTH_INCONSISTENT(path: string, message: string) {
    const type = "ARRAY_LENGTH_INCONSISTENT";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
}
