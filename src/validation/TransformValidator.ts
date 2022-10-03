import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

import { Matrix4 } from "cesium";

/**
 * A class for validations related to `tile.transform` objects.
 *
 * @private
 */
export class TransformValidator {
  private static readonly scratchMatrix4 = new Matrix4();

  /**
   * Performs the validation to ensure that the given object is a
   * valid `transform` object.
   *
   * @param path The path for `ValidationIssue` instances
   * @param transform The object to validate
   * @param context The `ValidationContext` that any issues will be added to
   */
  static validateTransform(
    path: string,
    transform: number[],
    context: ValidationContext
  ): boolean {
    // The transform MUST be an array of 16 numbers
    if (
      !BasicValidator.validateArray(
        path,
        "transform",
        transform,
        16,
        16,
        "number",
        context
      )
    ) {
      return false;
    }
    const matrix = Matrix4.fromArray(transform);

    // At least check that the matrix is invertible here:
    try {
      Matrix4.inverse(matrix, TransformValidator.scratchMatrix4);
    } catch (error) {
      const message = `The transform is non-invertible: [${transform}]`;
      const issue = SemanticValidationIssues.TRANSFORM_INVALID(path, message);
      context.addIssue(issue);
      return false;
    }
    return true;
  }
}
