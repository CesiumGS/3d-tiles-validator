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

  /**
   * Indicates that the length (magnitude) of a 3D vector that is
   * supposed to be a `unitVector` deviated by more than a certain
   * epsilon from 1.0.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static VECTOR_NOT_UNIT_LENGTH(path: string, message: string) {
    const type = "VECTOR_NOT_UNIT_LENGTH";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that two vectors that are supposed to be part of an
   * orthonormal basis (as part of `lsrAxisUnitVectors`) are not
   * orthogonal.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static VECTORS_NOT_ORTHOGONAL(path: string, message: string) {
    const type = "VECTORS_NOT_ORTHOGONAL";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the `source` values of a set of PPE metadata
   * objects have not been unique.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static PER_POINT_ERROR_SOURCE_VALUES_NOT_UNIQUE(path: string, message: string) {
    const type = "PER_POINT_ERROR_SOURCE_VALUES_NOT_UNIQUE";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

}
