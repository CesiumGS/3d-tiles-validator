import { ValidationContext } from "./ValidationContext";

/**
 * Interface for classes that can perform generic validation of an object,
 * detect issues, and add them to a `ValidationContext`
 */
export interface Validator<T> {
  /**
   * Performs the validation of the given object, and adds all issues
   * that are detected to the given `ValidationContext`.
   *
   * @param input The input object
   * @param context The `ValidationContext`
   * @returns A promise that is fulfilled when the validation is finished
   */
  validateObject(input: T, context: ValidationContext): Promise<void>;
}
