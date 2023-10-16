import { Validators } from "../src/validation/Validators";

describe("Tileset validation", function () {
  it("detects issues in assetTilesetVersionInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/assetTilesetVersionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in assetVersionInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/assetVersionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in assetVersionMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/assetVersionMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });
  it("detects issues in assetVersionUnknown", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/assetVersionUnknown.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ASSET_VERSION_UNKNOWN");
  });
  it("detects issues in boundingVolumeBoxArrayInvalidElementType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/boundingVolumeBoxArrayInvalidElementType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });
  it("detects issues in boundingVolumeBoxInvalidArrayLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/boundingVolumeBoxInvalidArrayLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });
  it("detects issues in boundingVolumeMissingProperty", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/boundingVolumeMissingProperty.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ANY_OF_ERROR");
  });
  it("detects issues in boundingVolumeRegionArrayElementsOutOfRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/boundingVolumeRegionArrayElementsOutOfRange.json"
    );
    expect(result.length).toEqual(6);
    expect(result.get(0).type).toEqual("BOUNDING_VOLUME_INVALID");
    expect(result.get(1).type).toEqual("BOUNDING_VOLUME_INVALID");
    expect(result.get(2).type).toEqual("BOUNDING_VOLUME_INVALID");
    expect(result.get(3).type).toEqual("BOUNDING_VOLUME_INVALID");
    expect(result.get(4).type).toEqual("BOUNDING_VOLUME_INVALID");
    expect(result.get(5).type).toEqual("BOUNDING_VOLUME_INVALID");
  });

  it("detects issues in boundingVolumeRegionArrayInvalidElementType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/boundingVolumeRegionArrayInvalidElementType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });
  it("detects issues in boundingVolumeRegionInvalidArrayLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/boundingVolumeRegionInvalidArrayLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });
  it("detects issues in boundingVolumeSphereArrayElementOutOfRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/boundingVolumeSphereArrayElementOutOfRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("BOUNDING_VOLUME_INVALID");
  });

  it("detects issues in boundingVolumeSphereArrayInvalidElementType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/boundingVolumeSphereArrayInvalidElementType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in boundingVolumeSphereInvalidArrayLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/boundingVolumeSphereInvalidArrayLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in groupClassIdInvalid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/groupClassIdInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });

  it("detects issues in groupClassIdInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/groupClassIdInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in groupWithoutSchema", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/groupWithoutSchema.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });

  it("detects issues in implicitTilingAvailableLevelsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingAvailableLevelsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in implicitTilingAvailableLevelsInvalidValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingAvailableLevelsInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in implicitTilingContentsUriTemplateVariableInvalid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingContentsUriTemplateVariableInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TEMPLATE_URI_INVALID_VARIABLE_NAME");
  });
  it("detects issues in implicitTilingContentUriTemplateVariableInvalid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingContentUriTemplateVariableInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TEMPLATE_URI_INVALID_VARIABLE_NAME");
  });

  it("detects issues in implicitTilingInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });
  it("detects issues in implicitTilingRootWithChildren", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingRootWithChildren.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TILE_IMPLICIT_ROOT_INVALID");
  });

  it("detects issues in implicitTilingRootWithContentBoundingVolume", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingRootWithContentBoundingVolume.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TILE_IMPLICIT_ROOT_INVALID");
  });

  it("detects issues in implicitTilingRootWithMetadata", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingRootWithMetadata.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TILE_IMPLICIT_ROOT_INVALID");
  });

  it("detects issues in implicitTilingSubdivisionSchemeInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingSubdivisionSchemeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });
  it("detects issues in implicitTilingSubdivisionSchemeInvalidValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingSubdivisionSchemeInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in implicitTilingSubtreeLevelsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingSubtreeLevelsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in implicitTilingSubtreeLevelsInvalidValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingSubtreeLevelsInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in implicitTilingSubtreesInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingSubtreesInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in implicitTilingSubtreesUriInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingSubtreesUriInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });
  it("detects issues in implicitTilingSubtreesUriMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingSubtreesUriMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in implicitTilingSubtreesUriTemplateVariableInvalid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingSubtreesUriTemplateVariableInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TEMPLATE_URI_INVALID_VARIABLE_NAME");
  });

  it("detects issues in implicitTilingSubtreesUriTemplateVariableMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingSubtreesUriTemplateVariableMissing.json"
    );
    // Expect the IMPLICIT_TILING_ERROR here, because the file
    // for the template URI for the test cannot be resolved
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("TEMPLATE_URI_MISSING_VARIABLE_NAME");
  });

  it("detects issues in implicitTilingValid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingValid.json"
    );
    // Expect the TILE_IMPLICIT_ROOT_INVALID here, because the file
    // for the template URI for the test cannot be resolved
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TILE_IMPLICIT_ROOT_INVALID");
  });

  it("detects issues in implicitTilingWithBoundingSphere", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/implicitTilingWithBoundingSphere.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TILE_IMPLICIT_ROOT_INVALID");
  });

  it("detects issues in invalidJson", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/invalidJson.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("JSON_PARSE_ERROR");
  });

  it("detects issues in propertiesInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/propertiesInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in propertiesMaximumInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/propertiesMaximumInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in propertiesMaximumMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/propertiesMaximumMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in propertiesMinimumInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/propertiesMinimumInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in propertiesMinimumLargerThanMaximum", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/propertiesMinimumLargerThanMaximum.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "PROPERTIES_MINIMUM_LARGER_THAN_MAXIMUM"
    );
  });

  it("detects issues in propertiesMinimumMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/propertiesMinimumMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in statisticsClassesIdInvalid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/statisticsClassesIdInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });

  it("detects issues in statisticsClassesInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/statisticsClassesInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in statisticsClassesMinPropertiesMismatch", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/statisticsClassesMinPropertiesMismatch.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("NUMBER_OF_PROPERTIES_MISMATCH");
  });

  it("detects issues in statisticsClassesPropertiesMinPropertiesMismatch", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/statisticsClassesPropertiesMinPropertiesMismatch.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("NUMBER_OF_PROPERTIES_MISMATCH");
  });

  it("detects issues in statisticsClassesPropertiesPropertyNameInvalid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/statisticsClassesPropertiesPropertyNameInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });

  it("detects issues in statisticsClassesValueInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/statisticsClassesValueInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in statisticsClassesWithoutSchema", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/statisticsClassesWithoutSchema.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });

  it("detects issues in tileContentBoundingVolumeInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileContentBoundingVolumeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in tileContentBoundingVolumeNotInTileBoundingVolume", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileContentBoundingVolumeNotInTileBoundingVolume.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("BOUNDING_VOLUMES_INCONSISTENT");
  });

  it("detects issues in tileContentGroupInvalidIndex", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileContentGroupInvalidIndex.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });

  it("detects issues in tileContentGroupInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileContentGroupInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in tileContentGroupNegativeIndex", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileContentGroupNegativeIndex.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tileContentGroupWithoutTilesetGroups", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileContentGroupWithoutTilesetGroups.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });

  it("detects issues in tileContentInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileContentInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in tileContentsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileContentsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in tileGeometricErrorMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileGeometricErrorMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in tileGeometricErrorNegative", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileGeometricErrorNegative.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tileGeometricErrorNotSmallerThanParentGeometricError", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileGeometricErrorNotSmallerThanParentGeometricError.json"
    );
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("TILE_GEOMETRIC_ERRORS_INCONSISTENT");
    expect(result.get(1).type).toEqual("TILE_GEOMETRIC_ERRORS_INCONSISTENT");
  });

  it("detects issues in tileInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in tileMetadataClassInvalid", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileMetadataClassInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });

  it("detects issues in tileMetadataClassInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileMetadataClassInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in tileMetadataClassMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileMetadataClassMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in tileMetadataScalarValueNotInRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileMetadataScalarValueNotInRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tileMetadataVec3ElementValueNotInRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileMetadataVec3ElementValueNotInRange.json"
    );
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(1).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tileMetadataVec3ArrayElementValueNotInRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileMetadataVec3ArrayElementValueNotInRange.json"
    );
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(1).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tileMetadataRequiredPropertyMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileMetadataRequiredPropertyMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_REQUIRED_BUT_MISSING");
  });

  it("detects issues in tileMetadataRequiredPropertyNull", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileMetadataRequiredPropertyNull.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_REQUIRED_BUT_MISSING");
  });

  it("detects issues in tileMetadataWithoutSchema", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileMetadataWithoutSchema.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });

  it("detects issues in tileRefineInvalidValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileRefineInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in tileRefineWrongCase", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileRefineWrongCase.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TILE_REFINE_WRONG_CASE");
  });

  it("detects issues in tileRefineWrongType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileRefineWrongType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in tilesetAssetMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetAssetMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in tilesetGeometricErrorMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetGeometricErrorMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in tilesetGeometricErrorNegative", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetGeometricErrorNegative.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tilesetMetadataEntityPropertyEnumInvalidValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetMetadataEntityPropertyEnumInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_ENUM_VALUE_NAME_NOT_FOUND"
    );
  });

  it("detects issues in tilesetMetadataEntityPropertyMaxNotInRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetMetadataEntityPropertyMaxNotInRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tilesetMetadataEntityPropertyMaxWithNormalizedNotInRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetMetadataEntityPropertyMaxWithNormalizedNotInRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tilesetMetadataEntityPropertyMaxWithOffsetNotInRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetMetadataEntityPropertyMaxWithOffsetNotInRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tilesetMetadataEntityPropertyMaxWithScaleNotInRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetMetadataEntityPropertyMaxWithScaleNotInRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tilesetMetadataEntityPropertyMinNotInRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetMetadataEntityPropertyMinNotInRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tilesetMetadataEntityPropertyMinWithNormalizedNotInRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetMetadataEntityPropertyMinWithNormalizedNotInRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tilesetMetadataEntityPropertyMinWithOffsetNotInRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetMetadataEntityPropertyMinWithOffsetNotInRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tilesetMetadataEntityPropertyMinWithScaleNotInRange", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetMetadataEntityPropertyMinWithScaleNotInRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
  });

  it("detects issues in tilesetSchemaUriInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetSchemaUriInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in tilesetWithSchemaAndSchemaUri", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetWithSchemaAndSchemaUri.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ONE_OF_ERROR");
  });

  it("detects issues in tilesetWithUnicodeBOM", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetWithUnicodeBOM.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IO_ERROR");
  });

  it("detects issues in tileTransformInvalidArrayElementType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileTransformInvalidArrayElementType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in tileTransformInvalidArrayLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileTransformInvalidArrayLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in tileTransformInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileTransformInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects no issues in tileTransformNonInvertible", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileTransformNonInvertible.json"
    );
    // The matrix is not invertible, but it is affine.
    // So this should not cause an issue.
    expect(result.length).toEqual(0);
  });

  it("detects issues in tileTransformNotAffine", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileTransformNotAffine.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TRANSFORM_INVALID");
  });

  it("detects issues in tileWithContentAndContents", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tileWithContentAndContents.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ONE_OF_ERROR");
  });

  it("detects no issues in validTileset", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTileset.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in validTilesetWithExternalValidTilesetWithValidB3dmWithInvalidGlb", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithExternalValidTilesetWithValidB3dmWithInvalidGlb.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("EXTERNAL_TILESET_VALIDATION_ERROR");
  });

  it("detects issues in validTilesetWithGlbWithErrors", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithGlbWithErrors.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_ERROR");
  });

  it("detects issues in validTilesetWithGltfWithErrors", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithGltfWithErrors.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_ERROR");
  });

  it("detects issues in validTilesetWithGltfWithWarnings", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithGltfWithWarnings.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_WARNING");
  });

  it("detects issues in validTilesetWithInvalidB3dm", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithInvalidB3dm.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_ERROR");
  });

  it("detects issues in validTilesetWithInvalidSchemaFromUri", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithInvalidSchemaFromUri.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects no issues in validTilesetWithSchema", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithSchema.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in validTilesetWithUnresolvableSchemaUri", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithUnresolvableSchemaUri.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IO_ERROR");
  });

  it("detects no issues in validTilesetWithValidB3dm", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithValidB3dm.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in validTilesetWithValidCmptWithGlbInfo", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithValidCmptWithGlbInfo.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_INFO");
  });

  it("detects no issues in validTilesetWithInvalidI3dm", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithInvalidI3dm.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_ERROR");
  });

  it("detects no issues in validTilesetWithInvalidPnts", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithInvalidPnts.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_ERROR");
  });

  it("detects issues in validTilesetWithValidB3dmWithInvalidGlb", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithValidB3dmWithInvalidGlb.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_ERROR");
  });

  it("detects no issues in validTilesetWithValidGltf", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithValidGltf.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in validTilesetWithValidSchemaFromUri", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithValidSchemaFromUri.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in extensionFoundButNotUsed", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionFoundButNotUsed.json"
    );
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("EXTENSION_NOT_SUPPORTED");
    expect(result.get(1).type).toEqual("EXTENSION_FOUND_BUT_NOT_USED");
  });

  it("detects issues in extensionNotDeclared_1_0_glTF", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionNotDeclared_1_0_glTF.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("EXTENSION_FOUND_BUT_NOT_USED");
  });

  it("detects issues in extensionNotNecessary_1_1_glTF", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionNotNecessary_1_1_glTF.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in extensionRequiredButNotUsed", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionRequiredButNotUsed.json"
    );
    expect(result.length).toEqual(3);
    expect(result.get(0).type).toEqual("EXTENSION_NOT_SUPPORTED");
    expect(result.get(1).type).toEqual("EXTENSION_NOT_SUPPORTED");
    expect(result.get(2).type).toEqual("EXTENSION_REQUIRED_BUT_NOT_USED");
  });

  it("detects issues in extensionsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in extensionsRequiredDuplicateElement", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionsRequiredDuplicateElement.json"
    );
    expect(result.length).toEqual(3);
    expect(result.get(0).type).toEqual("EXTENSION_NOT_SUPPORTED");
    expect(result.get(1).type).toEqual("EXTENSION_NOT_SUPPORTED");
    expect(result.get(2).type).toEqual("ARRAY_ELEMENT_NOT_UNIQUE");
  });

  it("detects issues in extensionsRequiredInvalidArrayLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionsRequiredInvalidArrayLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in extensionsRequiredInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionsRequiredInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in extensionsUsedDuplicateElement", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionsUsedDuplicateElement.json"
    );
    expect(result.length).toEqual(3);
    expect(result.get(0).type).toEqual("EXTENSION_NOT_SUPPORTED");
    expect(result.get(1).type).toEqual("EXTENSION_NOT_SUPPORTED");
    expect(result.get(2).type).toEqual("ARRAY_ELEMENT_NOT_UNIQUE");
  });

  it("detects issues in extensionsUsedInvalidArrayLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionsUsedInvalidArrayLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in extensionsUsedInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionsUsedInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in extensionsValueInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionsValueInvalidType.json"
    );
    expect(result.length).toEqual(3);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
    expect(result.get(1).type).toEqual("EXTENSION_NOT_SUPPORTED");
    expect(result.get(2).type).toEqual("EXTENSION_USED_BUT_NOT_FOUND");
  });

  it("detects issues in extensionUsedButNotFound", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extensionUsedButNotFound.json"
    );
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("EXTENSION_NOT_SUPPORTED");
    expect(result.get(1).type).toEqual("EXTENSION_USED_BUT_NOT_FOUND");
  });

  it("detects issues in extrasUnexpectedType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/extrasUnexpectedType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_UNEXPECTED");
  });

  it("detects issues in validTilesetWithIB3dmWithInvalidAlignment", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/validTilesetWithIB3dmWithInvalidAlignment.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_ERROR");
  });

  it("detects issues in tilesetWithCycleA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetWithCycleA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("EXTERNAL_TILESET_VALIDATION_ERROR");
  });

  it("detects no issues in tilesetWithMultipleExternal", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tilesetWithMultipleExternal.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in tilesets/tiles/i3dm/i3dmWithUri/tileset.json", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/tilesets/tiles/i3dm/i3dmWithUri/tileset.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_WARNING");
  });
});
