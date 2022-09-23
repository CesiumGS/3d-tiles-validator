//eslint-disable-next-line
const yargs = require("yargs/yargs");

import { ValidatorMain } from "./ValidatorMain";

/*/
// TODO This is only used for local verification, to run the AJV-based 
// JSON schema validation in the background
import { Validators } from "./validation/Validators";
const tilesSchemaRootDir = "C:/Develop/CesiumGS/3d-tiles/specification/schema";
console.warn("Using fixed root directory for schema: " + tilesSchemaRootDir);
Validators.setSchemaRootDir(tilesSchemaRootDir);
//*/

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
      describe: "The metadata schema input file path",
    },
    subtreeFile: {
      type: "string",
      alias: "s",
      describe: "The subtree input file path",
    },
    tilesetSpecs: {
      type: "boolean",
      describe: "Validate all tileset spec files",
    },
    metadataSchemaSpecs: {
      type: "boolean",
      describe: "Validate all metadata schema spec files",
    },
    subtreeSpecs: {
      type: "boolean",
      describe: "Validate all subtree spec files",
    },
  })
  .demandCommand();
const argv = args.argv;

if (argv.tilesetFile) {
  ValidatorMain.validateTilesetFile(argv.tilesetFile);
} else if (argv.tilesetsDirectory) {
  ValidatorMain.validateTilesetsDirectory(
    argv.tilesetsDirectory,
    argv.tilesetGlobPattern
  );
} else if (argv.metadataSchemaFile) {
  ValidatorMain.validateSchemaFile(argv.metadataSchemaFile);
} else if (argv.subtreeFile) {
  ValidatorMain.validateSubtreeSpecFile(argv.subtreeFile);
} else if (argv.tilesetSpecs) {
  ValidatorMain.validateAllTilesetSpecFiles();
} else if (argv.metadataSchemaSpecs) {
  ValidatorMain.validateAllMetadataSchemaSpecFiles();
} else if (argv.subtreeSpecs) {
  ValidatorMain.validateAllSubtreeSpecFiles();
} else {
  args.showHelp();
}
