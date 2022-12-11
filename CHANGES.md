

Version 0.2.0 - 2022-??-??

- Add support for validation options that allow to include/exclude certain content types for the validation
- When a tileset input file did not exist, the validator generated a `JSON_PARSE_ERROR`. Now it generates an `IO_ERROR` (including the file path) instead.
- Fixed a bug where the content data was not validated when the validator was used as a library ([#248](https://github.com/CesiumGS/3d-tiles-validator/issues/248))

Version 0.1.0 - 2022-11-29
  
  - Initial release