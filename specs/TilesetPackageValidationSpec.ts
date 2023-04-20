import { Validators } from "../src/validation/Validators";

describe("Tileset package validation", function () {
  it("detects no issues in validTilesetPackage.3tz", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/packages/validTilesetPackage.3tz"
    );
    expect(result.length).toEqual(0);
  });
  it("detects no issues in validTilesetPackage.3dtiles", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/packages/validTilesetPackage.3dtiles"
    );
    expect(result.length).toEqual(0);
  });
  it("detects no issues in validTilesetPackageZipped.3tz", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/packages/validTilesetPackageZipped.3tz"
    );
    expect(result.length).toEqual(0);
  });
  it("detects no issues in validTilesetPackageZipped.3dtiles", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/packages/validTilesetPackageZipped.3dtiles"
    );
    expect(result.length).toEqual(0);
  });
  it("detects issues in tilesetPackageWithWarnings.3tz", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/packages/tilesetPackageWithWarnings.3tz"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_WARNING");
  });
  it("detects issues in tilesetPackageWithWarnings.3dtiles", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/packages/tilesetPackageWithWarnings.3dtiles"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_WARNING");
  });
});
