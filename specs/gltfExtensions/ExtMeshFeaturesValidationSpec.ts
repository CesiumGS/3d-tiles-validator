import fs from "fs";
import path from "path";

import { ResourceResolvers } from "3d-tiles-tools";

import { ValidationContext } from "../../src/validation/ValidationContext";

import { GltfExtensionValidators } from "../../src/validation/gltfExtensions/GltfExtensionValidators";

async function validateGltf(gltfFileName: string) {
  fs.readFileSync(gltfFileName);

  const directory = path.dirname(gltfFileName);
  const fileName = path.basename(gltfFileName);
  const resourceResolver =
    ResourceResolvers.createFileResourceResolver(directory);
  const context = new ValidationContext(directory, resourceResolver);
  const gltfFileData = await resourceResolver.resolveData(fileName);
  if (gltfFileData) {
    await GltfExtensionValidators.validateGltfExtensions(
      gltfFileName,
      gltfFileData,
      context
    );
  }
  const validationResult = context.getResult();
  return validationResult;
}

describe("EXT_mesh_features extension validation", function () {
  it("detects issues in FeatureIdAttributeAccessorNormalized", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdAttributeAccessorNormalized.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("detects issues in FeatureIdAttributeAccessorNotScalar", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdAttributeAccessorNotScalar.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("detects issues in FeatureIdAttributeAttributeInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdAttributeAttributeInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in FeatureIdAttributeAttributeInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdAttributeAttributeInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });

  it("detects issues in FeatureIdAttributeFeatureCountInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdAttributeFeatureCountInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in FeatureIdAttributeFeatureCountInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdAttributeFeatureCountInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in FeatureIdAttributeFeatureCountMismatch", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdAttributeFeatureCountMismatch.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("FEATURE_COUNT_MISMATCH");
  });

  it("detects issues in FeatureIdAttributeFeatureCountMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdAttributeFeatureCountMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in FeatureIdAttributeLabelInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdAttributeLabelInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in FeatureIdAttributeLabelInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdAttributeLabelInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_PATTERN_MISMATCH");
  });

  it("detects issues in FeatureIdAttributeNullFeatureIdInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdAttributeNullFeatureIdInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in FeatureIdAttributeNullFeatureIdInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdAttributeNullFeatureIdInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in FeatureIdTextureFeatureCountMismatch", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdTextureFeatureCountMismatch.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("FEATURE_COUNT_MISMATCH");
  });

  it("detects issues in FeatureIdTextureSamplerInvalidFilterMode", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdTextureSamplerInvalidFilterMode.gltf"
    );
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
    expect(result.get(1).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in FeatureIdTextureTextureChannelsInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdTextureTextureChannelsInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in FeatureIdTextureTextureChannelsInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdTextureTextureChannelsInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in FeatureIdTextureTextureChannelsTooManyChannels", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdTextureTextureChannelsTooManyChannels.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TEXTURE_CHANNELS_OUT_OF_RANGE");
  });

  it("detects issues in FeatureIdTextureTextureChannelsTooManyElements", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdTextureTextureChannelsTooManyElements.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TEXTURE_CHANNELS_OUT_OF_RANGE");
  });

  it("detects issues in FeatureIdTextureTextureImageDataInvalid", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdTextureTextureImageDataInvalid.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IO_ERROR");
  });

  it("detects issues in FeatureIdTextureTextureIndexInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdTextureTextureIndexInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in FeatureIdTextureTextureIndexInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdTextureTextureIndexInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in FeatureIdTextureTextureInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdTextureTextureInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in FeatureIdTextureTextureTexCoordInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdTextureTextureTexCoordInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in FeatureIdTextureTextureTexCoordInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/FeatureIdTextureTextureTexCoordInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });

  it("detects no issues in ValidFeatureIdAttribute", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/ValidFeatureIdAttribute.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in ValidFeatureIdAttributeWithByteStride", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/ValidFeatureIdAttributeWithByteStride.glb"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in ValidFeatureIdTexture (GLB)", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/ValidFeatureIdTexture.glb"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in ValidFeatureIdTexture", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/ValidFeatureIdTexture.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in ValidFeatureIdTextureUsingDefaultChannels", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/ValidFeatureIdTextureUsingDefaultChannels.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in ValidFeatureIdAttributeDefault", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/meshFeatures/ValidFeatureIdAttributeDefault/ValidFeatureIdAttributeDefault.gltf"
    );
    // TODO THE SPECS SHOULD NEVER-EVER ANTICIPATE AN INTERNAL_ERROR!!!
    // This test should either be omitted, or handled differently.
    // See https://github.com/donmccurdy/glTF-Transform/issues/1099
    // and the corresponding notes in `GltfExtensionValidators.ts`!
    console.error(
      "Anticipating INTERNAL_ERROR for ValidFeatureIdAttributeDefault"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INTERNAL_ERROR");
  });
});
