import { Validators } from "../../src/validation/Validators";

describe("KHR_lights_punctual extension validation", function () {
  it("detects no issues in validTilesetWithKhrLightsPunctual when no temporal traits are used", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/gltfExtensions/khrLightsPunctual/validTilesetWithKhrLightsPunctual.json"
    );
    // Should only have info messages, no errors since we only validate temporal traits
    let hasErrors = false;
    for (let i = 0; i < result.length; i++) {
      if (result.get(i).severity === "ERROR") {
        hasErrors = true;
        break;
      }
    }
    expect(hasErrors).toBe(false);
  });

  it("detects issues in validTilesetWithInvalidKhrLightsPunctual", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/gltfExtensions/khrLightsPunctual/validTilesetWithInvalidKhrLightsPunctual.json"
    );
    // Expect one error from the glTF Validator that complains about
    // the MAXAR_temporal_light_traits extension being used within
    // one light, but not being declared in extensionsUsed.
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_ERROR");
  });
});
