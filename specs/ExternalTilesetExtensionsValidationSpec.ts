import { Validators } from "../src/validation/Validators";

// Note: These test cases use a dummy extension called
// VENDOR_example_extension
// So they will always create at least a WARNING about
// this not being supported

describe("External tileset extensions validation", function () {
  it("detects no errors in declaredInBothContainedInExternal", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/externalTilesetExtensions/declaredInBothContainedInExternal/tileset.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("EXTERNAL_TILESET_VALIDATION_WARNING");
    expect(result.get(0).causes[0].type).toEqual("EXTENSION_NOT_SUPPORTED");
  });

  it("detects no errors (but one warning) in declaredInBothContainedInTileset", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/externalTilesetExtensions/declaredInBothContainedInTileset/tileset.json"
    );
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("EXTENSION_NOT_SUPPORTED");
    expect(result.get(1).type).toEqual("EXTERNAL_TILESET_VALIDATION_WARNING");
    expect(result.get(1).causes[0].type).toEqual(
      "EXTENSION_USED_BUT_NOT_FOUND"
    );
  });

  it("detects an error in declaredInExternalContainedInExternal", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/externalTilesetExtensions/declaredInExternalContainedInExternal/tileset.json"
    );
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("EXTERNAL_TILESET_VALIDATION_WARNING");
    expect(result.get(0).causes[0].type).toEqual("EXTENSION_NOT_SUPPORTED");
    expect(result.get(1).type).toEqual("EXTENSION_FOUND_BUT_NOT_USED");
  });

  it("detects an error and a warning in declaredInExternalContainedInTileset", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/externalTilesetExtensions/declaredInExternalContainedInTileset/tileset.json"
    );
    expect(result.length).toEqual(3);
    expect(result.get(0).type).toEqual("EXTENSION_NOT_SUPPORTED");
    expect(result.get(1).type).toEqual("EXTERNAL_TILESET_VALIDATION_WARNING");
    expect(result.get(1).causes[0].type).toEqual(
      "EXTENSION_USED_BUT_NOT_FOUND"
    );
    expect(result.get(2).type).toEqual("EXTENSION_FOUND_BUT_NOT_USED");
  });

  it("detects two errors in declaredInNoneContainedInExternal", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/externalTilesetExtensions/declaredInNoneContainedInExternal/tileset.json"
    );
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("EXTERNAL_TILESET_VALIDATION_ERROR");
    expect(result.get(1).type).toEqual("EXTENSION_FOUND_BUT_NOT_USED");
  });

  it("detects one error in declaredInTilesetContainedInExternal", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/externalTilesetExtensions/declaredInTilesetContainedInExternal/tileset.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("EXTERNAL_TILESET_VALIDATION_ERROR");
    expect(result.get(0).causes[1].type).toEqual(
      "EXTENSION_FOUND_BUT_NOT_USED"
    );
  });

  it("detects no errors in declaredInTilesetContainedInTileset", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/externalTilesetExtensions/declaredInTilesetContainedInTileset/tileset.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("EXTENSION_NOT_SUPPORTED");
  });
});
