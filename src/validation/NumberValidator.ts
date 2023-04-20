import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";

import { ValidationIssues } from "../issues/ValidationIssues";
import { JsonValidationIssues } from "../issues/JsonValidationIssues";

/**
 * A class for validations related to numbers. Specifically,
 * for checks whether numbers are in the range that is
 * determined by a (metadata) component type.
 *
 * @internal
 */
export class NumberValidator {
  /**
   * Validates that each element of the given array in is in the range
   * that is determined by the given component type.
   *
   * This assumes that the given `componentType` has already been
   * determined to be a valid one, i.e. is contained in the set of
   * `MetadataComponentTypes#allComponentTypes`.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param values - The values
   * @param componentType - The component type
   * @param context - The `ValidationContext`
   * @returns Whether the value was in the required range
   */
  static validateRanges(
    path: string,
    values: number[] | bigint[],
    componentType: string,
    context: ValidationContext
  ) {
    let result = true;
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const valuePath = path + "/" + i;
      if (
        !NumberValidator.validateRange(
          valuePath,
          "array element",
          value,
          componentType,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validates that the given value is in the range that is determined
   * by the given component type.
   *
   * This assumes that the given `componentType` has already been
   * determined to be a valid one, i.e. is contained in the set of
   * `MetadataComponentTypes#allComponentTypes`.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param name - The name of the value
   * @param value - The value
   * @param componentType - The component type
   * @param context - The `ValidationContext`
   * @returns Whether the value was in the required range
   */
  static validateRange(
    path: string,
    name: string,
    value: number | bigint,
    componentType: string,
    context: ValidationContext
  ): boolean {
    const min = NumberValidator.minimumValue(componentType);
    const max = NumberValidator.maximumValue(componentType);
    if (!defined(min) || !defined(max)) {
      const message = `Unexpected invalid component type: ${componentType}`;
      const issue = ValidationIssues.INTERNAL_ERROR(path, message);
      context.addIssue(issue);
      return false;
    }
    if (value < min || value > max) {
      const message =
        `The ${name} has type ${componentType} and must be ` +
        `in [${min},${max}], but is ${value}`;
      const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(path, message);
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  // Partially adapted from CesiumJS
  private static maximumValue(
    componentType: string | undefined
  ): number | bigint | undefined {
    switch (componentType) {
      case "INT8":
        return 127;
      case "UINT8":
        return 255;
      case "INT16":
        return 32767;
      case "UINT16":
        return 65535;
      case "INT32":
        return 2147483647;
      case "UINT32":
        return 4294967295;
      case "INT64":
        return BigInt("9223372036854775807");
      case "UINT64":
        return BigInt("18446744073709551615");
      case "FLOAT32":
        return 340282346638528859811704183484516925440.0;
      case "FLOAT64":
        return Number.MAX_VALUE;
    }
    return undefined;
  }

  private static minimumValue(
    componentType: string | undefined
  ): number | bigint | undefined {
    switch (componentType) {
      case "INT8":
        return -128;
      case "UINT8":
        return 0;
      case "INT16":
        return -32768;
      case "UINT16":
        return 0;
      case "INT32":
        return -2147483648;
      case "UINT32":
        return 0;
      case "INT64":
        return BigInt("-9223372036854775808");
      case "UINT64":
        return BigInt(0);
      case "FLOAT32":
        return -340282346638528859811704183484516925440.0;
      case "FLOAT64":
        return -Number.MAX_VALUE;
    }
    return undefined;
  }
}
