
Test data for the validation of extensions in the context of external tilesets.

(This is a special aspect of https://github.com/CesiumGS/3d-tiles-validator/issues/231 ).

Each of these data sets consists of a `tileset.json` that refers to an `external.json`.

They use a "dummy" extension called `VENDOR_example_extension` to check the validation
of the `extensionsUsed` propery of a tileset. (This means that the validation will
always at least create one warning, because the extension is not supported).

In the following, the term..

- 'declared' means that a tileset declares the extension in its `extesionsUsed`
- 'contained' means that the tileset actually contains such an extension object in its `extensions`

These cases are considered:

- `declaredInBothContainedInExternal`: This is valid. The external tileset contains it and declares it. The main tileset also declares it (because it refers to one that contains it). 
- `declaredInBothContainedInTileset`: This valid, but causes a warning. The external tileset does not have to declare it if it does not contain it.
- `declaredInExternalContainedInExternal`: This is invalid. The main tileset also has to declare it when it refers to one that contains it.
- `declaredInExternalContainedInTileset`: This is invalid. The main tileset has to declare it if it contains it.
- `declaredInNoneContainedInExternal`: This is invalid. Both tilesets have to declare it when the external one contains it.
- `declaredInTilesetContainedInExternal`: This is invalid. The external one also has to declare it when it contains it
- `declaredInTilesetContainedInTileset`: This is valid. Only the main tileset has to declare it if only the main tileset contains it.
