# 3D Tiles Validator 1.1

A **draft** implementation of a validator for 3D Tiles 1.1.

## Usage

**Note**: The command line interface is preliminary. It will change based on the feedback and desired functionality for passing in validiation configuration settings!

#### Validate a single tileset file:
```
npx ts-node src/main.ts --tilesetFile specs/data/Samples/TilesetWithFullMetadata/tileset.json
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

Validation reports are currently printed to the console. Options to write them into files may be added later. For example, validating an tileset from the `specs/data` directory like this:
```
npx ts-node src/main.ts --tilesetFile specs/data/tilesets/validTilesetWithInvalidB3dm.json
```
may print a validation report like this:
```
{
  "date": "2022-09-21T18:41:45.562Z",
  "numErrors": 1,
  "numWarnings": 0,
  "issues": [
    {
      "type": "CONTENT_VALIDATION_ERROR",
      "path": "tiles/b3dm/invalid.b3dm",
      "message": "Content tiles/b3dm/invalid.b3dm caused validation errors",
      "severity": "ERROR",
      "internalIssues": [
        {
          "type": "BINARY_INVALID_VALUE",
          "path": "tiles/b3dm/invalid.b3dm",
          "message": "The version must be 1 but is 2",
          "severity": "ERROR"
        }
      ]
    }
  ]
}
```

## Implementation notes

See [`IMPLEMENTATION.md`](IMPLEMENTATION.md) for implementation notes.

