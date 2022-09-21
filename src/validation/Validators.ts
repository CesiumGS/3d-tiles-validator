import path from "path";
import { defined } from "../base/defined";

import { FileResourceResolver } from "../io/FileResourceResolver";

import { TilesetValidator } from "./TilesetValidator";
import { ValidationContext } from "./ValidationContext";
import { ValidationResult } from "./ValidationResult";
import { SchemaValidator } from "./SchemaValidator";
import { SubtreeValidator } from "./SubtreeValidator";
import { ValidationState } from "./ValidationState";

import { JsonSchemaValidators } from "../json/JsonSchemaValidators";

import { IoValidationIssues } from "../issues/IoValidationIssue";

import { TileImplicitTiling } from "../structure/TileImplicitTiling";

/**
 * Utility methods related to `Validator` instances.
 */
export class Validators {
  // TODO Preliminary: The root directory of the 3D Tiles schema,
  // for the generic, AJV-based JSON schema validation
  private static _schemaRootDir: string;

  // TODO Preliminary: Set the root directory of the 3D Tiles schema,
  // for the generic, AJV-based JSON schema validation
  static setSchemaRootDir(schemaRootDir: string) {
    Validators._schemaRootDir = schemaRootDir;
  }

  /**
   * Creates a `TilesetValidator` with an unspecified default configuration.
   *
   * @returns The `TilesetValidator`
   */
  static createDefaultTilesetValidator(): TilesetValidator {
    let jsonSchemaValidator = undefined;
    if (defined(Validators._schemaRootDir)) {
      jsonSchemaValidator = JsonSchemaValidators.create3DTiles(
        Validators._schemaRootDir,
        "tileset"
      );
    }
    const validator = new TilesetValidator(jsonSchemaValidator);
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
    const resourceResolver = new FileResourceResolver(directory);
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
    let jsonSchemaValidator = undefined;
    if (defined(Validators._schemaRootDir)) {
      jsonSchemaValidator = JsonSchemaValidators.create3DTiles(
        Validators._schemaRootDir,
        "Schema/schema"
      );
    }
    const validator = new SchemaValidator(jsonSchemaValidator);
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
    const resourceResolver = new FileResourceResolver(directory);
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
    let jsonSchemaValidator = undefined;
    if (defined(Validators._schemaRootDir)) {
      jsonSchemaValidator = JsonSchemaValidators.create3DTiles(
        Validators._schemaRootDir,
        "Subtree/subtree"
      );
    }
    const directory = path.dirname(uri);
    const resourceResolver = new FileResourceResolver(directory);
    const validator = new SubtreeValidator(
      jsonSchemaValidator,
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
    const resourceResolver = new FileResourceResolver(directory);
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
