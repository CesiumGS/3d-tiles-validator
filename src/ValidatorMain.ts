import { createFilesIterable } from "./base/createFilesIterable";

import { ValidationState } from "./validation/ValidationState";
import { Validators } from "./validation/Validators";

import { TileImplicitTiling } from "./structure/TileImplicitTiling";
import { readJsonUnchecked } from "./base/readJsonUnchecked";
import { Schema } from "./structure/Metadata/Schema";

/**
 * A class summarizing the command-line functions of the validator.
 *
 * The functions in this class are supposed to be called from `main.ts`,
 * based on the parsed command line arguments.
 *
 * @private
 */
export class ValidatorMain {
  static readonly specsDataRootDir = "specs/data/";

  static async validateTilesetFile(fileName: string): Promise<void> {
    console.log("Validating tileset " + fileName);
    const validationResult = await Validators.validateTilesetFile(fileName);
    console.log("Validation result:");
    console.log(validationResult.serialize());
  }

  static async validateSchemaFile(fileName: string): Promise<void> {
    console.log("Validating schema " + fileName);
    const validationResult = await Validators.validateSchemaFile(fileName);
    console.log("Validation result:");
    console.log(validationResult.serialize());
  }

  static async validateSubtreeFile(
    fileName: string,
    validationState: ValidationState,
    implicitTiling: TileImplicitTiling | undefined
  ): Promise<void> {
    console.log("Validating subtree " + fileName);
    const validationResult = await Validators.validateSubtreeFile(
      fileName,
      validationState,
      implicitTiling
    );
    console.log("Validation result:");
    console.log(validationResult.serialize());
  }

  static async validateAllTilesetSpecFiles(): Promise<void> {
    const recurse = true;
    const specFiles = createFilesIterable(
      ValidatorMain.specsDataRootDir,
      recurse
    );
    for (const specFile of specFiles) {
      if (!specFile.toLowerCase().endsWith(".json")) {
        continue;
      }
      // TODO The only way to differentiate tileset files and subtree
      // JSON files for now is to replace backslashes with slashes
      // and see whether the path contains `/subtrees/` - ouch...
      const normalizedFileName = specFile.toLowerCase().replace(/\\/g, "/");
      if (normalizedFileName.includes("/subtrees/")) {
        continue;
      }
      // TODO We could also just look for "tileset*.json" at that point...
      if (normalizedFileName.endsWith("style.json")) {
        continue;
      }
      await ValidatorMain.validateTilesetFile(specFile);
    }
  }

  static async validateAllMetadataSchemaSpecFiles(): Promise<void> {
    const recurse = false;
    const specFiles = createFilesIterable(
      ValidatorMain.specsDataRootDir + "schemas",
      recurse
    );
    for (const specFile of specFiles) {
      if (!specFile.toLowerCase().endsWith(".json")) {
        continue;
      }
      await ValidatorMain.validateSchemaFile(specFile);
    }
  }

  static async validateAllSubtreeSpecFiles(): Promise<void> {
    const recurse = false;
    const specFiles = createFilesIterable(
      ValidatorMain.specsDataRootDir + "subtrees",
      recurse
    );
    for (const specFile of specFiles) {
      if (
        !specFile.toLowerCase().endsWith(".json") &&
        !specFile.toLowerCase().endsWith(".subtree")
      ) {
        continue;
      }
      await ValidatorMain.validateSubtreeSpecFile(specFile);
    }
  }

  static async validateSubtreeSpecFile(fileName: string): Promise<void> {
    let implicitTiling = undefined;
    let validationState: ValidationState = {
      hasSchemaDefinition: false,
      hasGroupsDefinition: false,
    };

    // The `TileImplicitTiling` object that defines the
    // structure of subtrees in the specs directory
    const specImplicitTiling = await readJsonUnchecked(
      "specs/data/subtrees/validSubtreeImplicitTiling.json.input"
    );
    implicitTiling = specImplicitTiling;

    // The `ValidationState` object that contains the
    // schema for the subtrees in the specs directory
    const specSchema: Schema = await readJsonUnchecked(
      "specs/data/schemas/validSchema.json"
    );
    const specValidationState: ValidationState = {
      hasSchemaDefinition: true,
      validatedSchema: specSchema,
      hasGroupsDefinition: false,
      validatedGroups: undefined,
    };
    validationState = specValidationState;

    await ValidatorMain.validateSubtreeFile(
      fileName,
      validationState,
      implicitTiling
    );
  }
}
