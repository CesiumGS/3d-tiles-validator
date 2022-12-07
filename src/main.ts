//eslint-disable-next-line
const yargs = require("yargs/yargs");

import { defaultValue } from "./base/defaultValue";
import { readJsonUnchecked } from "./base/readJsonUnchecked";

import { ContentDataValidators } from "./validation/ContentDataValidators";
import { ValidationOptions } from "./validation/ValidationOptions";

import { ValidatorMain } from "./ValidatorMain";

ValidatorMain.registerExtensionValidators();
ContentDataValidators.registerDefaults();

const args = yargs(process.argv.slice(1))
  .help("help")
  .alias("help", "h")
  .options({
    tilesetFile: {
      type: "string",
      alias: "t",
      describe: "The tileset input file path",
    },
    tilesetsDirectory: {
      type: "string",
      alias: "T",
      describe:
        "The tileset input directory. This will validate all files " +
        "in the given directory and its subdirectories that match " +
        "the tilesetGlobPattern",
    },
    tilesetGlobPattern: {
      type: "string",
      alias: "g",
      default: "**/*tileset*.json",
      describe:
        "The glob pattern for matching tileset input files from directories",
    },
    metadataSchemaFile: {
      type: "string",
      alias: "m",
      describe: "(Internal) The metadata schema input file path",
    },
    tilesetSpecs: {
      type: "boolean",
      describe: "(Internal) Validate all tileset spec files",
    },
    metadataSchemaSpecs: {
      type: "boolean",
      describe: "(Internal) Validate all metadata schema spec files",
    },
    subtreeSpecs: {
      type: "boolean",
      describe: "(Internal) Validate all subtree spec files",
    },
    configFile: {
      type: "string",
      alias: "c",
      describe: "(Internal) The configuration file for the validator run",
    },
    reportFile: {
      type: "string",
      describe:
        "The name of the file where the report of a single " +
        "validated input file should be written",
    },
    writeReports: {
      type: "boolean",
      describe:
        "Write one report file for each validated file. The file name " +
        "of the report will be derived from the input file name, " +
        "and be written into the same directory as the input file.",
    },
  })
  .demandCommand();
const argv = args.argv;

/**
 * If a `reportFile` was specified in the command line arguments,
 * then this is returned.
 *
 * Otherwise, if `writeReports` was specified, a report file
 * name is derived from the given file name and returned
 * (with the details about this name being unspecified for now).
 *
 * Otherwise, `undefined` is returned.
 *
 * @param inputFileName - The input file name
 * @returns The report file name, or `undefined`
 */
function obtainReportFileName(inputFileName: string): string | undefined {
  if (argv.reportFile) {
    return argv.reportFile;
  }
  if (argv.writeReports) {
    return ValidatorMain.deriveReportFileName(inputFileName);
  }
  return undefined;
}

/**
 * When a `configFile` argument was given, then this will read the config
 * file and perform the validation run according to this file.
 * 
 * @param configFile - The name of the config file
 */
async function processConfigFile(configFile: string) {
  const validationConfig = await readJsonUnchecked(configFile);
  const validationOptions: ValidationOptions = validationConfig.options;

  const tilesetsDirectory = validationConfig.tilesetsDirectory;
  const tilesetGlobPattern = defaultValue(
    validationConfig.tilesetGlobPattern,
    "**/*tileset*.json"
  );
  const writeReports = validationConfig.writeReports;

  if (tilesetsDirectory) {
    ValidatorMain.validateTilesetsDirectory(
      tilesetsDirectory,
      tilesetGlobPattern,
      writeReports,
      validationOptions
    );
  }
}

if (argv.configFile) {
  processConfigFile(argv.configFile);
} else if (argv.tilesetFile) {
  const reportFileName = obtainReportFileName(argv.tilesetFile);
  ValidatorMain.validateTilesetFile(
    argv.tilesetFile,
    reportFileName,
    undefined
  );
} else if (argv.tilesetsDirectory) {
  ValidatorMain.validateTilesetsDirectory(
    argv.tilesetsDirectory,
    argv.tilesetGlobPattern,
    argv.writeReports,
    undefined
  );
} else if (argv.metadataSchemaFile) {
  const reportFileName = obtainReportFileName(argv.metadataSchemaFile);
  ValidatorMain.validateSchemaFile(argv.metadataSchemaFile, reportFileName);
} else if (argv.tilesetSpecs) {
  ValidatorMain.validateAllTilesetSpecFiles(argv.writeReports);
} else if (argv.metadataSchemaSpecs) {
  ValidatorMain.validateAllMetadataSchemaSpecFiles(argv.writeReports);
} else if (argv.subtreeSpecs) {
  ValidatorMain.validateAllSubtreeSpecFiles(argv.writeReports);
} else {
  args.showHelp();
}
