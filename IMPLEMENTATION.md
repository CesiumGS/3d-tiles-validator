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
- `./src/binary`: Classes to handle binary metadata from property tables
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
  - `IoValidationIssues.ts`: Fundamental IO errors, like `JSON_PARSE_ERROR`
  - `JsonValidationIssues.ts`: Violations of the JSON schema, like `PROPERTY_MISSING` or `ARRAY_LENGTH_MISMATCH`
  - `StructureValidationIssues.ts`: General, inconsistent structures, like `IDENTIFIER_NOT_FOUND` 
  - `SemanticValidationIssues.ts`: Inconsistent property values, like `TILE_GEOMETRIC_ERRORS_INCONSISTENT` 
  - `MetadataValidationIssues.ts`: Invalid metadata schema and values
  - `BinaryValidationIssues.ts`: Invalid data layouts of binary tile content data
  - `ContentValidationIssues.ts`: Issues that are found in tile content or external tilesets
- For validation issues that refer to the tile content, each `ValidationIssue` can have an array of `causes`. This can be filled, for example, with the information from the glTF validator that caused the validation to fail

## API Definition

The API definition is tracked with https://api-extractor.com

- Install api-extractor:
 
  `npm install -g @microsoft/api-extractor`

- Run the TypeScript compiler to generate the build output:

  `npm run build`

- Invoke api-extractor:  

  `api-extractor run --config api-extractor.jsonc --local --verbose`

The surface API information will be written into `etc/3d-tiles-validator.api.md`. 


## Release Process

- Prepare the actual release:
  - Update `CHANGES.md`
  - Update the version number in `package.json`
  - Make sure all unit tests pass 

- Run the TypeScript compiler to generate the build output:

  `npm run build`

- Generate the tarball of the project:
  
  `npm pack` 

- Verify the contents of the resulting TAR file. If there are unwanted files, add these files to `.npmignore` and re-generate the tarball

- Create a git tag for the version and push it:
 
  `git tag -a 1.2.3 -m 'Release of version 1.2.3'`
  `git push origin 1.2.3`

- Publish the package:
  
  `npm publish`