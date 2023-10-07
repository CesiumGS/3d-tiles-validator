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

describe("EXT_structural_metadata extension validation", function () {
  it("detects issues in ExtensionInMeshPrimitiveWithoutTopLevelObject", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/ExtensionInMeshPrimitiveWithoutTopLevelObject.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_GLTF_STRUCTURE");
  });

  it("detects issues in PropertyAttributesClassPropertyArray", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesClassPropertyArray.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_METADATA_PROPERTY_TYPE");
  });

  it("detects issues in PropertyAttributesClassPropertyInvalidComponentType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesClassPropertyInvalidComponentType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_METADATA_PROPERTY_TYPE");
  });

  it("detects issues in PropertyAttributesClassPropertyInvalidEnumValueType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesClassPropertyInvalidEnumValueType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_METADATA_PROPERTY_TYPE");
  });

  it("detects issues in PropertyAttributesClassPropertyMaxNotInRange", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesClassPropertyMaxNotInRange.gltf"
    );
    expect(result.length).toEqual(4);
    for (let i = 0; i < result.length; i++) {
      expect(result.get(i).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    }
  });

  it("detects issues in PropertyAttributesClassPropertyMinNotInRange", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesClassPropertyMinNotInRange.gltf"
    );
    expect(result.length).toEqual(4);
    for (let i = 0; i < result.length; i++) {
      expect(result.get(i).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    }
  });

  it("detects issues in PropertyAttributesClassPropertyString", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesClassPropertyString.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_METADATA_PROPERTY_TYPE");
  });

  it("detects issues in PropertyAttributesMeshPrimitivePropertyAttributesInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesMeshPrimitivePropertyAttributesInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in PropertyAttributesMeshPrimitivePropertyAttributesInvalidElementValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesMeshPrimitivePropertyAttributesInvalidElementValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in PropertyAttributesMeshPrimitivePropertyAttributesInvalidLength", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesMeshPrimitivePropertyAttributesInvalidLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in PropertyAttributesMeshPrimitivePropertyAttributesInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesMeshPrimitivePropertyAttributesInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in PropertyAttributesPropertyAttributePropertyInvalidAttribute", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesPropertyAttributePropertyInvalidAttribute.gltf"
    );
    expect(result.length).toEqual(3);
    for (let i = 0; i < result.length; i++) {
      expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
    }
  });

  it("detects issues in PropertyAttributesPropertyAttributePropertyMaxMismatch", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesPropertyAttributePropertyMaxMismatch.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
  });

  it("detects issues in PropertyAttributesPropertyAttributePropertyMaxNotInRange", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesPropertyAttributePropertyMaxNotInRange.gltf"
    );
    expect(result.length).toEqual(4);
    for (let i = 0; i < result.length; i++) {
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    }
  });

  it("detects issues in PropertyAttributesPropertyAttributePropertyMinMismatch", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesPropertyAttributePropertyMinMismatch.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
  });

  it("detects issues in PropertyAttributesPropertyAttributePropertyMinNotInRange", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyAttributesPropertyAttributePropertyMinNotInRange.gltf"
    );
    expect(result.length).toEqual(4);
    for (let i = 0; i < result.length; i++) {
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    }
  });

  it("detects issues in PropertyTextureClassPropertyMaxNotInRange", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTextureClassPropertyMaxNotInRange.gltf"
    );
    expect(result.length).toEqual(7);
    for (let i = 0; i < result.length; i++) {
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    }
  });

  it("detects issues in PropertyTextureClassPropertyMinNotInRange", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTextureClassPropertyMinNotInRange.gltf"
    );
    expect(result.length).toEqual(10);
    for (let i = 0; i < result.length; i++) {
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    }
  });

  it("detects issues in PropertyTextureClassPropertyWithOffsetScaleMinNotInRange", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTextureClassPropertyWithOffsetScaleMinNotInRange.gltf"
    );
    expect(result.length).toEqual(10);
    for (let i = 0; i < result.length; i++) {
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    }
  });

  it("detects issues in PropertyTextureEnumsInvalidEnumValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTextureEnumsInvalidEnumValue.gltf"
    );
    expect(result.length).toEqual(3);
    for (let i = 0; i < result.length; i++) {
      expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
    }
  });

  it("detects issues in PropertyTextureInvalidPropertyTypeA", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTextureInvalidPropertyTypeA.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_METADATA_PROPERTY_TYPE");
  });

  it("detects issues in PropertyTextureInvalidPropertyTypeB", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTextureInvalidPropertyTypeB.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("INVALID_METADATA_PROPERTY_TYPE");
  });

  it("detects issues in PropertyTextureMeshPrimitivePropertyTexturesInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTextureMeshPrimitivePropertyTexturesInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in PropertyTextureMeshPrimitivePropertyTexturesInvalidElementValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTextureMeshPrimitivePropertyTexturesInvalidElementValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in PropertyTextureMeshPrimitivePropertyTexturesInvalidLength", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTextureMeshPrimitivePropertyTexturesInvalidLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in PropertyTextureMeshPrimitivePropertyTexturesInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTextureMeshPrimitivePropertyTexturesInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in PropertyTextureMeshPrimitivePropertyTextureTexCoordInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTextureMeshPrimitivePropertyTextureTexCoordInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });

  it("detects issues in PropertyTexturePropertyIndexInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTexturePropertyIndexInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in PropertyTexturePropertyIndexInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTexturePropertyIndexInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in PropertyTexturePropertyTexturePropertyMaxMismatch", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTexturePropertyTexturePropertyMaxMismatch.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
  });

  it("detects issues in PropertyTexturePropertyTexturePropertyMaxNotInRange", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTexturePropertyTexturePropertyMaxNotInRange.gltf"
    );
    expect(result.length).toEqual(7);
    for (let i = 0; i < result.length; i++) {
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    }
  });

  it("detects issues in PropertyTexturePropertyTexturePropertyMinMismatch", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTexturePropertyTexturePropertyMinMismatch.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
  });

  it("detects issues in PropertyTexturePropertyTexturePropertyMinNotInRange", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/PropertyTexturePropertyTexturePropertyMinNotInRange.gltf"
    );
    expect(result.length).toEqual(10);
    for (let i = 0; i < result.length; i++) {
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    }
  });

  it("detects issues in StructuralMetadataMissingSchema", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/StructuralMetadataMissingSchema.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ANY_OF_ERROR");
  });

  it("detects issues in StructuralMetadataSchemaAndSchemaUri", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/StructuralMetadataSchemaAndSchemaUri.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ONE_OF_ERROR");
  });

  it("detects no issues in ValidMultipleClasses", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/ValidMultipleClasses.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in ValidPropertyAttributes", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/ValidPropertyAttributes.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in ValidPropertyTexture", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/ValidPropertyTexture.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in ValidPropertyTextureEnums", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/structuralMetadata/ValidPropertyTextureEnums.gltf"
    );
    expect(result.length).toEqual(0);
  });
});
