//import { Validators } from "../src/validation/Validators";

// TODO The intention here is to eventually pin down
// the `specs` data files and the expected errors
// here as tests. This will be done in one dedicated
// pass when the general approach is agreed on.

describe("ValidationIssues", function () {
  it("detects assetVersionMissing", async function () {
    //const result = await Validators.validateTilesetFile(
    //  "specs/data/assetVersionMissing.json");
    // TODO Currently, this assumes that AJV is still used
    // in the background. It should only be ONE issue here:
    //expect(result.length).toEqual(2);
    //expect(result.get(0).type).toEqual("SCHEMA_ERROR");
  });
});
