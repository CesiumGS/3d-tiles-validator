import path from "path";

import { defined } from "3d-tiles-tools";
import { readJsonUnchecked } from "./base/readJsonUnchecked";
import { globMatcher } from "./base/globMatcher";
import { writeUnchecked } from "./base/writeUnchecked";
import { Iterables } from "3d-tiles-tools";

import { ValidationState } from "./validation/ValidationState";
import { Validators } from "./validation/Validators";
import { ValidationResult } from "./validation/ValidationResult";
import { ValidationOptions } from "./validation/ValidationOptions";

import { TileImplicitTiling } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

/**
 * A class summarizing the command-line functions of the validator.
 *
 * The functions in this class are supposed to be called from `main.ts`,
 * based on the parsed command line arguments.
 *
 * @internal
 */
export class ValidatorMain {
  static readonly specsDataRootDir = "specs/data/";

  /**
   * Performs a run of the validator, using the given configuration settings.
   *
   * The configuration may contain properties that match the (long form
   * of the) command line arguments, as well as an `options: ValidationOptions`
   * object (using default options if none are given).
   *
   * @param args - The command line arguments (the `yargs` instance)
   * @param config - The configuration for the validator run
   */
  static async performValidation(args: any, config: any) {
    const validationOptions = defaultValue(
      config.options,
      new ValidationOptions()
    );
    if (config.tilesetFile) {
      const reportFileName = ValidatorMain.obtainReportFileName(
        config,
        config.tilesetFile
      );
      await ValidatorMain.validateTilesetFile(
        config.tilesetFile,
        reportFileName,
        validationOptions
      );
    } else if (config.tilesetsDirectory) {
      await ValidatorMain.validateTilesetsDirectory(
        config.tilesetsDirectory,
        config.tilesetGlobPattern,
        config.writeReports,
        validationOptions
      );
    } else if (config.metadataSchemaFile) {
      const reportFileName = ValidatorMain.obtainReportFileName(
        config,
        config.metadataSchemaFile
      );
      await ValidatorMain.validateSchemaFile(
        config.metadataSchemaFile,
        reportFileName
      );
    } else if (config.tilesetSpecs) {
      await ValidatorMain.validateAllTilesetSpecFiles(config.writeReports);
    } else if (config.metadataSchemaSpecs) {
      await ValidatorMain.validateAllMetadataSchemaSpecFiles(
        config.writeReports
      );
    } else if (config.subtreeSpecs) {
      await ValidatorMain.validateAllSubtreeSpecFiles(config.writeReports);
    } else {
      args.showHelp();
    }
  }

  /**
   * If a `reportFile` was specified in the given configuration,
   * then this is returned.
   *
   * Otherwise, if `writeReports` was specified, a report file
   * name is derived from the given file name and returned
   * (with the details about this name being unspecified for now).
   *
   * Otherwise, `undefined` is returned.
   *
   * @param config - The validation configuration
   * @param inputFileName - The input file name
   * @returns The report file name, or `undefined`
   */
  private static obtainReportFileName(
    config: any,
    inputFileName: string
  ): string | undefined {
    if (config.reportFile) {
      return config.reportFile;
    }
    if (config.writeReports) {
      return ValidatorMain.deriveReportFileName(inputFileName);
    }
    return undefined;
  }

  static async validateTilesetFile(
    fileName: string,
    reportFileName: string | undefined,
    options: ValidationOptions | undefined
  ): Promise<ValidationResult> {
    console.log("Validating tileset " + fileName);

    const validationResult = await Validators.validateTilesetFile(
      fileName,
      options
    );
    if (defined(reportFileName)) {
      await writeUnchecked(reportFileName, validationResult.serialize());
    } else {
      console.log("Validation result:");
      console.log(validationResult.serialize());
    }
    return validationResult;
  }

  static async validateTilesetsDirectory(
    directoryName: string,
    globPattern: string,
    writeReports: boolean,
    options: ValidationOptions | undefined
  ): Promise<void> {
    console.log(
      "Validating tilesets from " + directoryName + " matching " + globPattern
    );
    const recurse = true;
    const allFiles = Iterables.overFiles(directoryName, recurse);
    const ignoreCase = true;
    const matcher = globMatcher(globPattern, ignoreCase);
    const tilesetFiles = Iterables.filter(allFiles, matcher);
    let numFiles = 0;
    let numFilesWithErrors = 0;
    let numFilesWithWarnings = 0;
    let numFilesWithInfos = 0;
    for (const tilesetFile of tilesetFiles) {
      let reportFileName = undefined;
      if (writeReports) {
        reportFileName = ValidatorMain.deriveReportFileName(tilesetFile);
      }
      const validationResult = await ValidatorMain.validateTilesetFile(
        tilesetFile,
        reportFileName,
        options
      );
      numFiles++;
      if (validationResult.numErrors > 0) {
        numFilesWithErrors++;
      }
      if (validationResult.numWarnings > 0) {
        numFilesWithWarnings++;
      }
      if (validationResult.numInfos > 0) {
        numFilesWithInfos++;
      }
    }
    console.log(`Validated ${numFiles} files`);
    console.log(`    ${numFilesWithErrors} files with errors`);
    console.log(`    ${numFilesWithWarnings} files with warnings`);
    console.log(`    ${numFilesWithInfos} files with infos`);
  }

  static async validateSchemaFile(
    fileName: string,
    reportFileName: string | undefined
  ): Promise<ValidationResult> {
    console.log("Validating schema " + fileName);
    const validationResult = await Validators.validateSchemaFile(fileName);
    if (defined(reportFileName)) {
      await writeUnchecked(reportFileName, validationResult.serialize());
    } else {
      console.log("Validation result:");
      console.log(validationResult.serialize());
    }
    return validationResult;
  }

  static async validateSubtreeFile(
    fileName: string,
    validationState: ValidationState,
    implicitTiling: TileImplicitTiling | undefined,
    reportFileName: string | undefined
  ): Promise<ValidationResult> {
    console.log("Validating subtree " + fileName);
    const validationResult = await Validators.validateSubtreeFile(
      fileName,
      validationState,
      implicitTiling
    );
    if (defined(reportFileName)) {
      await writeUnchecked(reportFileName, validationResult.serialize());
    } else {
      console.log("Validation result:");
      console.log(validationResult.serialize());
    }
    return validationResult;
  }

  static async validateAllTilesetSpecFiles(
    writeReports: boolean
  ): Promise<void> {
    const recurse = true;
    const allSpecFiles = Iterables.overFiles(
      ValidatorMain.specsDataRootDir + "/tilesets",
      recurse
    );
    const ignoreCase = true;
    const matcher = globMatcher("**/*.json", ignoreCase);
    const specFiles = Iterables.filter(allSpecFiles, matcher);
    for (const specFile of specFiles) {
      let reportFileName = undefined;
      if (writeReports) {
        reportFileName = ValidatorMain.deriveReportFileName(specFile);
      }
      await ValidatorMain.validateTilesetFile(
        specFile,
        reportFileName,
        undefined
      );
    }
  }

  static async validateAllMetadataSchemaSpecFiles(
    writeReports: boolean
  ): Promise<void> {
    const recurse = false;
    const allSpecFiles = Iterables.overFiles(
      ValidatorMain.specsDataRootDir + "schemas",
      recurse
    );
    const ignoreCase = true;
    const matcher = globMatcher("**/*.json", ignoreCase);
    const specFiles = Iterables.filter(allSpecFiles, matcher);
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
    const allSpecFiles = Iterables.overFiles(
      ValidatorMain.specsDataRootDir + "subtrees",
      recurse
    );
    const ignoreCase = true;
    const matcher = globMatcher("**/{*.json,*.subtree}", ignoreCase);
    const specFiles = Iterables.filter(allSpecFiles, matcher);
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
   * @param inputFileName - The input file name
   * @returns The report file name
   */
  static deriveReportFileName(inputFileName: string): string | undefined {
    const basename = path.basename(inputFileName, path.extname(inputFileName));
    const extension = ".report.json";
    return path.join(path.dirname(inputFileName), basename + extension);
  }
}
