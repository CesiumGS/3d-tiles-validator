# 3D Tiles Validator Implementation Notes

Parts of the current implementation may still change. This page is only a short description of the overall structure.

## Directory structure:

- `./src`: The entry point for the command line interface is in `main.ts`
- `./src/validation`: The core classes for the 3D Tiles validation
- `./src/issues`: Classes defining the categories of detected issues
- `./src/tileFormats`: Classes for the validation of tile contents
- `./src/archives`: Functions that are specific for the validation of 3TZ archives/packages
- `./specs`: Jasmine specs
- `./specs/data`: Test data

## Overview

The classes in the `./src/validation` directory are the core classes for the 3D Tiles validation. 

The entry point for the tileset validation is the `TilesetValidator` class. This class is not publicly visible, but it is the main class that is used in the public `Validators.validateTilesetFile` method. The validation process, as it is implemented in the `TilesetValidator`, is:

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


## Future Work

Certain functionalities are currently offered via the command line, but only intended for internal use:

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



## API Definition

The API definition is tracked with https://api-extractor.com

After running `npm install`, the API documentation can be created with `npm run docs`. The API documentation will be written into the `build/docs` directory. The surface API information will be written into `etc/3d-tiles-validator.api.md`. This file captures the public API, and changes in the public API will cause a warning to be printed

> Warning: You have changed the public API signature for this project. Updating etc/3d-tiles-validator.api.md

This API definition file is tracked with Git, so changes in this file should be reviewed carefully.


## Release Process

- Prepare the actual release:
  - Update `CHANGES.md`
  - Update the version number in `package.json`

- Generate the tarball for the release:  
  
  `npm run package` 

  This will run the required scripts from the `package.json`:
    - Clean the build output folder
    - Prepare the package: 
      - Perform linting
      - Check formatting
      - Build (compile TypeScript to JavaScript)
      - Run the unit tests
      - Generate the documentation
      - Update the third-party information
    - Package the build output folder into a TAR file

- Verify the contents of the resulting TAR file. If there are unwanted files, add these files to `.npmignore` and re-generate the tarball

- Create a git tag for the version and push it:
 
  `git tag -a v1.2.3 -m "Release of version 1.2.3"`
  
  `git push origin v1.2.3`

- Publish the package:
  
  `npm publish`


### Build Scripts

The build scripts that are used for the release process are documented with `about:`_`<step>`_ in the `package.json` file. Each of these comments indicates the goal and preconditions for running the respective step. The structure of these scripts is often organized hierarchically:

- `docs`
  - `build`
  - `docs-generate`
    - `docs-prepare-directory`
    - `docs-extract-api`,
    - `docs-generate-markdown`,

 The intention is to make sure that each "top-level" (single-word) script can be executed without any preconditions (athough this pattern may not be applied for all steps). Intermediate steps can be executed manually or as part of other steps when it is ensured that the respective preconditions are met.

The following `devDependencies` are *only* used for the implementation of the build process:

- `mkdirp` - To generate the `etc` output directory for the API definition file (if it does not exist yet)
- `del-cli` - To delete the contents of the `build` output folder
- `copyfiles` - To copy the `bin/main` file to the build folder (see `bin/README.md` for details)

