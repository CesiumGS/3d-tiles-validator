import path from "path";

import { defined } from "./base/defined";
import { createFilesIterable } from "./base/createFilesIterable";
import { readJsonUnchecked } from "./base/readJsonUnchecked";
import { filterIterable } from "./base/filterIterable";
import { globMatcher } from "./base/globMatcher";
import { writeUnchecked } from "./base/writeUnchecked";

import { ValidationState } from "./validation/ValidationState";
import { Validators } from "./validation/Validators";

import { TileImplicitTiling } from "./structure/TileImplicitTiling";
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

  static async validateTilesetFile(
    fileName: string,
    reportFileName: string | undefined
  ): Promise<void> {
    console.log("Validating tileset " + fileName);
    const validationResult = await Validators.validateTilesetFile(fileName);
    if (defined(reportFileName)) {
      await writeUnchecked(reportFileName!, validationResult.serialize());
    } else {
      console.log("Validation result:");
      console.log(validationResult.serialize());
    }
  }

  static async validateTilesetsDirectory(
    directoryName: string,
    globPattern: string,
    writeReports: boolean
  ): Promise<void> {
    console.log(
      "Validating tilesets from " + directoryName + " matching " + globPattern
    );
    const allFiles = createFilesIterable(directoryName);
    const ignoreCase = true;
    const matcher = globMatcher(globPattern, ignoreCase);
    const tilesetFiles = filterIterable(allFiles, matcher);
    for (const tilesetFile of tilesetFiles) {
      let reportFileName = undefined;
      if (writeReports) {
        reportFileName = ValidatorMain.deriveReportFileName(tilesetFile);
      }
      await ValidatorMain.validateTilesetFile(tilesetFile, reportFileName);
    }
  }

  static async validateSchemaFile(
    fileName: string,
    reportFileName: string | undefined
  ): Promise<void> {
    console.log("Validating schema " + fileName);
    const validationResult = await Validators.validateSchemaFile(fileName);
    if (defined(reportFileName)) {
      await writeUnchecked(reportFileName!, validationResult.serialize());
    } else {
      console.log("Validation result:");
      console.log(validationResult.serialize());
    }
  }

  static async validateSubtreeFile(
    fileName: string,
    validationState: ValidationState,
    implicitTiling: TileImplicitTiling | undefined,
    reportFileName: string | undefined
  ): Promise<void> {
    console.log("Validating subtree " + fileName);
    const validationResult = await Validators.validateSubtreeFile(
      fileName,
      validationState,
      implicitTiling
    );
    if (defined(reportFileName)) {
      await writeUnchecked(reportFileName!, validationResult.serialize());
    } else {
      console.log("Validation result:");
      console.log(validationResult.serialize());
    }
  }

  static async validateAllTilesetSpecFiles(
    writeReports: boolean
  ): Promise<void> {
    const recurse = true;
    const allSpecFiles = createFilesIterable(
      ValidatorMain.specsDataRootDir + "/tilesets",
      recurse
    );
    const ignoreCase = true;
    const matcher = globMatcher("**/*.json", ignoreCase);
    const specFiles = filterIterable(allSpecFiles, matcher);
    for (const specFile of specFiles) {
      let reportFileName = undefined;
      if (writeReports) {
        reportFileName = ValidatorMain.deriveReportFileName(specFile);
      }
      await ValidatorMain.validateTilesetFile(specFile, reportFileName);
    }
  }

  static async validateAllMetadataSchemaSpecFiles(
    writeReports: boolean
  ): Promise<void> {
    const recurse = false;
    const allSpecFiles = createFilesIterable(
      ValidatorMain.specsDataRootDir + "schemas",
      recurse
    );
    const ignoreCase = true;
    const matcher = globMatcher("**/*.json", ignoreCase);
    const specFiles = filterIterable(allSpecFiles, matcher);
    for (const specFile of specFiles) {
      let reportFileName = undefined;
      if (writeReports) {
        reportFileName = ValidatorMain.deriveReportFileName(specFile);
      }
      await ValidatorMain.validateSchemaFile(specFile, reportFileName);
    }
  }

  static async validateAllSubtreeSpecFiles(
    writeReports: boolean
  ): Promise<void> {
    const recurse = false;
    const allSpecFiles = createFilesIterable(
      ValidatorMain.specsDataRootDir + "subtrees",
      recurse
    );
    const ignoreCase = true;
    const matcher = globMatcher("**/{*.json,*.subtree}", ignoreCase);
    const specFiles = filterIterable(allSpecFiles, matcher);
    for (const specFile of specFiles) {
      let reportFileName = undefined;
      if (writeReports) {
        reportFileName = ValidatorMain.deriveReportFileName(specFile);
      }
      await ValidatorMain.validateSubtreeSpecFile(specFile, reportFileName);
    }
  }

  static async validateSubtreeSpecFile(
    fileName: string,
    reportFileName: string | undefined
  ): Promise<void> {
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
      implicitTiling,
      reportFileName
    );
  }

  /**
   * Derives a file name for a report from the given input file name.
   * The resulting file name will be a file in the same directory as
   * the given one. Further details are intentionally not specified here.
   *
   * @param inputFileName The input file name
   * @returns The report file name
   */
  static deriveReportFileName(inputFileName: string): string | undefined {
    const basename = path.basename(inputFileName, path.extname(inputFileName));
    const extension = ".report.json";
    return path.join(path.dirname(inputFileName), basename + extension);
  }
}
