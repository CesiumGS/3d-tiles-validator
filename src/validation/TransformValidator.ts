import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

import { Cartesian4 } from "cesium";
import { Math } from "cesium";
import { Matrix4 } from "cesium";

/**
 * A class for validations related to `tile.transform` objects.
 *
 * @internal
 */
export class TransformValidator {
  private static readonly scratchMatrix4 = new Matrix4();

  /**
   * Performs the validation to ensure that the given object is a
   * valid `transform` object.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param transform - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
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

    // Check whether the matrix is affine, which means that the
    // last row must be epsilon-equal to (0,0,0,1)
    const row3 = new Cartesian4();
    Matrix4.getRow(matrix, 3, row3);
    const isAffine = row3.equalsEpsilon(Cartesian4.UNIT_W, Math.EPSILON8);
    if (!isAffine) {
      const message = `The transform is not affine: [${transform}]`;
      const issue = SemanticValidationIssues.TRANSFORM_INVALID(path, message);
      context.addIssue(issue);
      return false;
    }

    return true;
  }
}
