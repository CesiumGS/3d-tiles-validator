import { validateGltf } from "./validateGltf";

describe("combined EXT_structural_metadata and EXT_mesh_features extension validation", function () {
  it("detects issues in FeatureIdAttributeAndPropertyTableFeatureIdNotInRange", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/FeatureIdAttributeAndPropertyTableFeatureIdNotInRange.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in FeatureIdAttributePropertyTableInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/FeatureIdAttributePropertyTableInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in FeatureIdAttributePropertyTableWithoutPropertyTables", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/FeatureIdAttributePropertyTableWithoutPropertyTables.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("detects issues in FeatureIdAttributePropertyTableWithoutStructuralMetadata", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/FeatureIdAttributePropertyTableWithoutStructuralMetadata.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("detects issues in FeatureIdTextureAndPropertyTableFeatureIdNotInRange", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/FeatureIdTextureAndPropertyTableFeatureIdNotInRange.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects no issues in ValidFeatureIdAttributeAndPropertyTable", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/ValidFeatureIdAttributeAndPropertyTable.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in ValidFeatureIdTextureAndPropertyTable", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/ValidFeatureIdTextureAndPropertyTable.gltf"
    );
    expect(result.length).toEqual(0);
  });
});
