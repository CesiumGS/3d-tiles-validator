
Version 0.4.1 - 2023-05-02

- Moved most of the internal implementation into the `3d-tiles-tools`, and replaced it with a dependency to `3d-tiles-tools`
- Detect cycles in external tilesets ([#269](https://github.com/CesiumGS/3d-tiles-validator/issues/269))
- Handle 3D Tiles packages that contain entries that are individually compressed with GZIP

Version 0.4.0 - 2023-01-31

- Padding bytes in B3DM that had only be inserted to align its length to 8 bytes had not been handled properly, and caused unwanted validation warnings. This case is now handled by restricting the glTF validation to the GLB _without_ padding bytes ([#256](https://github.com/CesiumGS/3d-tiles-validator/issues/256))
- When a tileset referred to glTF (JSON) data that could not be resolved, then this was ignored. Now, it creates an error saying that the data could not be resolved. The treatment of non-resolvable data might be configured with validation options in the future (see https://github.com/CesiumGS/3d-tiles-validator/issues/224)
- When the glTF validator generated messages with the "hint" severity, these had not been shown in the tileset validation report. Now, they show up as issues with the `INFO` severity level.
- The `tile.transform` matrices had been checked to be invertible. Now they are checked to be affine ([#262](https://github.com/CesiumGS/3d-tiles-validator/issues/262)).
- Fixed a bug where the validation of PNTS caused wrong validation issues for the batch table length for batched point clouds.
- Added experimental support for validating tileset package files. The `--tilesetFile` that is given at the command line can now also be a 3TZ or 3DTILES file.
- When input JSON files contained a Unicode BOM (Byte Order Mark), the validator reported a `JSON_PARSE_ERROR` without information about the reason for the parsing error. Now it reports an `IO_ERROR` with a helpful error message.

Version 0.3.0 - 2022-12-20

- Updated the packaging so that the validator can more easily be executed as a command line tool after installing
- Updated the scripts in `package.json` to simplify the packaging process

Version 0.2.0 - 2022-12-13

- Add support for validation options that allow to include/exclude certain content types for the validation. These options can either be given via the `--optionsFile` command line argument, or passed as an optional parameter to `Validators.validateTilesetFile`.
- Fixed a bug where the content data was not validated when the validator was used as a library ([#248](https://github.com/CesiumGS/3d-tiles-validator/issues/248))
- Fixed a bug that caused validation errors for `statistics.class` properties
- When a tileset input file did not exist, the validator generated a `JSON_PARSE_ERROR`. Now it generates an `IO_ERROR` (including the file path) instead.
- Dependency updates:
  - Updated `better-sqlite3` from `7.5.3` to `8.0.1` (for compatibility with Node 19 - see [#245](https://github.com/CesiumGS/3d-tiles-validator/issues/245))
  - Removed `jasmine-node` 
  - Removed `tsconfig/node16`
  - Reduced `engines.node` version from `>=16.0.0` to `>=14.0.0`

Version 0.1.0 - 2022-11-29
  
  - Initial release
