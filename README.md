# 3D Tiles Validator 1.1

A validator for 3D Tiles 1.1.

> **A note about the repository structure**
> 
> This repository originally contained multiple projects. Now, these project are maintained in separate repositories:
> 
> - The `3d-tiles-tools` can be found in [the `3d-tiles-tools` repository](https://github.com/CesiumGS/3d-tiles-tools)
> - The `3d-tiles-samples-generator` can be found in [the `3d-tiles-samples-generator` repository](https://github.com/CesiumGS/3d-tiles-samples-generator)
> 

## Usage

**Note**: Some of the implementation and interfaces may still change. This refers to the source code as well as details of the command line interface and report format.

#### Validate a single tileset file:
```
npx ts-node src/main.ts --tilesetFile specs/data/Samples/TilesetWithFullMetadata/tileset.json
```

#### Validate a set of tileset files:
```
npx ts-node src/main.ts --tilesetsDirectory specs/data/Samples/
```
This will validate all tileset files in the given directory and all its subdirectories. The tileset files are identified by matching the file name against the glob pattern `**/*tileset*.json`. The pattern can be configured with the `tilesetGlobPattern` parameter. For example, in order to treat all .json files as tileset files:
```
npx ts-node src/main.ts --tilesetsDirectory specs/data/Samples/ --tilesetGlobPattern **/*.json
```

#### Validate a single metadata schema file:
```
npx ts-node src/main.ts --metadataSchemaFile specs/data/schemas/validSchema.json
```

#### Validate a single subtree file:

**Note:** For the actual validation of standalone subtree files, there has to be a mechanism for passing in the information about the expected _structure_ of the subtree (namely, the information from the `implicitTiling` object). This example only refers to the files in the `specs` directory, which all assume the same subtree structure for now.
```
npx ts-node src/main.ts --subtreeFile specs/data/subtrees/binarySubtreeValid.subtree
```

#### Batch runs for the spec files

The `specs/data` directory contains sample files that cause different validation issues. These files can be processed with
```
npx ts-node src/main.ts --tilesetSpecs
npx ts-node src/main.ts --metadataSchemaSpecs
npx ts-node src/main.ts --subtreeSpecs
```

## Reports

By default, validation reports are printed to the console. 

When validating a single file, then the `reportFile` argument can be used to specify the output file for the validation report. For example:
```
npx ts-node src/main.ts --tilesetFile specs/data/Samples/TilesetWithFullMetadata/tileset.json --reportFile MY_REPORT.json
```

Alternatively, or when validating multiple files, the `writeReports` argument can be used to write report files into the same directory as the input files. The name of the report file will be derived from the input file name. 
```
npx ts-node src/main.ts --tilesetsDirectory specs/data/Samples/ --writeReports
```

## Implementation notes

See [`IMPLEMENTATION.md`](IMPLEMENTATION.md) for implementation notes.

