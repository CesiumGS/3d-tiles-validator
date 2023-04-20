import path from "path";
import fs from "fs";

import { defined } from "3d-tiles-tools";
import { Buffers } from "3d-tiles-tools";

import { ResourceResolvers } from "3d-tiles-tools";

import { Validator } from "./Validator";
import { TilesetValidator } from "./TilesetValidator";
import { ValidationContext } from "./ValidationContext";
import { ValidationResult } from "./ValidationResult";
import { SubtreeValidator } from "./SubtreeValidator";
import { ValidationState } from "./ValidationState";
import { ValidationOptions } from "./ValidationOptions";
import { ExtendedObjectsValidators } from "./ExtendedObjectsValidators";
import { TilesetPackageValidator } from "./TilesetPackageValidator";

import { SchemaValidator } from "./metadata/SchemaValidator";

import { TileImplicitTiling } from "3d-tiles-tools";

import { IoValidationIssues } from "../issues/IoValidationIssue";
import { ContentValidationIssues } from "../issues/ContentValidationIssues";

import { BoundingVolumeS2Validator } from "./extensions/BoundingVolumeS2Validator";

/**
 * Utility methods related to `Validator` instances.
 *
 * @beta
 */
export class Validators {
  /**
   * Whether the knows extension validators have already been registered
   * by calling `registerExtensionValidators`.
   *
   * Note: This could be solved with a static initializer block, but the
   * unclear initialization order of the classes would make this brittle
   */
  private static _registeredExtensionValidators = false;

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
   * Performs a default validation of the given tileset file, and
   * returns a promise to the `ValidationResult`.
   *
   * The given file may be a `tileset.json` file, or a tileset
   * package file, as incdicated by a `.3tz` or `.3dtiles` file
   * extensions.
   *
   * @param filePath - The file path
   * @param validationOptions - The `ValidationOptions`. When this
   * is not given (or `undefined`), then default validation options
   * will be used. See {@link ValidationOptions}.
   * @returns A promise to a `ValidationResult` that is fulfilled when
   * the validation finished.
   * @beta
   */
  static async validateTilesetFile(
    filePath: string,
    validationOptions?: ValidationOptions
  ): Promise<ValidationResult> {
    const extension = path.extname(filePath).toLowerCase();
    const isDirectory = fs.statSync(filePath).isDirectory();
    const packageExtensions = [".3tz", ".3dtiles"];
    const isPackage = packageExtensions.includes(extension);
    if (isPackage || isDirectory) {
      const validationResult = await Validators.validateTilesetPackageInternal(
        filePath,
        validationOptions
      );
      return validationResult;
    }
    const validationResult = await Validators.validateTilesetFileInternal(
      filePath,
      validationOptions
    );
    return validationResult;
  }

  /**
   * Performs a default validation of the given `tileset.json` file, and
   * returns a promise to the `ValidationResult`.
   *
   * @param filePath - The file path
   * @param validationOptions - The `ValidationOptions`. When this
   * is not given (or `undefined`), then default validation options
   * will be used. See {@link ValidationOptions}.
   * @returns A promise to a `ValidationResult` that is fulfilled when
   * the validation finished.
   * @beta
   */
  private static async validateTilesetFileInternal(
    filePath: string,
    validationOptions?: ValidationOptions
  ): Promise<ValidationResult> {
    Validators.registerExtensionValidators();

    const directory = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);
    const validator = Validators.createDefaultTilesetValidator();
    const context = new ValidationContext(
      directory,
      resourceResolver,
      validationOptions
    );
    const tilesetUri = context.resolveUri(fileName);
    context.addActiveTilesetUri(tilesetUri);
    const resourceData = await resourceResolver.resolveData(fileName);
    if (!defined(resourceData)) {
      const message = `Could not read input file: ${filePath}`;
      const issue = IoValidationIssues.IO_ERROR(filePath, message);
      context.addIssue(issue);
    } else {
      const bom = Buffers.getUnicodeBOMDescription(resourceData);
      if (defined(bom)) {
        const message = `Unexpected BOM in JSON buffer: ${bom}`;
        const issue = IoValidationIssues.IO_ERROR(filePath, message);
        context.addIssue(issue);
      } else {
        const jsonString = resourceData.toString();
        await validator.validateJsonString(jsonString, context);
      }
    }
    context.removeActiveTilesetUri(tilesetUri);
    return context.getResult();
  }

  /**
   * Performs a default validation of the given tileset package file, and
   * returns a promise to the `ValidationResult`.
   *
   * The given path may be a path of a `.3tz` or a `.3dtiles` file (or
   * a directory that contains a 'tileset.json' file)
   *
   * @param filePath - The file path
   * @param validationOptions - The `ValidationOptions`. When this
   * is not given (or `undefined`), then default validation options
   * will be used. See {@link ValidationOptions}.
   * @returns A promise to a `ValidationResult` that is fulfilled when
   * the validation finished.
   * @beta
   */
  private static async validateTilesetPackageInternal(
    filePath: string,
    validationOptions?: ValidationOptions
  ): Promise<ValidationResult> {
    Validators.registerExtensionValidators();

    const directory = path.dirname(filePath);
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);
    const context = new ValidationContext(
      directory,
      resourceResolver,
      validationOptions
    );
    const tilesetUri = context.resolveUri(filePath);
    context.addActiveTilesetUri(tilesetUri);
    await TilesetPackageValidator.validatePackageFile(filePath, context);
    context.removeActiveTilesetUri(tilesetUri);
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
    const context = new ValidationContext(directory, resourceResolver);
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
    const context = new ValidationContext(directory, resourceResolver);
    if (!defined(resourceData)) {
      const message = `Could not read subtree file ${filePath}`;
      const issue = IoValidationIssues.IO_ERROR(filePath, message);
      context.addIssue(issue);
    } else {
      await validator.validateObject(filePath, resourceData, context);
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
          const bom = Buffers.getUnicodeBOMDescription(input);
          if (defined(bom)) {
            const message = `Unexpected BOM in JSON buffer: ${bom}`;
            const issue = IoValidationIssues.IO_ERROR(inputPath, message);
            context.addIssue(issue);
            return false;
          }
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

  /**
   * Register the validators for known extensions
   */
  private static registerExtensionValidators() {
    if (Validators._registeredExtensionValidators) {
      return;
    }

    // Register the validator for 3DTILES_bounding_volume_S2
    {
      const s2Validator = new BoundingVolumeS2Validator();
      const override = true;
      ExtendedObjectsValidators.register(
        "3DTILES_bounding_volume_S2",
        s2Validator,
        override
      );
    }
    // Register an empty validator for 3DTILES_content_gltf
    // (The extension does not have any properties to be
    // validated)
    {
      const emptyValidator = Validators.createEmptyValidator();
      const override = false;
      ExtendedObjectsValidators.register(
        "3DTILES_content_gltf",
        emptyValidator,
        override
      );
    }

    Validators._registeredExtensionValidators = true;
  }
}
