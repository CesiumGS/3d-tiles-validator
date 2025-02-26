# 3D Tiles Validator

A validator for [3D Tiles](https://github.com/CesiumGS/3d-tiles).

> **A note about the repository structure**
> 
> This repository originally contained multiple projects. Now, these projects are maintained in separate repositories:
> 
> - The `3d-tiles-tools` can be found in [the `3d-tiles-tools` repository](https://github.com/CesiumGS/3d-tiles-tools)
> - The `3d-tiles-samples-generator` can be found in [the `3d-tiles-samples-generator` repository](https://github.com/CesiumGS/3d-tiles-samples-generator)
> 

## Overview

The 3D Tiles validator can be used to validate 3D Tiles tilesets and their associated tile content data. It supports version 1.0 and version 1.1 of the 3D Tiles specification. The validator can be used as a command line tool, or as a library.

**Note**: Some of the implementation and interfaces may still change. This refers to the source code as well as details of the command line interface and report format.

### Implemented Features 

- Validation of the JSON structure of the `tileset.json` file
- Validation of the 3D Tiles [Tile Formats](https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats)
  - The supported tile formats are: Batched 3D Model (`b3dm`), Instanced 3D Model (`i3dm`), Point Cloud (`pnts`), Composite (`cmpt`)
  - glTF tile content is validated with the [glTF Validator](https://github.com/KhronosGroup/glTF-Validator)
- Validation of implicit tilesets
- Validation of 3D Tiles Metadata
  - This includes the validation of the JSON structure of the metadata, as well as the structure and ranges of metadata values, both for the JSON based representation and for the binary metadata that is stored in property tables
- A basic validation of the [`3DTILES_bounding_volume_S2` extension](https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_bounding_volume_S2)
- Validation of tilesets that are contained in 3D Tiles package files (3TZ and 3DTILES files)

## Installation

In order to install the validator locally into a directory, run
```
npm install 3d-tiles-validator
```
(If you want to work directly with a clone of the Git repository, see [Developer Setup](#developer-setup))

## Command Line Usage

#### Validate a single tileset file
```
npx 3d-tiles-validator --tilesetFile specs/data/Samples/SparseImplicitQuadtree/tileset.json
```

The input file can either be a tileset JSON file, or one of the known tileset package files. The known package file formats are 3TZ (a package format based on ZIP), and 3DTILES (a package format based on SQLite). The type of the input is determined from the file extension, which may be `.3tz` or `.3dtiles` (case-insensitively). For example, to validate a 3TZ file:
```
npx 3d-tiles-validator --tilesetFile ./specs/data/tilesets/packages/validTilesetPackage.3tz
```

#### Validate a set of tileset files
```
npx 3d-tiles-validator --tilesetsDirectory specs/data/Samples/
```
This will validate all tileset files in the given directory and all its subdirectories. The tileset files are identified by matching the file name against the glob pattern `**/*tileset*.json`. The pattern can be configured with the `tilesetGlobPattern` parameter. For example, in order to treat all .json files as tileset files:
```
npx 3d-tiles-validator --tilesetsDirectory specs/data/Samples/ --tilesetGlobPattern **/*.json
```

#### Validate a tile content file
```
npx 3d-tiles-validator --tileContentFile specs/data/gltfExtensions/FeatureIdAttributeAndPropertyTableFeatureIdNotInRange.gltf
```

The input file can be any of the content types that are supported by the validator. This includes B3DM, I3DM, PNTS, CMPT, and glTF/GLB files. The type of the file will be determined, and if it is not a known type, then a validation warning will be created.

### Report Files

By default, validation reports are printed to the console. 

When validating a single file, then the `reportFile` argument can be used to specify the output file for the validation report. For example:
```
npx 3d-tiles-validator --tilesetFile specs/data/Samples/TilesetWithFullMetadata/tileset.json --reportFile MY_REPORT.json
```

Alternatively, or when validating multiple files, the `writeReports` argument can be used to write report files into the same directory as the input files. The name of the report file will be derived from the input file name. 
```
npx 3d-tiles-validator --tilesetsDirectory specs/data/Samples/ --writeReports
```

### Option Files

Options for the validation process can be specified in a file that is given via the `--optionsFile` argument: 
```
npx 3d-tiles-validator --optionsFile exampleOptions.json
```
The options represent the properties of the `ValidationOptions` class. For example, using the following `exampleOptions.json` file, then the validator will only validate the tileset JSON structure, but _no_ tile content data:
```JSON
{
  "validateContentData": false
}
```
The following options will cause the validator to _include_ B3DM- and GLB files in the validation process, but ignore all other content types:
```JSON
{
  "includeContentTypes": [ "CONTENT_TYPE_B3DM", "CONTENT_TYPE_GLB" ]
}
```
The following options will cause the validator to _exclude_ tileset files (i.e. external tilesets) during the validation:
```JSON
{
  "excludeContentTypes": [ "CONTENT_TYPE_TILESET" ]
}
```

The options can also be part of a configuration file, as described in the next section.


### Configuration Files

The command line arguments for a validator run can be summarized in a configuration file that is given with the `--configFile` argument. For example, when running the validator with
```
npx 3d-tiles-validator --configFile exampleConfig.json
```
using the following `exampleConfig.json` file
```JSON
{
  "tilesetsDirectory": "specs/data/tilesets",
  "tilesetGlobPattern": "**/*.json"
}
```
then the validator will validate all files in the given directory that match the given glob pattern.

The configuration can also contain an `options` object. This object summarizes the validation options, as described in the [Option Files](#option-files) section. For example: 
```JSON
{
  "tilesetsDirectory": "specs/data/tilesets",
  "tilesetGlobPattern": "**/*.json",
  "options": {
    "includeContentTypes": [ "CONTENT_TYPE_B3DM", "CONTENT_TYPE_GLB" ]
  }
}
```
This will cause the validator to validate all JSON files in the specified directory, but only consider B3DM- and GLB tile content data during the validation.

### Custom Metadata Semantics

The [3D Metadata Specification](https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata) allows for the definition of custom _semantics_ for metadata properties. The built-in semantics are described in the [3D Metadata Semantic Reference](https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata/Semantics). For other semantics, the validator will by default generate a `METADATA_SEMANTIC_UNKNOWN` issue. 

To avoid these warnings, clients can define their own semantics in a metadata schema file, so that they are taken into account during the validation process. Some details of this process might still change (see [`3d-tiles/issues/643`](https://github.com/CesiumGS/3d-tiles/issues/643) for a discussion). But the current state of the support of metadata semantics validation in the 3D Tiles Validator is described here.

#### Metadata Semantics Schema

A 'semantics schema' is a [3D Metadata Schema](https://github.com/CesiumGS/3d-tiles/tree/main/specification/Metadata#schema) file that describes the _semantics_ that may appear in another metadata schema. In a semantics schema, the property names are just the names of the semantics. For example, when a client wants to define a semantic for a class like `ExampleClass`, and this semantic has the name `EXAMPLE_SEMANTIC`, then this structure can be represented in a semantics schema file as follows:

**`exampleSemanticsSchema.json`:**
```json
{
  "id": "Example-Semantics-0.0.0",
  "description": "A metadata schema where each class property has a name that represents one possible semantic of a metadata property, and that is used for validating semantics, by passing it in as one of the 'semanticSchemaFileNames' of the validation options",
  "classes": {
    "ExampleClassSemantics": {
      "description": "A class where each property is a semantic for a property of the 'ExampleClass'",
      "properties": {
        "EXAMPLE_SEMANTIC": {
          "name": "The 'EXAMPLE_SEMANTIC' structure",
          "description": "The structure that a property must have so that it can have the 'EXAMPLE_SEMANTIC'",
          "type": "SCALAR",
          "componentType": "FLOAT32"
        }
      }
    }
  }
}
```

> Note: 
> 
> This schema file contains elaborate names and descriptions. These are optional on a technical level. An equivalent schema file is
> ```json
> {
>   "id": "Example-Semantics-0.0.0",
>   "classes": {
>     "ExampleClassSemantics": {
>       "properties": {
>         "EXAMPLE_SEMANTIC": {
>           "type": "SCALAR",
>           "componentType": "FLOAT32"
>         }
>       }
>     }
>   }
> }
> ```
> But adding names and descriptions is strongly recommended for documentation purposes. 

#### Metadata Semantics Schema Registration

In order to include a 'semantics schema' in the validation process, the name of the schema file can be passed to the validator, as part of the validation options:

**`exampleOptions.json`:**
```json
{
  "semanticSchemaFileNames": ["exampleSemanticsSchema.json"]
}
```

This options file can then be passed to the validator:
```
npx 3d-tiles-validator --optionsFile exampleOptions.json -t ./data/exampleTileset.json
```

The validator will then validate the semantics that are defined in the tileset JSON against the structure that was defined in the semantics schema.



## Developer Setup

When the validator is not installed as a package from NPM, but supposed to be used directly in a cloned repository, then the command line usage is as follows:

- Clone the repository into the current directory:
  ```
  git clone https://github.com/CesiumGS/3d-tiles-validator
  ```
- Change into the directory of the cloned repository:
  ```
  cd 3d-tiles-validator
  ```
- Install the validator and all its dependencies:
  ```
  npm install
  ```

After this, `ts-node` can be used to directly execute the validator, using the same command line options as described above - for example, to validate a single tileset file:
```
npx ts-node src/main.ts --tilesetFile specs/data/Samples/SparseImplicitQuadtree/tileset.json
```


## Library Usage

The basic usage of the validator as a library is shown here:
```JavaScript
const { Validators } = require("3d-tiles-validator");

const resultPromise = Validators.validateTilesetFile("example.json");
resultPromise.then((result) => {
  console.log(result.serialize());
});
```
The `Validators.validateTilesetFile` receives a file name, and returns a promise to the `ValidationResult`, which can then be printed to the console. The second (optional) parameter is a `ValidationOptions` object that summarizes the options for the validation process (also see [Option Files](#option-files)).

### Validaton Result Filtering

Clients can perform basic filtering operations on a `ValidationResult`, in order to remove validation issues that are below a certain severity level, or warnings that are anticipated in a certain application context.

For example, a given validation result can be filtered to 
- include validation issues that have the severity `ERROR`
- exclude validation issues that have the type `EXTENSION_NOT_SUPPORTED`

An example of applying such a filter to a given validation result is shown here:
```JavaScript
const { Validators, ValidationIssueFilters, ValidationIssueSeverity } = require("3d-tiles-validator");

const resultPromise = Validators.validateTilesetFile("example.json");
resultPromise.then((result) => {
  const filteredResult = result
    .filter(ValidationIssueFilters.byIncludedSeverities(ValidationIssueSeverity.ERROR))
    .filter(ValidationIssueFilters.byExcludedTypes("EXTENSION_NOT_SUPPORTED"));
  console.log(filteredResult.serialize());
});
```

**Note**: The `type` strings that are used for describing and categorizing the validation issues are not part of the core API. These strings might change between minor- or patch releases. But changes will be pointed out in the change log.

## Implementation Notes

See [`IMPLEMENTATION.md`](IMPLEMENTATION.md) for implementation notes.

