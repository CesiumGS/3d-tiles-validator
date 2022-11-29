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

## Command Line Usage

#### Validate a single tileset file
```
npx ts-node src/main.ts --tilesetFile specs/data/Samples/TilesetWithFullMetadata/tileset.json
```

#### Validate a set of tileset files
```
npx ts-node src/main.ts --tilesetsDirectory specs/data/Samples/
```
This will validate all tileset files in the given directory and all its subdirectories. The tileset files are identified by matching the file name against the glob pattern `**/*tileset*.json`. The pattern can be configured with the `tilesetGlobPattern` parameter. For example, in order to treat all .json files as tileset files:
```
npx ts-node src/main.ts --tilesetsDirectory specs/data/Samples/ --tilesetGlobPattern **/*.json
```

### Report Files

By default, validation reports are printed to the console. 

When validating a single file, then the `reportFile` argument can be used to specify the output file for the validation report. For example:
```
npx ts-node src/main.ts --tilesetFile specs/data/Samples/TilesetWithFullMetadata/tileset.json --reportFile MY_REPORT.json
```

Alternatively, or when validating multiple files, the `writeReports` argument can be used to write report files into the same directory as the input files. The name of the report file will be derived from the input file name. 
```
npx ts-node src/main.ts --tilesetsDirectory specs/data/Samples/ --writeReports
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
The `Validators.validateTilesetFile` receives a file name, and returns a promise to the `ValidationResult`, which can then be printed to the console.

### Validaton Result Filtering

Clients can perform basic filtering operations on a `ValidationResult`, in order to remove validation issues that are below a certain severity level, or warnings that are anticipated in a certain application context.

For example, a given validation result can be filtered to 
- include validation issues that have the severity `ERROR`
- exclude validation issues that have the type `EXTENSION_NOT_SUPPORTED`

An example of applying such a filter to a given validation result is shown here:
```JavaScript
const { Validators, ValidationIssueFilters } = require("3d-tiles-validator");

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

