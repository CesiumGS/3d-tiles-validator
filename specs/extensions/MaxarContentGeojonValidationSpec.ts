import { Validators } from "../../src/validation/Validators";

describe("Tileset MAXAR_content_geojson extension validation", function () {
  it("detects issues in validTilesetWithGeojson", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/validTilesetWithGeojson.json"
    );
    // Expect one warning for skipping the GeoJSON validation
    // and one for the missing declaration of the
    // MAXAR_content_geojson usage in the extensionsUsed
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_WARNING");
    expect(result.get(1).type).toEqual("EXTENSION_FOUND_BUT_NOT_USED");
  });

  it("detects issues in validTilesetWithMaxarContentGeojson", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/validTilesetWithMaxarContentGeojson.json"
    );
    // Expect one warning for skipping the GeoJSON validation
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_WARNING");
  });
});
