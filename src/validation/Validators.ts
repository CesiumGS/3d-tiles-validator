import path from "path";
import { defined } from "../base/defined";

import { ResourceResolvers } from "../io/ResourceResolvers";

import { TilesetValidator } from "./TilesetValidator";
import { ValidationContext } from "./ValidationContext";
import { ValidationResult } from "./ValidationResult";
import { SchemaValidator } from "./SchemaValidator";
import { SubtreeValidator } from "./SubtreeValidator";
import { ValidationState } from "./ValidationState";

import { IoValidationIssues } from "../issues/IoValidationIssue";

import { TileImplicitTiling } from "../structure/TileImplicitTiling";

/**
 * Utility methods related to `Validator` instances.
 */
export class Validators {
  /**
   * Creates a `TilesetValidator` with an unspecified default configuration.
   *
   * @returns The `TilesetValidator`
   */
  static createDefaultTilesetValidator(): TilesetValidator {
    const validator = new TilesetValidator();
    return validator;
  }

  /**
   * Performs a default validation of the given `tileset.json` file, and
   * returns a promise to the `ValidationResult`.
   *
   * @param filePath The file path
   * @returns A promise to a `ValidationResult` that is fulfilled when
   * the validation finished.
   */
  static async validateTilesetFile(
    filePath: string
  ): Promise<ValidationResult> {
    const directory = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);
    const resourceData = await resourceResolver.resolve(fileName);
    const validator = Validators.createDefaultTilesetValidator();
    const context = new ValidationContext(resourceResolver);
    const jsonString = resourceData ? resourceData.toString() : "";
    await validator.validateJsonString(jsonString, context);
    return context.getResult();
  }

  /**
   * Creates a `SchemaValidator` with an unspecified default configuration.
   *
   * @returns The `SchemaValidator`
   */
  static createDefaultSchemaValidator(): SchemaValidator {
    const validator = new SchemaValidator();
    return validator;
  }

  /**
   * Performs a default validation of the given schema JSON file, and
   * returns a promise to the `ValidationResult`.
   *
   * @param filePath The file path
   * @returns A promise to a `ValidationResult` that is fulfilled when
   * the validation finished.
   */
  static async validateSchemaFile(filePath: string): Promise<ValidationResult> {
    const directory = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);
    const resourceData = await resourceResolver.resolve(fileName);
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
      uri,
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
   * @param filePath The file path
   * @returns A promise to a `ValidationResult` that is fulfilled when
   * the validation finished.
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
    const resourceData = await resourceResolver.resolve(fileName);
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
      await validator.validateObject(resourceData!, context);
    }
    return context.getResult();
  }
}
