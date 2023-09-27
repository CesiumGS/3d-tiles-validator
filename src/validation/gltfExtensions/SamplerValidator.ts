import { ValidationContext } from "../ValidationContext";

import { JsonValidationIssues } from "../../issues/JsonValidationIssues";

/**
 * Methods for validating glTF `sampler` objects
 */
export class SamplerValidator {
  /**
   * Make sure that the given sampler has `minFilter` and `maxFilter`
   * properties that are either `undefined` or `NEAREST`.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param sampler - The sampler object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateSamplerNearest(
    path: string,
    sampler: any,
    context: ValidationContext
  ) {
    const NEAREST = 9728;
    const allowedValues = [undefined, NEAREST];
    const allowedValuesString = "[undefined, 9728 (NEAREST)]";
    return SamplerValidator.validateSampler(
      path,
      sampler,
      allowedValues,
      allowedValuesString,
      context
    );
  }
  /**
   * Make sure that the given sampler has `minFilter` and `maxFilter`
   * properties that are either `undefined`, `NEAREST`, or `LINEAR`.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param sampler - The sampler object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateSamplerNearestOrLinear(
    path: string,
    sampler: any,
    context: ValidationContext
  ) {
    const NEAREST = 9728;
    const LINEAR = 9729;
    const allowedValues = [undefined, NEAREST, LINEAR];
    const allowedValuesString = "[undefined, 9728 (NEAREST), 9729 (LINEAR)]";
    return SamplerValidator.validateSampler(
      path,
      sampler,
      allowedValues,
      allowedValuesString,
      context
    );
  }

  /**
   * Make sure that the given sampler has `minFilter` and `maxFilter`
   * properties that are one of the given allowed values, creating
   * a validation error in the given context if this is not the
   * case.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param sampler - The sampler object
   * @param allowedValues - The allowed values
   * @param allowedValuesString - A string that will describe the allowed
   * values in the validation issues
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateSampler(
    path: string,
    sampler: any,
    allowedValues: any[],
    allowedValuesString: string,
    context: ValidationContext
  ) {
    let result = true;
    if (!allowedValues.includes(sampler.minFilter)) {
      const message =
        `The feature ID texture refers to a sampler with 'minFilter' ` +
        `mode ${sampler.minFilter}, but the filter mode must ` +
        `be one of ${allowedValuesString}`;

      const issue = JsonValidationIssues.VALUE_NOT_IN_LIST(path, message);
      context.addIssue(issue);
      result = false;
    }
    if (!allowedValues.includes(sampler.magFilter)) {
      const message =
        `The feature ID texture refers to a sampler with 'magFilter' ` +
        `mode ${sampler.minFilter}, but the filter mode must ` +
        `be one of ${allowedValuesString}`;
      const issue = JsonValidationIssues.VALUE_NOT_IN_LIST(path, message);
      context.addIssue(issue);
      result = false;
    }
    return result;
  }
}
