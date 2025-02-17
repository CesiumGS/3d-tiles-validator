import { Validators } from "../../src/validation/Validators";

describe("Tileset MAXAR_grid extension validation", function () {
  it("detects no issues in validTilesetWithMaxarGrid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/validTilesetWithMaxarGrid.json"
    );
    expect(result.length).toEqual(0);
  });

  // Note: VRICON_grid is just a legacy name of MAXAR_grid
  it("detects no issues in validTilesetWithVriconGrid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarGrid/validTilesetWithVriconGrid.json"
    );
    expect(result.length).toEqual(0);
  });
});
