
Version ?.?.? - yyyy-mm-dd

- ...

Version 0.5.1 - 2024-12-05

- The maximum number of issues that are reported for a single glTF asset is now limited ([#291](https://github.com/CesiumGS/3d-tiles-validator/pull/291)).
- When the number of bytes that are required for a certain property texture property did not match the number of `channels`, then the validator reported this as an `ERROR`, with the type `TEXTURE_CHANNELS_OUT_OF_RANGE`. This could cause errors to be reported for the case of 16-bit channels in textures, where these numbers do not have to match. Now, these cases are only reported as a `WARNING`, of the type `TEXTURE_CHANNELS_SIZE_MISMATCH` ([#293](https://github.com/CesiumGS/3d-tiles-validator/pull/293)).
- The `refine` property for tiles is optional in general, but _required_ for the root tile. The validator did not check this. Now, it reports a  `TILE_REFINE_MISSING_IN_ROOT` error when the `refine` property is missing in a root tile ([#303](https://github.com/CesiumGS/3d-tiles-validator/pull/303)).
- When encountering an invalid alignment in the binary data of legacy tile content files, the validator stopped the validation of these files, and only reported a `BINARY_INVALID_ALIGNMENT` error. Now, it will try to process the data despite the invalid alignment, and perform further validation steps, for example, of the binary glTF data ([#304](https://github.com/CesiumGS/3d-tiles-validator/pull/304)).
- Fixed a bug where the validator erroneously reported validation error when external tilesets did not use extensions that had been declared in the `extensionsUsed` of the containing tileset ([#305](https://github.com/CesiumGS/3d-tiles-validator/pull/305)).
- Added a convenience function to the `ValidationResult` class, to easily deserialize and post-process validation reports ([#307](https://github.com/CesiumGS/3d-tiles-validator/pull/307)).
- Fixed a bug where the default value for `texCoord` properties of property texture was not handled properly ([#309](https://github.com/CesiumGS/3d-tiles-validator/pull/309)).
- Added the option to define a severity threshold for content validation issues. Setting the `contentValidationIssueSeverity` in the validation config file will omit all content validation issues that are below this severity threshold ([#310](https://github.com/CesiumGS/3d-tiles-validator/pull/310)).
- Fixed a bug where the validator reported an error for binary `.subtree` files that did not contain any buffers ([#313](https://github.com/CesiumGS/3d-tiles-validator/pull/313)).
- Added support for the validation of the `NGA_gpm_local` glTF extension ([#316](https://github.com/CesiumGS/3d-tiles-validator/pull/316)).
- Added support for the validation of the `NGA_gpm` 3D Tiles extension ([#319](https://github.com/CesiumGS/3d-tiles-validator/pull/319)).
- Fixed a bug where the validator erroneously reported a `BOUNDING_VOLUMES_INCONSISTENT` error when a tile with a `transform` contained a `content` with a `boundingVolume` ([#322](https://github.com/CesiumGS/3d-tiles-validator/pull/322)).
- Updated the underlying `3d-tiles-tools` dependency to include a fix for a bug where the validator reported an `INTERNAL_ERROR` when trying to validate a tileset that contains glTF that use the `EXT_meshopt_compression` extension ([#323](https://github.com/CesiumGS/3d-tiles-validator/issues/323)).
- Fixed a bug where the semantics that are referred to as 'General Semantics' in the 3D Metadata Semantic Reference had been reported to be unknown with a `METADATA_SEMANTIC_UNKNOWN` message ([#325](https://github.com/CesiumGS/3d-tiles-validator/pull/325)).

Version 0.5.0 - 2023-10-24

- Added validation of glTF extensions via [#280](https://github.com/CesiumGS/3d-tiles-validator/pull/280) and [#284](https://github.com/CesiumGS/3d-tiles-validator/pull/284). In addition to the basic validation of glTF tile content that is performed with the glTF validator, the 3D Tiles Validator now checks the validity of certain glTF extensions:
  - For `EXT_mesh_features`, it will check the validity of feature ID attributes and feature ID textures
  - For `EXT_instance_features`, it will check the validity of the feature ID attributes that refer to the `EXT_mesh_gpu_instancing` extension
  - For `EXT_structural_metadata`, it will check the validity of the metadata schema definition, property tables, property attributes, and property textures
- Added a command line functionality for validating single tile content files (glTF/GLB, B3DM, I3DM, PNTS, and CMPT), via [#285](https://github.com/CesiumGS/3d-tiles-validator/pull/285)
- When an I3DM refers to an external glTF asset with a URI, then the URI has to be padded with `0x20` (space) bytes if necessary to satisfy the alignment requirements. The validator only accepted `0x00` (zero) bytes as padding bytes. Now the validator properly handles trailing spaces, and reports the presence of zero-bytes with a validation warning ([#276](https://github.com/CesiumGS/3d-tiles-validator/issues/276))
- Changed the severity level of validation issues:
  - The case that the `geometricError` of a tile was larger than the `geometricError` of its parent was reported as an `ERROR`. The specification does not explicitly disallow this, so it is now only treated as a `WARNING` ([#286](https://github.com/CesiumGS/3d-tiles-validator/issues/286))
  - An empty `children` array in a tile was treated as an `ERROR`, but is now treated as a `WARNING`, via [#288](https://github.com/CesiumGS/3d-tiles-validator/pull/288)

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
