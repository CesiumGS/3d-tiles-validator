import { Validators } from "../src/validation/Validators";

describe("Metadata schema validation", function () {
  it("detects issues in metadataClassDescriptionInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassDescriptionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassesInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassesInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassesNameInvalid", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassesNameInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_PATTERN_MISMATCH");
  });

  it("detects issues in metadataClassNameInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassNameInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertiesDuplicateSemantics", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertiesDuplicateSemantics.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTIES_DUPLICATE_SEMANTIC");
  });

  it("detects issues in metadataClassPropertiesEmpty", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertiesEmpty.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("NUMBER_OF_PROPERTIES_MISMATCH");
  });

  it("detects issues in metadataClassPropertiesNameInvalid", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertiesNameInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_PATTERN_MISMATCH");
  });

  it("detects issues in metadataClassPropertyArrayInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyArrayInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyComponentTypeForTypeWithoutComponents", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyComponentTypeForTypeWithoutComponents.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_COMPONENT_TYPE_FOR_NON_NUMERIC_TYPE"
    );
  });

  it("detects issues in metadataClassPropertyComponentTypeMissing", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyComponentTypeMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_COMPONENT_TYPE_MISSING");
  });

  it("detects issues in metadataClassPropertyComponentTypeInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyComponentTypeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyComponentTypeInvalidValue", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyComponentTypeInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in metadataClassPropertyCountInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyCountInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyCountInvalidValue", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyCountInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in metadataClassPropertyCountWithoutArray", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyCountWithoutArray.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_COUNT_FOR_NON_ARRAY");
  });

  it("detects issues in metadataClassPropertyDefaultWithRequired", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyDefaultWithRequired.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_INCONSISTENT");
  });

  it("detects issues in metadataClassPropertyDescriptionInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyDescriptionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyEnumTypeForNonEnumType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyEnumTypeForNonEnumType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_ENUMTYPE_WITH_NON_ENUM_TYPE"
    );
  });

  it("detects issues in metadataClassPropertyEnumTypeInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyEnumTypeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyEnumTypeMissingForEnumType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyEnumTypeMissingForEnumType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_ENUM_TYPE_WITHOUT_ENUMTYPE"
    );
  });

  it("detects issues in metadataClassPropertyEnumTypeNotFound", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyEnumTypeNotFound.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_ENUMTYPE_NOT_FOUND");
  });

  it("detects issues in metadataClassPropertyEnumTypeWithoutEnums", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyEnumTypeWithoutEnums.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_ENUMTYPE_NOT_FOUND");
  });

  it("detects issues in metadataClassPropertyMaxForNonNumericType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyMaxForNonNumericType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_MIN_MAX_FOR_NON_NUMERIC_TYPE");
  });

  it("detects issues in metadataClassPropertyMinForNonNumericType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyMinForNonNumericType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_MIN_MAX_FOR_NON_NUMERIC_TYPE");
  });

  it("detects issues in metadataClassPropertyMinForVariableLengthArray", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyMinForVariableLengthArray.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "METADATA_PROPERTY_INVALID_FOR_VARIABLE_LENGTH_ARRAY"
    );
  });

  it("detects issues in metadataClassPropertyNameInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyNameInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyNoDataForBoolean", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyNoDataForBoolean.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_INCONSISTENT");
  });

  it("detects issues in metadataClassPropertyNoDataInvalidEnumValueName", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyNoDataInvalidEnumValueName.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_ENUM_VALUE_NAME_NOT_FOUND"
    );
  });

  it("detects issues in metadataClassPropertyNoDataInvalidEnumValueNames", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyNoDataInvalidEnumValueNames.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_ENUM_VALUE_NAME_NOT_FOUND"
    );
  });

  it("detects issues in metadataClassPropertyNoDataTypeMismatchA", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyNoDataTypeMismatchA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyNoDataTypeMismatchB", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyNoDataTypeMismatchB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in metadataClassPropertyNoDataTypeMismatchC", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyNoDataTypeMismatchC.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyNoDataWithRequired", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyNoDataWithRequired.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_INCONSISTENT");
  });

  it("detects issues in metadataClassPropertyNormalizedForNonIntegerComponentType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyNormalizedForNonIntegerComponentType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_NORMALIZED_FOR_NON_NORMALIZABLE_TYPE"
    );
  });

  it("detects issues in metadataClassPropertyNormalizedForUnnormalizableType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyNormalizedForUnnormalizableType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_NORMALIZED_FOR_NON_NORMALIZABLE_TYPE"
    );
  });

  it("detects issues in metadataClassPropertyNormalizedInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyNormalizedInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyOffsetForNonFloatingPointTypeA", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyOffsetForNonFloatingPointTypeA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "METADATA_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE"
    );
  });

  it("detects issues in metadataClassPropertyOffsetForNonFloatingPointTypeB", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyOffsetForNonFloatingPointTypeB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "METADATA_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE"
    );
  });

  it("detects issues in metadataClassPropertyOffsetForVariableLengthArray", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyOffsetForVariableLengthArray.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "METADATA_PROPERTY_INVALID_FOR_VARIABLE_LENGTH_ARRAY"
    );
  });

  it("detects issues in metadataClassPropertyOffsetTypeMismatchA", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyOffsetTypeMismatchA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyOffsetTypeMismatchB", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyOffsetTypeMismatchB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyOffsetTypeMismatchC", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyOffsetTypeMismatchC.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in metadataClassPropertyOffsetTypeMismatchD", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyOffsetTypeMismatchD.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyOffsetTypeMismatchE", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyOffsetTypeMismatchE.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in metadataClassPropertyOffsetTypeMismatchF", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyOffsetTypeMismatchF.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in metadataClassPropertyOffsetTypeMismatchG", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyOffsetTypeMismatchG.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in metadataClassPropertyRequiredInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyRequiredInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyScaleForNonFloatingPointType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyScaleForNonFloatingPointType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "METADATA_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE"
    );
  });

  it("detects issues in metadataClassPropertyScaleForNonFloatingPointTypeB", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyScaleForNonFloatingPointTypeB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "METADATA_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE"
    );
  });

  it("detects issues in metadataClassPropertyTypeInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyTypeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertyTypeInvalidValue", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyTypeInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in metadataClassPropertyTypeMissing", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertyTypeMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in metadataEnumDescriptionInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumDescriptionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataEnumNameInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumNameInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataEnumsInvalidName", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumsInvalidName.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_PATTERN_MISMATCH");
  });

  it("detects issues in metadataEnumsInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataEnumValueDescriptionInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumValueDescriptionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataEnumValueNameInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumValueNameInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataEnumValuesDuplicateName", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumValuesDuplicateName.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ENUM_VALUE_DUPLICATE_NAME");
  });

  it("detects issues in metadataEnumValuesDuplicateValue", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumValuesDuplicateValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ENUM_VALUE_DUPLICATE_VALUE");
  });

  it("detects issues in metadataEnumValuesEmpty", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumValuesEmpty.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in metadataEnumValuesMissing", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumValuesMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in metadataEnumValueTypeInvalid", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumValueTypeInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in metadataEnumValueTypeInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumValueTypeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataEnumValueTypeInvalidValue", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumValueTypeInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in metadataEnumValueValueInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumValueValueInvalidType.json"
    );
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
    expect(result.get(1).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaIdInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaIdInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_PATTERN_MISMATCH");
  });

  it("detects issues in schemaIdInvalidValue", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaIdInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_PATTERN_MISMATCH");
  });

  it("detects issues in schemaIdMissing", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaIdMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects no issues in validSchema", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/validSchema.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in metadataClassPropertySemanticArrayMismatchA", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertySemanticArrayMismatchA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_SEMANTIC_INVALID");
  });

  it("detects issues in metadataClassPropertySemanticArrayMismatchB", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertySemanticArrayMismatchB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_SEMANTIC_INVALID");
  });

  it("detects issues in metadataClassPropertySemanticComponentTypeMismatch", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertySemanticComponentTypeMismatch.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_SEMANTIC_INVALID");
  });

  it("detects issues in metadataClassPropertySemanticCountMismatch", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertySemanticCountMismatch.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_SEMANTIC_INVALID");
  });

  it("detects issues in metadataClassPropertySemanticInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertySemanticInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in metadataClassPropertySemanticNormalizedMismatch", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertySemanticNormalizedMismatch.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_SEMANTIC_INVALID");
  });

  it("detects issues in metadataClassPropertySemanticTypeMismatch", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertySemanticTypeMismatch.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_SEMANTIC_INVALID");
  });

  it("detects issues in metadataClassPropertySemanticUnknown", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataClassPropertySemanticUnknown.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("METADATA_SEMANTIC_UNKNOWN");
  });

  it("detects issues in metadataEnumValueNotInValueTypeRange", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumValueNotInValueTypeRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in metadataEnumValueNotInDefaultValueTypeRange", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/metadataEnumValueNotInDefaultValueTypeRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });
});
