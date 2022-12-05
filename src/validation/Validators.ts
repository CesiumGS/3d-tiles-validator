import path from "path";
import { defined } from "../base/defined";
import { defaultValue } from "../base/defaultValue";

import { ResourceResolvers } from "../io/ResourceResolvers";

import { Validator } from "./Validator";
import { TilesetValidator } from "./TilesetValidator";
import { ValidationContext } from "./ValidationContext";
import { ValidationResult } from "./ValidationResult";
import { SubtreeValidator } from "./SubtreeValidator";
import { ValidationState } from "./ValidationState";
import { ValidationOptions } from "./ValidationOptions";

import { SchemaValidator } from "./metadata/SchemaValidator";

import { TileImplicitTiling } from "../structure/TileImplicitTiling";

import { IoValidationIssues } from "../issues/IoValidationIssue";
import { ContentValidationIssues } from "../issues/ContentValidationIssues";

/**
 * Utility methods related to `Validator` instances.
 *
 * @beta
 */
export class Validators {
  /**
   * Creates a `TilesetValidator` with an unspecified default configuration.
   *
   * @returns The `TilesetValidator`
   * @internal
   */
  static createDefaultTilesetValidator(): TilesetValidator {
    const validator = new TilesetValidator();
    return validator;
  }

  /**
   * Performs a default validation of the given `tileset.json` file, and
   * returns a promise to the `ValidationResult`.
   *
   * @param filePath - The file path
   * @returns A promise to a `ValidationResult` that is fulfilled when
   * the validation finished.
   * @beta
   */
  static async validateTilesetFile(
    filePath: string,
    validationOptions?: ValidationOptions
  ): Promise<ValidationResult> {
    const directory = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);
    const resourceData = await resourceResolver.resolveData(fileName);
    const validator = Validators.createDefaultTilesetValidator();
    const context = new ValidationContext(resourceResolver, validationOptions);
    const jsonString = resourceData ? resourceData.toString() : "";
    await validator.validateJsonString(jsonString, context);
    return context.getResult();
  }

  /**
   * Creates a `SchemaValidator` with an unspecified default configuration.
   *
   * @returns The `SchemaValidator`
   * @internal
   */
  static createDefaultSchemaValidator(): SchemaValidator {
    const validator = new SchemaValidator();
    return validator;
  }

  /**
   * Performs a default validation of the given schema JSON file, and
   * returns a promise to the `ValidationResult`.
   *
   * @param filePath - The file path
   * @returns A promise to a `ValidationResult` that is fulfilled when
   * the validation finished.
   * @internal
   */
  static async validateSchemaFile(filePath: string): Promise<ValidationResult> {
    const directory = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);
    const resourceData = await resourceResolver.resolveData(fileName);
    const validator = Validators.createDefaultSchemaValidator();
    const context = new ValidationContext(resourceResolver);
    const jsonString = resourceData ? resourceData.toString() : "";
    await validator.validateJsonString(jsonString, context);
    return context.getResult();
  }

  /**
   * Creates a `SubtreeValidator` with an unspecified default configuration.
   *
   * @returns The `SubtreeValidator`
   * @internal
   */
  static createDefaultSubtreeValidator(
    uri: string,
    validationState: ValidationState,
    implicitTiling: TileImplicitTiling | undefined
  ): SubtreeValidator {
    const directory = path.dirname(uri);
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);
    const validator = new SubtreeValidator(
      validationState,
      implicitTiling,
      resourceResolver
    );
    return validator;
  }

  /**
   * Performs a default validation of the given subtree JSON file, and
   * returns a promise to the `ValidationResult`.
   *
   * @param filePath - The file path
   * @returns A promise to a `ValidationResult` that is fulfilled when
   * the validation finished.
   * @internal
   */
  static async validateSubtreeFile(
    filePath: string,
    validationState: ValidationState,
    implicitTiling: TileImplicitTiling | undefined
  ): Promise<ValidationResult> {
    const directory = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);
    const resourceData = await resourceResolver.resolveData(fileName);
    const validator = Validators.createDefaultSubtreeValidator(
      filePath,
      validationState,
      implicitTiling
    );
    const context = new ValidationContext(resourceResolver);
    if (!defined(resourceData)) {
      const message = `Could not read subtree file ${filePath}`;
      const issue = IoValidationIssues.IO_ERROR(filePath, message);
      context.addIssue(issue);
    } else {
      await validator.validateObject(filePath, resourceData!, context);
    }
    return context.getResult();
  }

  /**
   * Creates a validator for `Buffer` objects that parses an
   * object of type `T` from the (JSON) string representation
   * of the buffer contents, and applies the given delegate
   * to the result.
   *
   * If the object cannot be parsed, a `JSON_PARSE_ERROR`
   * will be added to the given context.
   *
   * @param delegate - The delegate
   * @returns The new validator
   * @internal
   */
  static parseFromBuffer<T>(delegate: Validator<T>): Validator<Buffer> {
    return {
      async validateObject(
        inputPath: string,
        input: Buffer,
        context: ValidationContext
      ): Promise<boolean> {
        try {
          const object: T = JSON.parse(input.toString());
          const delegateResult = await delegate.validateObject(
            inputPath,
            object,
            context
          );
          return delegateResult;
        } catch (error) {
          const message = `${error}`;
          const issue = IoValidationIssues.JSON_PARSE_ERROR(inputPath, message);
          context.addIssue(issue);
          return false;
        }
      },
    };
  }

  /**
   * Creates a `Validator` that only adds a `CONTENT_VALIDATION_WARNING`
   * with the given message to the given context when it is called.
   *
   * This is used for "dummy" validators that handle content data types
   * that are already anticipated (like VCTR or GEOM), but not validated
   * explicitly.
   *
   * @param message - The message for the warning
   * @returns The new validator
   * @internal
   */
  static createContentValidationWarning(message: string): Validator<Buffer> {
    return {
      async validateObject(
        inputPath: string,
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        input: Buffer,
        context: ValidationContext
      ): Promise<boolean> {
        const issue = ContentValidationIssues.CONTENT_VALIDATION_WARNING(
          inputPath,
          message
        );
        context.addIssue(issue);
        return true;
      },
    };
  }

  /**
   * Creates an empty validator that does nothing.
   *
   * This is used for "dummy" validators for content types that
   * are ignored.
   *
   * @returns The new validator
   * @internal
   */
  static createEmptyValidator<T>(): Validator<T> {
    return {
      async validateObject(
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        inputPath: string,
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        input: T,
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        context: ValidationContext
      ): Promise<boolean> {
        return true;
      },
    };
  }
}
