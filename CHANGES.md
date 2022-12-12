

Version 0.2.0 - 2022-??-??

- Add support for validation options that allow to include/exclude certain content types for the validation. These options can either be given via the `--optionsFile` command line argument, or passed as an optional parameter to `Validators.validateTilesetFile`.
- Fixed a bug where the content data was not validated when the validator was used as a library ([#248](https://github.com/CesiumGS/3d-tiles-validator/issues/248))
- When a tileset input file did not exist, the validator generated a `JSON_PARSE_ERROR`. Now it generates an `IO_ERROR` (including the file path) instead.
- Dependency updates:
  - Updated `better-sqlite3` from `7.5.3` to `8.0.1` (for compatibility with Node 19)
  - Removed `jasmine-node` 
  - Removed `tsconfig/node16`
  - Reduced `engines.node` version from `>=16.0.0` to `>=14.0.0`

Version 0.1.0 - 2022-11-29
  
  - Initial release