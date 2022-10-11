import { defined } from "../../base/defined";

import { Validator } from "../Validator";
import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { RootPropertyValidator } from "../RootPropertyValidator";

import { SemanticValidationIssues } from "../../issues/SemanticValidationIssues";
import { BoundingVolumeS2ValidationIssues } from "./BoundingVolumeS2ValidationIssues";

/**
 * A class for the validation of `3DTILES_bounding_volume_S2` extension objects
 *
 * @private
 */
export class BoundingVolumeS2Validator implements Validator<any> {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `3DTILES_bounding_volume_S2` object.
   *
   * @param path The path for `ValidationIssue` instances
   * @param object The object to validate
   * @param context The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  async validateObject(
    path: string,
    object: any,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "object", object, context)) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        path,
        "object",
        object,
        context
      )
    ) {
      result = false;
    }

    // Validate the token
    const token = object.token;
    const tokenPath = path + "/token";
    // The token MUST be defined
    // The token MUST be a string
    if (!BasicValidator.validateString(tokenPath, "token", token, context)) {
      result = false;
    } else {
      // The token MUST be a valid S2 token
      if (!BoundingVolumeS2Validator.isValidToken(token)) {
        const message = `The S2 token '${token}' is not valid`;
        const issue = BoundingVolumeS2ValidationIssues.S2_TOKEN_INVALID(
          tokenPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate the minimumHeight
    const minimumHeight = object.minimumHeight;
    const minimumHeightPath = path + "/minimumHeight";
    // The minimumHeight MUST be a number
    if (
      !BasicValidator.validateNumber(
        minimumHeightPath,
        "minimumHeight",
        minimumHeight,
        context
      )
    ) {
      result = false;
    }

    // Validate the maximumHeight
    const maximumHeight = object.maximumHeight;
    const maximumHeightPath = path + "/maximumHeight";
    // The maximumHeight MUST be a number
    if (
      !BasicValidator.validateNumber(
        maximumHeightPath,
        "maximumHeight",
        maximumHeight,
        context
      )
    ) {
      result = false;
    }

    // The minimumHeight MUST NOT be larger
    // than the maximumHeight
    if (defined(minimumHeight) && defined(maximumHeight)) {
      if (minimumHeight > maximumHeight) {
        const message =
          `The minimumHeight may not be larger than the ` +
          `maximumHeight, but the minimumHeight is ${minimumHeight} ` +
          `and the maximum height is ${maximumHeight}`;
        const issue = SemanticValidationIssues.BOUNDING_VOLUME_INCONSISTENT(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    return result;
  }

  private static isValidToken(token: string): boolean {
    // According to cesium/Source/Core/S2Cell.js
    if (!/^[0-9a-fA-F]{1,16}$/.test(token)) {
      return false;
    }
    // Further constraints could be added here (e.g. that
    // the first digit is only a value in [0,5] ...)
    return true;
  }
}
