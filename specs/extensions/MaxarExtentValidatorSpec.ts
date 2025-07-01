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

  it("detects issues in invalidNonResolvableUri", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarExtent/invalidNonResolvableUri.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("IO_ERROR");
    expect(result.get(0).message).toContain("could not be resolved");
  });

  it("detects issues in invalidGeojsonContent", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarExtent/invalidGeojsonContent.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
    expect(result.get(0).message).toContain("coordinates");
  });

  it("validates spatial containment with validTilesetWithSpatialExtent", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarExtent/validTilesetWithSpatialExtent.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects spatial containment issues in invalidSpatialExtent", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarExtent/invalidSpatialExtent.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("BOUNDING_VOLUMES_INCONSISTENT");
    expect(result.get(0).message).toContain(
      "not contained within the root tile's bounding volume"
    );
  });
});
