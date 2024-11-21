import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { BasicValidator } from "../../BasicValidator";

/**
 * A class for validating the elements that can either appear in the
 * `NGA_gpm` (3D Tiles) extension, or in the `NGA_gpm_local` (glTF)
 * extension.
 *
 * @internal
 */
export class NgaGpmValidatorCommon {
  /**
   * Validate the given array of "correlationGroup" objects that
   * have been found as the interTileCorrelationGroups or
   * the intraTileCorrelationGroups
   *
   * @param path - The path for validation issues
   * @param name - The name of the property ("intraTileCorrelationGroups"
   * or "intraTileCorrelationGroups")
   * @param correlationGroups - The array of objects
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateCorrelationGroups(
    path: string,
    name: string,
    correlationGroups: any,
    context: ValidationContext
  ): boolean {
    // The correlationGroups MUST be an array of at most 3 objects
    if (
      !BasicValidator.validateArray(
        path,
        name,
        correlationGroups,
        0,
        3,
        "object",
        context
      )
    ) {
      return false;
    }
    let result = true;

    // Validate each correlationGroup
    for (let i = 0; i < correlationGroups.length; i++) {
      const correlationGroup = correlationGroups[i];
      const correlationGroupPath = path + "/" + i;
      if (
        !NgaGpmValidatorCommon.validateCorrelationGroup(
          correlationGroupPath,
          name + `[${i}]`,
          correlationGroup,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the given correlationGroup
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param correlationGroup - The correlationGroup
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateCorrelationGroup(
    path: string,
    name: string,
    correlationGroup: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, correlationGroup, context)) {
      return false;
    }

    let result = true;

    // Validate the groupFlags
    const groupFlags = correlationGroup.groupFlags;
    const groupFlagsPath = path + "/groupFlags";

    // The groupFlags MUST be a 3-element array of booleans
    const groupFlagsValid = BasicValidator.validateArray(
      groupFlagsPath,
      "groupFlags",
      groupFlags,
      3,
      3,
      "boolean",
      context
    );
    if (!groupFlagsValid) {
      result = false;
    }

    // Validate the rotationThetas
    const rotationThetas = correlationGroup.rotationThetas;
    const rotationThetasPath = path + "/rotationThetas";

    // The rotationThetas MUST be a 3-element array of numbers
    const rotationThetasValid = BasicValidator.validateArray(
      rotationThetasPath,
      "rotationThetas",
      rotationThetas,
      3,
      3,
      "number",
      context
    );
    if (!rotationThetasValid) {
      result = false;
    }

    // Validate the params
    const params = correlationGroup.params;
    const paramsPath = path + "/params";
    if (
      !NgaGpmValidatorCommon.validateCorrelationParameters(
        paramsPath,
        "params",
        params,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given array of correlation parameters. This checks whether
   * the given object is an array of 3 SPDCF (Strictly Positive-Definite
   * Correlation Function) objects, using `validateSpdcf`.
   *
   * @param path - The path for validation issues
   * @param name - The name of the property
   * @param correlationParameters - The array of SPDCF objects
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateCorrelationParameters(
    path: string,
    name: string,
    correlationParameters: any,
    context: ValidationContext
  ): boolean {
    // The correlationParameters MUST be a 3-element array of objects
    if (
      !BasicValidator.validateArray(
        path,
        name,
        correlationParameters,
        3,
        3,
        "object",
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate each correlationParameter (an SPDCF)
    for (let i = 0; i < correlationParameters.length; i++) {
      const correlationParameter = correlationParameters[i];
      const correlationParameterPath = path + "/" + i;
      if (
        !NgaGpmValidatorCommon.validateSpdcf(
          correlationParameterPath,
          name + `[${i}]`,
          correlationParameter,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validate the given SPDCF (Strictly Positive-Definite Correlation Function)
   *
   * @param path - The path for validation issues
   * @param name  - The name of the property
   * @param spdcf - The SPDCF
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateSpdcf(
    path: string,
    name: string,
    spdcf: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, spdcf, context)) {
      return false;
    }

    let result = true;

    // Sorry about the names here. I'm trying to be consistent...

    // Validate the A
    const A = spdcf.A;
    const APath = path + "/A";

    // The A MUST be a number in (0, 1]
    const AValid = BasicValidator.validateNumberRange(
      APath,
      "A",
      A,
      0,
      false,
      1,
      true,
      context
    );
    if (!AValid) {
      result = false;
    }

    // Validate the alpha
    const alpha = spdcf.alpha;
    const alphaPath = path + "/alpha";

    // The alpha MUST be a number in [0, 1)
    const alphaValid = BasicValidator.validateNumberRange(
      alphaPath,
      "alpha",
      alpha,
      0,
      true,
      1,
      false,
      context
    );
    if (!alphaValid) {
      result = false;
    }

    // Validate the beta
    const beta = spdcf.beta;
    const betaPath = path + "/beta";

    // The beta MUST be a number in [0, 10]
    const betaValid = BasicValidator.validateNumberRange(
      betaPath,
      "beta",
      beta,
      0,
      true,
      10,
      true,
      context
    );
    if (!betaValid) {
      result = false;
    }

    // Validate the T
    const T = spdcf.T;
    const TPath = path + "/T";

    // The T MUST be a number in (0, +Inf)
    const TValid = BasicValidator.validateNumberRange(
      TPath,
      "T",
      T,
      0,
      false,
      undefined,
      false,
      context
    );
    if (!TValid) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given ppeMetadata object
   *
   * @param path - The path for validation issues
   * @param name - The name of the property
   * @param ppeMetadata - The ppeMetadata object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validatePpeMetadata(
    path: string,
    name: string,
    ppeMetadata: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, ppeMetadata, context)) {
      return false;
    }

    let result = true;

    // Validate the source
    const source = ppeMetadata.source;
    const sourcePath = path + "/source";

    // The source MUST be one of these valid values
    const sourceValues = [
      "SIGX",
      "SIGY",
      "SIGZ",
      "VARX",
      "VARY",
      "VARZ",
      "SIGR",
    ];
    if (
      !BasicValidator.validateEnum(
        sourcePath,
        "source",
        source,
        sourceValues,
        context
      )
    ) {
      result = false;
    }

    // Validate the min
    const min = ppeMetadata.min;
    const minPath = path + "/min";

    // If min is defined, then it MUST be a number
    if (defined(min)) {
      if (!BasicValidator.validateNumber(minPath, "min", min, context)) {
        result = false;
      }
    }

    // Validate the max
    const max = ppeMetadata.max;
    const maxPath = path + "/max";

    // If max is defined, then it MUST be a number
    if (defined(max)) {
      if (!BasicValidator.validateNumber(maxPath, "max", max, context)) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Returns the n-th triangular number, just so that this computation
   * has a name.
   *
   * The https://en.wikipedia.org/wiki/Triangular_number is the number
   * of elements in the "upper-triangular of covariance matrix" for
   * the given number of dimensions, which is the common representation
   * of covariance matrices in the NGA GPM extensions.
   *
   * @param n - The input
   * @returns The n-th triangular number
   */
  static computeTriangularNumber(n: number): number {
    return (n * (n + 1)) / 2;
  }

  /**
   * Returns whether the given number is a triangular number.
   *
   * The https://en.wikipedia.org/wiki/Triangular_number is the number
   * of elements in the "upper-triangular of a covariance matrix",
   * as used in the NGA GPM extensions.
   *
   * @param n - The input
   * @returns Whether the given number is a triangular number
   */
  static isTriangularNumber(n: number): boolean {
    // The n-th triangular number is T(n) = (n*(n+1))/2
    // The inverse function for that is 0.5 * (sqrt(8*n+1) - 1)
    // So n is a triangular number when 8*n+1 is a square
    if (n <= 0) {
      return false;
    }
    const radicand = 8 * n + 1;
    const integralRoot = Math.round(Math.sqrt(radicand));
    return integralRoot * integralRoot === radicand;
  }
}
