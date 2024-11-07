import { Validators } from "../../src/validation/Validators";

describe("Tileset 3DTILES_bounding_volume_S2 extension validation", function () {
  it("detects issues in s2AndInvalidBox", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/boundingVolumeS2/s2AndInvalidBox.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in s2MaximumHeightInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/boundingVolumeS2/s2MaximumHeightInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in s2MinimumHeightGreaterThanMaximumHeight", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/boundingVolumeS2/s2MinimumHeightGreaterThanMaximumHeight.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("BOUNDING_VOLUME_INVALID");
  });

  it("detects issues in s2MinimumHeightInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/boundingVolumeS2/s2MinimumHeightInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in s2TokenInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/boundingVolumeS2/s2TokenInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in s2TokenInvalidValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/boundingVolumeS2/s2TokenInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("S2_TOKEN_INVALID");
  });

  it("detects issues in s2TokenMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/boundingVolumeS2/s2TokenMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects no issues in validTilesetWithS2", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/boundingVolumeS2/validTilesetWithS2.json"
    );
    expect(result.length).toEqual(0);
  });
});
