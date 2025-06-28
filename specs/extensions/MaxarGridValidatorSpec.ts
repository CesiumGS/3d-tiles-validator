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

  it("detects no issues in validS2Grid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/validS2Grid.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in invalidS2GridWithCenter", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidS2GridWithCenter.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in invalidSrsReferenceSystem", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidSrsReferenceSystem.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in invalidTileLevel", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidTileLevel.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in invalidS2GridWithSize", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidS2GridWithSize.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in invalidS2GridWithSrs", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidS2GridWithSrs.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in invalidCoordinateSystemType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidCoordinateSystemType.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in invalidCoordinateSystemValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidCoordinateSystemValue.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("STRING_VALUE_INVALID");
  });

  it("detects issues in invalidBoundingBoxSemantics", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/invalidBoundingBoxSemantics.json"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });
});
