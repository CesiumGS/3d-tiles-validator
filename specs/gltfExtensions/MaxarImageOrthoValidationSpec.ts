import { validateGltf } from "./validateGltf";

describe("MAXAR_image_ortho extension validation", function () {
  it("detects no issues in validMaxarImageOrtho", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarImageOrtho/validMaxarImageOrtho.gltf"
    );
    // Should only have info messages, no errors
    let hasErrors = false;
    for (let i = 0; i < result.length; i++) {
      if (result.get(i).severity === "ERROR") {
        hasErrors = true;
        break;
      }
    }
    expect(hasErrors).toBe(false);
  });

  it("detects missing srs property", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarImageOrtho/invalidMissingSrs.gltf"
    );
    expect(result.length).toBeGreaterThan(0);

    // Find the PROPERTY_MISSING error
    let foundPropertyMissing = false;
    for (let i = 0; i < result.length; i++) {
      const issue = result.get(i);
      if (issue.type === "PROPERTY_MISSING" && issue.message.includes("srs")) {
        foundPropertyMissing = true;
        break;
      }
    }
    expect(foundPropertyMissing).toBe(true);
  });

  it("detects invalid transform array length", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarImageOrtho/invalidTransformLength.gltf"
    );
    expect(result.length).toBeGreaterThan(0);

    // Find the ARRAY_LENGTH_MISMATCH error
    let foundArrayLengthMismatch = false;
    for (let i = 0; i < result.length; i++) {
      const issue = result.get(i);
      if (
        issue.type === "ARRAY_LENGTH_MISMATCH" &&
        issue.message.includes("transform")
      ) {
        foundArrayLengthMismatch = true;
        break;
      }
    }
    expect(foundArrayLengthMismatch).toBe(true);
  });

  it("detects invalid coordinate system", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarImageOrtho/invalidCoordinateSystem.gltf"
    );
    expect(result.length).toBeGreaterThan(0);

    // Find the STRING_VALUE_INVALID error
    let foundStringValueInvalid = false;
    for (let i = 0; i < result.length; i++) {
      const issue = result.get(i);
      if (
        issue.type === "STRING_VALUE_INVALID" &&
        issue.message.includes("coordinateSystem")
      ) {
        foundStringValueInvalid = true;
        break;
      }
    }
    expect(foundStringValueInvalid).toBe(true);
  });
});
