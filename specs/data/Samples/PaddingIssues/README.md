A set of tests for the handling of padding bytes for GLB data in B3DM tiles.
(Created for https://github.com/CesiumGS/3d-tiles-validator/issues/256)

The tilesets `tilesetA`/`B`/`C`/`D` refer to B3DM files `llA`/`B`/`C`/`D`, respectively.

- A: A B3DM where the length was not aligned to 8 bytes, causing an issue: "The byte length must be aligned to 8 bytes"
- B: Contains additional 0-bytes at the end of the B3DM, to ensure that its length is aligned to 8 bytes. The validator will extract the length of the actual GLB data (without padding) from the GLB header. This passes validation.
- C: Contains additional 0-bytes at the end of the BIN chunk of the GLB. The glTF validator will report an issue: "GLB-stored BIN chunk contains 4 extra padding byte(s)."
- D: Contains ` `-bytes (spaces) at the end of the JSON chunk of the GLB. This also passes validation.
