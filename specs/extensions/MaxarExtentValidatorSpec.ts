import { Validators } from "../../src/validation/Validators";

describe("Tileset MAXAR_extent extension validation", function () {
  it("detects no issues in validTilesetWithMaxarExtent", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarExtent/validTilesetWithMaxarExtent.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in invalidEmptyUri", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarExtent/invalidEmptyUri.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("STRING_VALUE_INVALID");
  });

  it("detects issues in invalidMissingUri", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarExtent/invalidMissingUri.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in invalidUriType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarExtent/invalidUriType.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });
});
