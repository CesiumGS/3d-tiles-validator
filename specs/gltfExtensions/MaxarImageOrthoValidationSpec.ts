import { validateGltf } from "./validateGltf";

describe("MAXAR_image_ortho extension validation", function () {
  it("detects no issues in validMaxarImageOrtho", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarImageOrtho/validMaxarImageOrtho.gltf"
    );
    // Should only have info messages, no errors
    expect(result.length).toEqual(0);
  });

  it("detects missing srs property", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarImageOrtho/invalidMissingSrs.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects invalid transform array length", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarImageOrtho/invalidTransformLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects invalid coordinate system", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarImageOrtho/invalidCoordinateSystem.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_VALUE_INVALID");
  });
});
