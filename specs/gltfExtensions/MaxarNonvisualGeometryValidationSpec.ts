import { validateGltf } from "./validateGltf";

describe("MAXAR_nonvisual_geometry extension validation", function () {
  it("detects issues in NodeExtensionMeshMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/NodeExtensionMeshMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in NodeExtensionMeshInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/NodeExtensionMeshInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in NodeExtensionMeshInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/NodeExtensionMeshInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in NodeExtensionMeshNotFound", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/NodeExtensionMeshNotFound.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });

  it("detects issues in PrimitiveExtensionShapeMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/PrimitiveExtensionShapeMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in PrimitiveExtensionShapeInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/PrimitiveExtensionShapeInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in PrimitiveExtensionShapeInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/PrimitiveExtensionShapeInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in PrimitiveExtensionTypeMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/PrimitiveExtensionTypeMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in PrimitiveExtensionTypeInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/PrimitiveExtensionTypeInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in PrimitiveExtensionTypeEmpty", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/PrimitiveExtensionTypeEmpty.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_LENGTH_MISMATCH");
  });

  it("detects issues in ShapePointsIncompatibleMode", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/ShapePointsIncompatibleMode.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("detects issues in ShapePathIncompatibleMode", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/ShapePathIncompatibleMode.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("detects issues in ShapeSurfaceIncompatibleMode", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/ShapeSurfaceIncompatibleMode.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("detects issues in ShapeVolumeIncompatibleMode", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/ShapeVolumeIncompatibleMode.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("validates ValidNodeExtension", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/ValidNodeExtension.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("validates ValidPrimitiveExtensionPoints", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/ValidPrimitiveExtensionPoints.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("validates ValidPrimitiveExtensionPath", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/ValidPrimitiveExtensionPath.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("validates ValidPrimitiveExtensionSurface", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/ValidPrimitiveExtensionSurface.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("validates ValidPrimitiveExtensionVolume", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/ValidPrimitiveExtensionVolume.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("validates ValidComplexExample", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/maxarNonvisualGeometry/ValidComplexExample.gltf"
    );
    expect(result.length).toEqual(0);
  });
});
