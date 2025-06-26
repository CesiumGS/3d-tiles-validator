import { Validators } from "../../src/validation/Validators";

describe("Tileset MAXAR_grid extension validation", function () {
  it("detects no issues in validTilesetWithMaxarGrid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/validTilesetWithMaxarGrid.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in validTilesetWithVriconGrid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/validTilesetWithVriconGrid.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in invalidGridType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidGridType.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in invalidCenterLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidCenterLength.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in invalidSizeLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidSizeLength.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in invalidBoundingBoxLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidBoundingBoxLength.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in invalidIndexLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidIndexLength.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in invalidElevation", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidElevation.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });
});
