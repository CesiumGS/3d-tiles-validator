import { Validators } from "../../src/validation/Validators";

describe("Tileset NGA_gpm extension validation", function () {
  it("detects issues in ngaGpmInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmInvalidType.json"
    );
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
    expect(result.get(1).type).toEqual("EXTENSION_USED_BUT_NOT_FOUND");
  });

  it("detects issues in ngaGpmMasterRecordMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmMasterRecordMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in ngaGpmMasterRecordInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmMasterRecordInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ngaGpmUnmodeledErrorRecordMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmUnmodeledErrorRecordMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in ngaGpmUnmodeledErrorRecordInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmUnmodeledErrorRecordInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ngaGpmInterpolationParamsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmInterpolationParamsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in ngaGpmInterpolationParamsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmInterpolationParamsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ngaGpmInterTileCorrelationGroupsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmInterTileCorrelationGroupsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in ngaGpmInterTileCorrelationGroupsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmInterTileCorrelationGroupsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ngaGpmInterTileCorrelationGroupsInvalidLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmInterTileCorrelationGroupsInvalidLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in ngaGpmInterTileCorrelationGroupsElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmInterTileCorrelationGroupsElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in ngaGpmThreeDimConformalParamsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmThreeDimConformalParamsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ngaGpmPpeManifestInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmPpeManifestInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ngaGpmAnchorPointMetadataInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ngaGpmAnchorPointMetadataInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in masterRecordVersionMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/masterRecordVersionMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in masterRecordVersionInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/masterRecordVersionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in masterRecordImplementationMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/masterRecordImplementationMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in masterRecordImplementationInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/masterRecordImplementationInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in masterRecordModelCoordSystemMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/masterRecordModelCoordSystemMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in masterRecordModelCoordSystemInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/masterRecordModelCoordSystemInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in masterRecordIdInformationMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/masterRecordIdInformationMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in masterRecordIdInformationInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/masterRecordIdInformationInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in masterRecordDatasetExtentInformationInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/masterRecordDatasetExtentInformationInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in masterRecordCollectionRecordListInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/masterRecordCollectionRecordListInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in masterRecordCollectionRecordListInvalidLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/masterRecordCollectionRecordListInvalidLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in masterRecordCollectionRecordListElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/masterRecordCollectionRecordListElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in modelCoordSystemMcsTypeMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in modelCoordSystemMcsTypeInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in modelCoordSystemMcsTypeInvalidValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in modelCoordSystemMcsTypeEcefCrsEcefMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeEcefCrsEcefMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in modelCoordSystemMcsTypeEcefCrsEcefInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeEcefCrsEcefInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in modelCoordSystemMcsTypeLsrAxisUnitVectorsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeLsrAxisUnitVectorsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in modelCoordSystemMcsTypeLsrAxisUnitVectorsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeLsrAxisUnitVectorsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in modelCoordSystemMcsTypeLsrOriginMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeLsrOriginMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in modelCoordSystemMcsTypeLsrOriginInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeLsrOriginInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in modelCoordSystemMcsTypeUtmCrsHorizontalUtmMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeUtmCrsHorizontalUtmMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in modelCoordSystemMcsTypeUtmCrsHorizontalUtmInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeUtmCrsHorizontalUtmInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in modelCoordSystemMcsTypeUtmCrsVerticalMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeUtmCrsVerticalMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in modelCoordSystemMcsTypeUtmCrsVerticalInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeUtmCrsVerticalInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in referenceSystemDefinitionMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceSystemDefinitionMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });

  it("detects issues in referenceSystemDescriptionInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceSystemDescriptionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in referenceSystemEpochInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceSystemEpochInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in referenceSystemEpochMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceSystemEpochMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });

  it("detects issues in referenceSystemNameInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceSystemNameInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in referenceSystemNameMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceSystemNameMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in referenceSystemOrgWithIdInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceSystemOrgWithIdInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in referenceSystemOrgWithIdMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceSystemOrgWithIdMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });

  it("detects issues in referenceSystemWithDefinitionAndEpoch", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceSystemWithDefinitionAndEpoch.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in referenceSystemWithDefinitionAndOrgWithId", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceSystemWithDefinitionAndOrgWithId.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in organizationSystemIdPairOrganizationInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/organizationSystemIdPairOrganizationInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in organizationSystemIdPairOrganizationMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/organizationSystemIdPairOrganizationMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in organizationSystemIdPairSystemIdInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/organizationSystemIdPairSystemIdInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in organizationSystemIdPairSystemIdMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/organizationSystemIdPairSystemIdMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in point3dInvalidLengthA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/point3dInvalidLengthA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in point3dInvalidLengthB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/point3dInvalidLengthB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in point3dElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/point3dElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in ppeManifestInvalidLengthA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ppeManifestInvalidLengthA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in ppeManifestInvalidLengthB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ppeManifestInvalidLengthB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in ppeManifestElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ppeManifestElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in ppeMetadataMaxInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ppeMetadataMaxInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeMetadataMinInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ppeMetadataMinInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeMetadataSourceMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ppeMetadataSourceMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in ppeMetadataSourceInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ppeMetadataSourceInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in rotationThetasInvalidLengthA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/rotationThetasInvalidLengthA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in rotationThetasInvalidLengthB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/rotationThetasInvalidLengthB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in rotationThetasElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/rotationThetasElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in sensorRecordCollectionUnitRecordsElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordCollectionUnitRecordsElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in sensorRecordCollectionUnitRecordsInvalidLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordCollectionUnitRecordsInvalidLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in sensorRecordCollectionUnitRecordsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordCollectionUnitRecordsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in sensorRecordCollectionUnitRecordsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordCollectionUnitRecordsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in sensorRecordSensorIdInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordSensorIdInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in sensorRecordSensorIdMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordSensorIdMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in sensorRecordSensorModeInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordSensorModeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in sensorRecordSensorModeMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordSensorModeMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in sensorRecordSensorTypeInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordSensorTypeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in sensorRecordSensorTypeMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordSensorTypeMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in spdcfAInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfAInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in spdcfAInvalidValueA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfAInvalidValueA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfAInvalidValueB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfAInvalidValueB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfAlphaInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfAlphaInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in spdcfAlphaInvalidValueA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfAlphaInvalidValueA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfAlphaInvalidValueB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfAlphaInvalidValueB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfAlphaMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfAlphaMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in spdcfAMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfAMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in spdcfBetaInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfBetaInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in spdcfBetaInvalidValueA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfBetaInvalidValueA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfBetaInvalidValueB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfBetaInvalidValueB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfBetaMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfBetaMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in spdcfTInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfTInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in spdcfTInvalidValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfTInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfTMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/spdcfTMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in threeDimConformalParamsCovarianceElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsCovarianceElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsCovarianceInvalidLengthFor4A", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsCovarianceInvalidLengthFor4A.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_INCONSISTENT");
  });

  it("detects issues in threeDimConformalParamsCovarianceInvalidLengthFor4B", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsCovarianceInvalidLengthFor4B.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_INCONSISTENT");
  });

  it("detects issues in threeDimConformalParamsCovarianceInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsCovarianceInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsCovarianceMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsCovarianceMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in threeDimConformalParamsFlagsElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsFlagsElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsFlagsInvalidLengthA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsFlagsInvalidLengthA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsFlagsInvalidLengthB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsFlagsInvalidLengthB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsFlagsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsFlagsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsFlagsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsFlagsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in threeDimConformalParamsNormalizingScaleFactorInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsNormalizingScaleFactorInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsNormalizingScaleFactorMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsNormalizingScaleFactorMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in threeDimConformalParamsParametersElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsParametersElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsParametersInvalidLengthFor4A", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsParametersInvalidLengthFor4A.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_INCONSISTENT");
  });

  it("detects issues in threeDimConformalParamsParametersInvalidLengthFor4B", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsParametersInvalidLengthFor4B.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_INCONSISTENT");
  });

  it("detects issues in threeDimConformalParamsParametersInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsParametersInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsParametersMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsParametersMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in threeDimConformalParamsRecenteringElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsRecenteringElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsRecenteringInvalidLengthA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsRecenteringInvalidLengthA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsRecenteringInvalidLengthB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsRecenteringInvalidLengthB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsRecenteringInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsRecenteringInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in threeDimConformalParamsRecenteringMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsRecenteringMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in threeDimConformalParamsFlagsInvalidValues", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/threeDimConformalParamsFlagsInvalidValues.json"
    );
    expect(result.length).toEqual(3);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(1).type).toEqual("ARRAY_LENGTH_MISMATCH");
    expect(result.get(2).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in unitVectorInvalidLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unitVectorInvalidLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in unitVectorInvalidElementValueA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unitVectorInvalidElementValueA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in unitVectorInvalidElementValueB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unitVectorInvalidElementValueB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in unmodeledErrorCorrParamsInvalidElementType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorCorrParamsInvalidElementType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in unmodeledErrorCorrParamsInvalidLengthA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorCorrParamsInvalidLengthA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in unmodeledErrorCorrParamsInvalidLengthB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorCorrParamsInvalidLengthB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in unmodeledErrorCorrParamsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorCorrParamsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in unmodeledErrorCorrParamsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorCorrParamsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in unmodeledErrorCorrRotationThetasInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorCorrRotationThetasInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in unmodeledErrorCorrRotationThetasMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorCorrRotationThetasMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in unmodeledErrorPostsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorPostsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in unmodeledErrorPostsElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorPostsElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in unmodeledErrorPostsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorPostsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in unmodeledErrorUniqueIdInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorUniqueIdInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in unmodeledErrorUniqueIdMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorUniqueIdMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in unmodeledErrorPostCovarianceMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorPostCovarianceMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in unmodeledErrorPostCovarianceInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorPostCovarianceInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in unmodeledErrorPostPositionInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorPostPositionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in unmodeledErrorPostPositionMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unmodeledErrorPostPositionMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in covarUpperTriangleElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/covarUpperTriangleElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in covarUpperTriangleInvalidLengthA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/covarUpperTriangleInvalidLengthA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in interpolationParamsDampeningParamInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/interpolationParamsDampeningParamInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in interpolationParamsDampeningParamMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/interpolationParamsDampeningParamMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in interpolationParamsInterpNumPostsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/interpolationParamsInterpNumPostsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in interpolationParamsInterpNumPostsInvalidValueA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/interpolationParamsInterpNumPostsInvalidValueA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in interpolationParamsInterpNumPostsInvalidValueB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/interpolationParamsInterpNumPostsInvalidValueB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in interpolationParamsInterpNumPostsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/interpolationParamsInterpNumPostsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in interpolationParamsInterpolationModeInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/interpolationParamsInterpolationModeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in interpolationParamsInterpolationModeInvalidValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/interpolationParamsInterpolationModeInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in interpolationParamsInterpolationModeMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/interpolationParamsInterpolationModeMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in interpolationParamsInterpolationModeNearestNeighborWithDampeningParam", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/interpolationParamsInterpolationModeNearestNeighborWithDampeningParam.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in interpolationParamsInterpolationModeNearestNeighborWithInterpNumPoints", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/interpolationParamsInterpolationModeNearestNeighborWithInterpNumPoints.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in collectionRecordCollectionIdInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionRecordCollectionIdInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in collectionRecordCollectionIdMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionRecordCollectionIdMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in collectionRecordPlatformIdInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionRecordPlatformIdInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in collectionRecordPlatformIdMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionRecordPlatformIdMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in collectionRecordSensorRecordsElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionRecordSensorRecordsElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in collectionRecordSensorRecordsInvalidLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionRecordSensorRecordsInvalidLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in collectionRecordSensorRecordsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionRecordSensorRecordsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in collectionRecordSensorRecordsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionRecordSensorRecordsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in sensorRecordCollectionUnitRecordsElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordCollectionUnitRecordsElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in sensorRecordCollectionUnitRecordsInvalidLength", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordCollectionUnitRecordsInvalidLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in sensorRecordCollectionUnitRecordsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordCollectionUnitRecordsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in sensorRecordCollectionUnitRecordsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordCollectionUnitRecordsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in sensorRecordSensorIdInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordSensorIdInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in sensorRecordSensorIdMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordSensorIdMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in sensorRecordSensorModeInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordSensorModeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in sensorRecordsSensorModeMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordsSensorModeMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in sensorRecordsSensorTypeInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordsSensorTypeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in sensorRecordsSensorTypeMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/sensorRecordsSensorTypeMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in collectionUnitRecordCollectionUnitIdInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionUnitRecordCollectionUnitIdInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in collectionUnitRecordCollectionUnitIdMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionUnitRecordCollectionUnitIdMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in collectionUnitRecordExtentInformationInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionUnitRecordExtentInformationInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in collectionUnitRecordExtentInformationMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionUnitRecordExtentInformationMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in collectionUnitRecordPointSourceIdInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionUnitRecordPointSourceIdInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in collectionUnitRecordPointSourceIdInvalidValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionUnitRecordPointSourceIdInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in collectionUnitRecordPointSourceIdMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionUnitRecordPointSourceIdMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in collectionUnitRecordReferenceDateTimeInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionUnitRecordReferenceDateTimeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in collectionUnitRecordReferenceDateTimeMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/collectionUnitRecordReferenceDateTimeMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in extentInformationLsrAxisUnitVectorsElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/extentInformationLsrAxisUnitVectorsElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in extentInformationLsrAxisUnitVectorsInvalidLengthA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/extentInformationLsrAxisUnitVectorsInvalidLengthA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in extentInformationLsrAxisUnitVectorsInvalidLengthB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/extentInformationLsrAxisUnitVectorsInvalidLengthB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in extentInformationLsrAxisUnitVectorsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/extentInformationLsrAxisUnitVectorsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in extentInformationLsrAxisUnitVectorsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/extentInformationLsrAxisUnitVectorsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in extentInformationLsrLengthsElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/extentInformationLsrLengthsElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in extentInformationLsrLengthsInvalidLengthA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/extentInformationLsrLengthsInvalidLengthA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in extentInformationLsrLengthsInvalidLengthB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/extentInformationLsrLengthsInvalidLengthB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in extentInformationLsrLengthsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/extentInformationLsrLengthsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in extentInformationLsrLengthsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/extentInformationLsrLengthsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in extentInformationOriginInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/extentInformationOriginInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in extentInformationOriginMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/extentInformationOriginMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in idInformationDatasetIdInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/idInformationDatasetIdInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in idInformationDatasetIdMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/idInformationDatasetIdMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in idInformationReferenceDateTimeInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/idInformationReferenceDateTimeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in idInformationReferenceDateTimeMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/idInformationReferenceDateTimeMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in correlationGroupGroupFlagsElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/correlationGroupGroupFlagsElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in correlationGroupGroupFlagsInvalidLengthA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/correlationGroupGroupFlagsInvalidLengthA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in correlationGroupGroupFlagsInvalidLengthB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/correlationGroupGroupFlagsInvalidLengthB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in correlationGroupGroupFlagsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/correlationGroupGroupFlagsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in correlationGroupGroupsGroupFlagsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/correlationGroupGroupsGroupFlagsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in correlationGroupGroupsParamsInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/correlationGroupGroupsParamsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in correlationGroupGroupsParamsMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/correlationGroupGroupsParamsMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in correlationGroupParamsElementInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/correlationGroupParamsElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in correlationGroupParamsInvalidLengthA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/correlationGroupParamsInvalidLengthA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in correlationGroupParamsInvalidLengthB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/correlationGroupParamsInvalidLengthB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in correlationGroupRotationThetasInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/correlationGroupRotationThetasInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in correlationGroupRotationThetasMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/correlationGroupRotationThetasMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in anchorPointMetadataContentIndexInvalidType", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/anchorPointMetadataContentIndexInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in anchorPointMetadataContentIndexInvalidValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/anchorPointMetadataContentIndexInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in anchorPointMetadataContentIndexMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/anchorPointMetadataContentIndexMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in anchorPointMetadataPlacementTypeInvalidValue", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/anchorPointMetadataPlacementTypeInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in anchorPointMetadataPlacementTypeMeshContentWithContentIndex", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/anchorPointMetadataPlacementTypeMeshContentWithContentIndex.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in anchorPointMetadataPlacementTypeMissing", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/anchorPointMetadataPlacementTypeMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in lsrAxisUnitVectorsNotOrthogonalA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/lsrAxisUnitVectorsNotOrthogonalA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VECTORS_NOT_ORTHOGONAL");
  });

  it("detects issues in lsrAxisUnitVectorsNotOrthogonalB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/lsrAxisUnitVectorsNotOrthogonalB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VECTORS_NOT_ORTHOGONAL");
  });

  it("detects issues in lsrAxisUnitVectorsNotOrthogonalC", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/lsrAxisUnitVectorsNotOrthogonalC.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VECTORS_NOT_ORTHOGONAL");
  });

  it("detects issues in ppeMetadataSourceValuesNotUnique", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/ppeMetadataSourceValuesNotUnique.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "PER_POINT_ERROR_SOURCE_VALUES_NOT_UNIQUE"
    );
  });

  it("detects issues in referenceDateTimeNotIso8601A", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceDateTimeNotIso8601A.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_VALUE_INVALID");
  });

  it("detects issues in referenceDateTimeNotIso8601B", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceDateTimeNotIso8601B.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_VALUE_INVALID");
  });

  it("detects issues in referenceDateTimeNotIso8601C", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceDateTimeNotIso8601C.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_VALUE_INVALID");
  });

  it("detects issues in referenceDateTimeNotIso8601D", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/referenceDateTimeNotIso8601D.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_VALUE_INVALID");
  });

  it("detects issues in unitVectorNotUnitLengthA", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unitVectorNotUnitLengthA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VECTOR_NOT_UNIT_LENGTH");
  });

  it("detects issues in unitVectorNotUnitLengthB", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/unitVectorNotUnitLengthB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VECTOR_NOT_UNIT_LENGTH");
  });

  it("detects issues in modelCoordSystemMcsTypeEcefWithAxisUnitVectors", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeEcefWithAxisUnitVectors.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in modelCoordSystemMcsTypeEcefWithCrsHorizontalUtm", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeEcefWithCrsHorizontalUtm.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in modelCoordSystemMcsTypeEcefWithCrsVertical", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeEcefWithCrsVertical.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in modelCoordSystemMcsTypeEcefWithOrigin", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeEcefWithOrigin.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in modelCoordSystemMcsTypeLsrWithCrsEcef", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeLsrWithCrsEcef.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in modelCoordSystemMcsTypeLsrWithCrsHorizontalUtm", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeLsrWithCrsHorizontalUtm.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in modelCoordSystemMcsTypeLsrWithCrsVertical", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeLsrWithCrsVertical.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in modelCoordSystemMcsTypeUtmWithAxisUnitVectors", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeUtmWithAxisUnitVectors.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in modelCoordSystemMcsTypeUtmWithCrsEcef", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeUtmWithCrsEcef.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in modelCoordSystemMcsTypeUtmWithOrigin", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/gpm/modelCoordSystemMcsTypeUtmWithOrigin.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });
});
