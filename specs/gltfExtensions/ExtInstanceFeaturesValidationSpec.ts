import { validateGltf } from "./validateGltf";

// NOTE: These specs only cover the cases that are specific for
// the EXT_instance_features validation. Most of the low-level
// validation (e.g. that of the actual feature IDs) is covered
// with the ExtMeshFeaturesValidationSpec.ts.
describe("EXT_instance_features extension validation", function () {
  it("detects issues in InstanceFeaturesFeatureIdAttributeInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/instanceFeatures/InstanceFeaturesFeatureIdAttributeInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });

  it("detects issues in InstanceFeaturesWithoutMeshGpuInstancing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/instanceFeatures/InstanceFeaturesWithoutMeshGpuInstancing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("detects no issues in ValidInstanceFeatures", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/instanceFeatures/ValidInstanceFeatures.gltf"
    );
    expect(result.length).toEqual(0);
  });
});
