# 3D Tiles Validator 1.1 Implementation Notes

Parts of the current implementation are still in a **DRAFT** state. 

## Directory structure:

- `./src`: The entry point for the command line interface is in `main.ts`
- `./src/validation`: The core classes for the 3D Tiles validation
- `./src/base`: Generic, low-level utility functions
- `./src/io`: Classes for reading and resolving resources via URIs
- `./src/issues`: Classes defining the categories of detected issues
- `./src/structure`: Plain old objects for the 3D Tiles types
- `./src/tileFormats`: Validators for tile content

- `./src/json`: Classes for generic JSON-schema based validation. This currently only contains an implementation based on `ajv` that is used for internal verification. This is supposed to be extended to support JSON-schema based validation of extensions, with some sort of a "plugin" concept. 
 
- Work in progress: 
  - `./src/implicitTiling`: Classes that support accessing implicit tiling information
  - `./src/traversal`: Classes for traversing tilesets
  - `./src/metadata`: Classes that support accessing 3D Metadata

- `./specs`: Jasmine spec drafts
- `./specs/data`: Test data

## Overview

The classes in the `./src/validation` directory are the core classes for the 3D Tiles validation. 

The entry point for the tileset validation is the `TilesetValidator` class:

- It receives a tileset JSON string and parses it into a `structure/Tileset.ts` object.
  - Note: These `structure/*` classes are "plain objects". The do not have methods, and no real type checking. They _only_ hold the parsed data.
- It traverses the `Tileset` structure, and performs the validation
  - For each object type, there is a validator, like `AssetValidator`, `ContentValidator`, `TileValidator`, `BoundingVolumeValidator` etc. For now, these are mainly classes with single static functions, but they might be refined for some objects.

Each validation function receives a `ValidationContext` as the last parameter. 

The `ValidationContext` class:

- Can contain configuration options that may be needed in the future (like `doValidateContents=false` or so)
- Maintains a `ResourceResolver` that reads a `Buffer` from a given URI (resolved in the respective context - the tileset, external tileset, or glTF)
- Collects the `ValidationIssue` instances (errors and warnings) that are found during the traversal

The `ValidationIssue` class and its types:

- The `ValidationIssue` itself is a plain data structure with basic info about the issue (message, path, severity...)
- Instances of this class are created with methods in the `issues*` classes, roughly categorized here:
  - `issues/IoValidationIssues.ts`: Fundamental IO errors, like `JSON_PARSE_ERROR`
  - `issues/JsonValidationIssues.ts`: Violations of the JSON schema, like `PROPERTY_MISSING` or `ARRAY_LENGTH_MISMATCH`
  - `issues/StructureValidationIssues.ts`: General issues related to an inconsistent structure, like `IDENTIFIER_NOT_FOUND` 
  - `issues/SemanticValidationIssues.ts`: Issues related to inconsistent property values, like `TILE_GEOMETRIC_ERROR_INCONSISTENT` 
  - `ContentValidationIssues.ts`: An error or warning in a tile content
- For validation issues that refer to the tile content, each `ValidationIssue` can have an array of `internalIssues`. This can be filled, for example, with the information from the glTF validator that caused the validation to fail

## Discussion points

### General functionality

- It should be possible to "batch process" a directory (with caveats - how to detect whether a file is a `tileset.json`, beyond its name?)
- It should be possible to write reports into files.
- Check that geometry is within tile.boundingVolume, content.boundingVolume, and parent.boundingVolume
- Check that metadata statistics are correct. Or at the very least, check that metadata values fall within min/max
- Check that metadata values fall within the class's min/max
- Declarative styling validation

### Validation Options

There are certain settings that one could imagine for the validation process. It should be possible to configure the validator accordingly. One also could consider an option to ignore certain issues, like `validator.ignore("/ ** /content/uri", PROPERTY_MISSING)`. But it would be necessary to check these 'ignored issues' literally _everywhere_. It would probably make more sense to offer a `filter` operation on the `ValidationResult`. 

### Test approaches 

The current state of the testing is that there is bunch of tilesets with all kinds of issues in the `./specs/data` directory, and a `ValidationIssuesSpec.ts` that should test the validation issues:
- Run the validation on each file from the `specs/data` directory
- Check whether the actual issues match the expected ones

It _might_ make sense to describe these tests in a more structured form, where each "spec" could contain a summary like this:
```
  {
    "fileName": "assetVersionInvalidType.json",
    "description": "The tileset.asset.version does not have the type `string`",
    "expected": [
      {
        "type": "TYPE_MISMATCH",
        "severity": 0
      }
    ]
  },
```
These tests could then be processed programmatically, and things like the `description` may be useful as a documentation for more complex issues. But it would no longer use the Jasmine infrastructure (e.g. for running individual tests, and certain forms of reports). 


### JSON Schema Based Validation

The initial approach for the JSON schema based validation was to simply use the `ajv` library. This has some caveats, and has therefore been replaced with a manual validation of the schema compliance. However, there should be a mechansim for supporting JSON Schema based validation on demand - for example, for extensions that are not otherwise integrated into the validator. The `src/json` subdirectory contains some drafts for this. But in order to properly integrate this, some architectural questions will have to be answered, as well as the question where exactly the `.*schema.json` files will be stored. Eventually, the mechanism for adding a specific validation could/should boil down to a call like `validator.register("/node/**/boundingVolume", new ExtensionSchemaValidator("s2.schema"));`

There should also be a generic solution for the validation of enum values. When there are extensions, then their set may not be fixed (and the glTF validator hasn't sorted that out either). For example, there may be a `componentType` like `UINT128` or `FLOAT16` at some point in time...


### Random Notes

- The functions in `BasicValidator` should be made more consistent (see note at top of file). The functions should better reflect the `JsonValidationIssues`. The convenience functions that have been introduced (and will be introduced) should be used consistently at the call sites.
- The `extras` and `extensions` are not yet validated (this will just be the JSON-level check whether their properties are `object`s)