# 3D Tiles Validator 1.1 Implementation Notes

Parts of the current implementation may still change. This page is only a short description of the overall structure.

## Directory structure:

- `./src`: The entry point for the command line interface is in `main.ts`
- `./src/validation`: The core classes for the 3D Tiles validation
- `./src/base`: Generic, low-level utility functions
- `./src/io`: Classes for reading and resolving resources via URIs
- `./src/issues`: Classes defining the categories of detected issues
- `./src/structure`: Plain old objects for the 3D Tiles types
- `./src/tileFormats`: Validators for tile content
- `./src/implicitTiling`: Classes that support accessing implicit tiling information
- `./src/traversal`: Classes for traversing tilesets
- `./src/metadata`: Classes that support accessing 3D Metadata
- `./specs`: Jasmine specs
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
- For validation issues that refer to the tile content, each `ValidationIssue` can have an array of `causes`. This can be filled, for example, with the information from the glTF validator that caused the validation to fail

## Discussion points

### General functionality

- Check that geometry is within tile.boundingVolume, content.boundingVolume, and parent.boundingVolume
- Check that metadata statistics are correct. Or at the very least, check that metadata values fall within min/max
- Check that metadata values fall within the class's min/max
- Declarative styling validation
- Should absolute URIs be resolved?
