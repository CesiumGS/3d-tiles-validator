import { Validators } from "../../src/validation/Validators";

describe("Tileset VRICON_class extension validation", function () {
  it("detects no issues in validTilesetWithVriconClass", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/vriconClass/validTilesetWithVriconClass.json"
    );
    expect(result.length).toEqual(0);
  });
});
