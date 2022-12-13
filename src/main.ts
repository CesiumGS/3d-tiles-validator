//eslint-disable-next-line
const yargs = require("yargs/yargs");

import { readJsonUnchecked } from "./base/readJsonUnchecked";

import { ValidationOptions } from "./validation/ValidationOptions";

import { ValidatorMain } from "./ValidatorMain";

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
    reportFile: {
      type: "string",
      alias: "r",
      describe:
        "The name of the file where the report of a single " +
        "validated input file should be written",
    },
    writeReports: {
      type: "boolean",
      alias: "w",
      describe:
        "Write one report file for each validated file. The file name " +
        "of the report will be derived from the input file name, " +
        "and be written into the same directory as the input file.",
    },
    optionsFile: {
      type: "string",
      alias: "o",
      describe: "The options file for the validation process",
    },
    configFile: {
      type: "string",
      alias: "c",
      describe: "The configuration file for the validator run",
    },
    metadataSchemaFile: {
      type: "string",
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
  })
  .demandCommand();
const argv = args.argv;

/**
 * Read the specified options file and return the `ValidationOptions`.
 * If the file cannot be read, a warning will be printed and
 * default validation options will be returned.
 *
 * @param configFile - The name of the config file
 * @returns The `ValidationOptions`.
 */
async function readOptionsFile(
  optionsFile: string
): Promise<ValidationOptions> {
  const validationOptions: ValidationOptions = await readJsonUnchecked(
    optionsFile
  );
  if (!validationOptions) {
    return new ValidationOptions();
  }
  return validationOptions;
}

async function main() {
  const config = {
    options: new ValidationOptions(),
  };
  if (argv.configFile) {
    const configFileData = await readJsonUnchecked(argv.configFile);
    if (!configFileData) {
      return;
    }
    Object.assign(config, configFileData);
  } else {
    Object.assign(config, argv);
  }
  if (argv.optionsFile) {
    config.options = await readOptionsFile(argv.optionsFile);
  }
  ValidatorMain.performValidation(args, config);
}

main();
