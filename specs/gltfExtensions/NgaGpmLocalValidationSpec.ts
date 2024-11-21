import { validateGltf } from "./validateGltf";

describe("NGA_gpm_local extension validation", function () {
  it("detects issues in anchorPointDirectAdjustmentParamsInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointDirectAdjustmentParamsInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in anchorPointDirectAdjustmentParamsInvalidLength", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointDirectAdjustmentParamsInvalidLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in anchorPointDirectAdjustmentParamsInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointDirectAdjustmentParamsInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in anchorPointDirectAdjustmentParamsMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointDirectAdjustmentParamsMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in anchorPointDirectPositionInvalidLength", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointDirectPositionInvalidLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in anchorPointDirectPositionInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointDirectPositionInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in anchorPointDirectPositionMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointDirectPositionMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in anchorPointIndirectAdjustmentParamsInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointIndirectAdjustmentParamsInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in anchorPointIndirectAdjustmentParamsInvalidLength", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointIndirectAdjustmentParamsInvalidLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in anchorPointIndirectAdjustmentParamsInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointIndirectAdjustmentParamsInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in anchorPointIndirectAdjustmentParamsMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointIndirectAdjustmentParamsMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in anchorPointIndirectCovarianceInvalidLength", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointIndirectCovarianceInvalidLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in anchorPointIndirectCovarianceMatrixInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointIndirectCovarianceMatrixInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in anchorPointIndirectCovarianceMatrixInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointIndirectCovarianceMatrixInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in anchorPointIndirectCovarianceMatrixMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointIndirectCovarianceMatrixMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in anchorPointIndirectPositionInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointIndirectPositionInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in anchorPointIndirectPositionInvalidLength", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointIndirectPositionInvalidLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in anchorPointIndirectPositionInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointIndirectPositionInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in anchorPointIndirectPositionMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointIndirectPositionMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in anchorPointsDirectInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointsDirectInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in anchorPointsDirectInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointsDirectInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in anchorPointsIndirectInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointsIndirectInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in anchorPointsIndirectInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/anchorPointsIndirectInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in correlationGroupGroupFlagsElementInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/correlationGroupGroupFlagsElementInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in correlationGroupGroupFlagsInvalidLength", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/correlationGroupGroupFlagsInvalidLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in correlationGroupGroupFlagsInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/correlationGroupGroupFlagsInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in correlationGroupGroupFlagsMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/correlationGroupGroupFlagsMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in correlationGroupParamsInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/correlationGroupParamsInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in correlationGroupParamsInvalidLength", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/correlationGroupParamsInvalidLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in correlationGroupParamsInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/correlationGroupParamsInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in correlationGroupParamsMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/correlationGroupParamsMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in correlationGroupRotationThetasInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/correlationGroupRotationThetasInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in correlationGroupRotationThetasInvalidLength", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/correlationGroupRotationThetasInvalidLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in correlationGroupRotationThetasInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/correlationGroupRotationThetasInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in correlationGroupRotationThetasMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/correlationGroupRotationThetasMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in directAnchorPointsDirectMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/directAnchorPointsDirectMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });

  it("detects issues in directCovarianceDirectUpperTriangleMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/directCovarianceDirectUpperTriangleMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });

  it("detects issues in directWithAnchorPointsIndirect", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/directWithAnchorPointsIndirect.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in directWithIntraTileCorrelationGroups", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/directWithIntraTileCorrelationGroups.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in indirectAnchorPointsIndirectMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/indirectAnchorPointsIndirectMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });

  it("detects issues in indirectIntraTileCorrelationGroupsMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/indirectIntraTileCorrelationGroupsMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });

  it("detects issues in indirectWithAnchorPointsDirect", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/indirectWithAnchorPointsDirect.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in indirectWithCovarianceDirectUpperTriangle", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/indirectWithCovarianceDirectUpperTriangle.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("DISALLOWED_VALUE_FOUND");
  });

  it("detects issues in intraTileCorrelationGroupsInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/intraTileCorrelationGroupsInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in intraTileCorrelationGroupsInvalidLength", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/intraTileCorrelationGroupsInvalidLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in intraTileCorrelationGroupsInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/intraTileCorrelationGroupsInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeMetadataMaxInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeMetadataMaxInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeMetadataMinInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeMetadataMinInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeMetadataSourceInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeMetadataSourceInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in ppeMetadataSourceInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeMetadataSourceInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in ppeTextureIndexInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTextureIndexInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeTextureIndexInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTextureIndexInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeTextureNoDataInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTextureNoDataInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeTextureNoDataInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTextureNoDataInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeTextureOffsetInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTextureOffsetInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeTextureScaleInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTextureScaleInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeTexturesInvalidElementType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTexturesInvalidElementType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in ppeTexturesInvalidLength", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTexturesInvalidLength.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in ppeTexturesInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTexturesInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeTextureTexCoordInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTextureTexCoordInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeTextureTexCoordInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTextureTexCoordInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });

  it("detects issues in ppeTextureTraitsInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTextureTraitsInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in ppeTextureTraitsMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ppeTextureTraitsMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in spdcfAInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfAInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in spdcfAInvalidValueA", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfAInvalidValueA.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfAInvalidValueB", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfAInvalidValueB.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfAlphaInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfAlphaInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in spdcfAlphaInvalidValueA", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfAlphaInvalidValueA.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfAlphaInvalidValueB", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfAlphaInvalidValueB.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfAlphaMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfAlphaMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in spdcfAMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfAMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in spdcfBetaInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfBetaInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in spdcfBetaInvalidValueA", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfBetaInvalidValueA.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfBetaInvalidValueB", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfBetaInvalidValueB.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfBetaMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfBetaMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in spdcfTInvalidType", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfTInvalidType.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in spdcfTInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfTInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in spdcfTMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/spdcfTMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in storageTypeInvalidValue", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/storageTypeInvalidValue.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in storageTypeMissing", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/storageTypeMissing.gltf"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects no issues in ValidGltfGpmLocal", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ValidGltfGpmLocal.gltf"
    );
    expect(result.length).toEqual(0);
  });

  it("detects no issues in ValidMeshPrimitiveGpmLocal", async function () {
    const result = await validateGltf(
      "./specs/data/gltfExtensions/gpmLocal/ValidMeshPrimitiveGpmLocal.gltf"
    );
    expect(result.length).toEqual(0);
  });
});
