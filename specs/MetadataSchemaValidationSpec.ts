import { Validators } from "../src/validation/Validators";

describe("Metadata schema validation", function () {
  it("detects issues in schemaClassDescriptionInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassDescriptionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassesInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassesInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassesNameInvalid", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassesNameInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_PATTERN_MISMATCH");
  });

  it("detects issues in schemaClassNameInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassNameInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertiesDuplicateSemantics", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertiesDuplicateSemantics.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTIES_DUPLICATE_SEMANTIC");
  });

  it("detects issues in schemaClassPropertiesEmpty", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertiesEmpty.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("NUMBER_OF_PROPERTIES_MISMATCH");
  });

  it("detects issues in schemaClassPropertiesNameInvalid", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertiesNameInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_PATTERN_MISMATCH");
  });

  it("detects issues in schemaClassPropertyArrayInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyArrayInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyComponentTypeForTypeWithoutComponents", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyComponentTypeForTypeWithoutComponents.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_COMPONENT_TYPE_WITH_INVALID_TYPE"
    );
  });

  it("detects issues in schemaClassPropertyComponentTypeInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyComponentTypeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyComponentTypeInvalidValue", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyComponentTypeInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in schemaClassPropertyCountInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyCountInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyCountInvalidValue", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyCountInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in schemaClassPropertyCountWithoutArray", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyCountWithoutArray.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_COUNT_FOR_NON_ARRAY");
  });

  it("detects issues in schemaClassPropertyDefaultWithRequired", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyDefaultWithRequired.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_TYPE_ERROR");
  });

  it("detects issues in schemaClassPropertyDescriptionInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyDescriptionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyEnumTypeForNonEnumType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyEnumTypeForNonEnumType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_ENUMTYPE_WITH_NON_ENUM_TYPE"
    );
  });

  it("detects issues in schemaClassPropertyEnumTypeInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyEnumTypeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyEnumTypeMissingForEnumType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyEnumTypeMissingForEnumType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_ENUM_TYPE_WITHOUT_ENUMTYPE"
    );
  });

  it("detects issues in schemaClassPropertyEnumTypeNotFound", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyEnumTypeNotFound.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_ENUMTYPE_NOT_FOUND");
  });

  it("detects issues in schemaClassPropertyEnumTypeWithoutEnums", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyEnumTypeWithoutEnums.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_ENUMTYPE_NOT_FOUND");
  });

  it("detects issues in schemaClassPropertyMaxForNonNumericType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyMaxForNonNumericType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_MIN_MAX_FOR_NON_NUMERIC_TYPE"
    );
  });

  it("detects issues in schemaClassPropertyMinForNonNumericType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyMinForNonNumericType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_MIN_MAX_FOR_NON_NUMERIC_TYPE"
    );
  });

  it("detects issues in schemaClassPropertyNameInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyNameInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyNoDataForBoolean", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyNoDataForBoolean.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_TYPE_ERROR");
  });

  it("detects issues in schemaClassPropertyNoDataInvalidEnumValueName", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyNoDataInvalidEnumValueName.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_ENUM_VALUE_NOT_FOUND");
  });

  it("detects issues in schemaClassPropertyNoDataInvalidEnumValueNames", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyNoDataInvalidEnumValueNames.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_ENUM_VALUE_NOT_FOUND");
  });

  it("detects issues in schemaClassPropertyNoDataTypeMismatchA", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyNoDataTypeMismatchA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyNoDataTypeMismatchB", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyNoDataTypeMismatchB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in schemaClassPropertyNoDataTypeMismatchC", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyNoDataTypeMismatchC.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyNoDataWithRequired", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyNoDataWithRequired.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CLASS_PROPERTY_TYPE_ERROR");
  });

  it("detects issues in schemaClassPropertyNormalizedForNonIntegerComponentType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyNormalizedForNonIntegerComponentType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_NORMALIZED_FOR_NON_NORMALIZABLE_TYPE"
    );
  });

  it("detects issues in schemaClassPropertyNormalizedForUnnormalizableType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyNormalizedForUnnormalizableType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_NORMALIZED_FOR_NON_NORMALIZABLE_TYPE"
    );
  });

  it("detects issues in schemaClassPropertyNormalizedInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyNormalizedInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyOffsetForNonFloatingPointTypeA", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyOffsetForNonFloatingPointTypeA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE"
    );
  });

  it("detects issues in schemaClassPropertyOffsetForNonFloatingPointTypeB", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyOffsetForNonFloatingPointTypeB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE"
    );
  });

  it("detects issues in schemaClassPropertyOffsetTypeMismatchA", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyOffsetTypeMismatchA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyOffsetTypeMismatchB", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyOffsetTypeMismatchB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyOffsetTypeMismatchC", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyOffsetTypeMismatchC.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in schemaClassPropertyOffsetTypeMismatchD", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyOffsetTypeMismatchD.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyOffsetTypeMismatchE", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyOffsetTypeMismatchE.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in schemaClassPropertyOffsetTypeMismatchF", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyOffsetTypeMismatchF.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in schemaClassPropertyOffsetTypeMismatchG", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyOffsetTypeMismatchG.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in schemaClassPropertyRequiredInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyRequiredInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyScaleForNonFloatingPointType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyScaleForNonFloatingPointType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE"
    );
  });

  it("detects issues in schemaClassPropertyScaleForNonFloatingPointTypeB", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyScaleForNonFloatingPointTypeB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual(
      "CLASS_PROPERTY_OFFSET_SCALE_FOR_NON_FLOATING_POINT_TYPE"
    );
  });

  it("detects issues in schemaClassPropertyTypeInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyTypeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertyTypeInvalidValue", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyTypeInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in schemaClassPropertyTypeMissing", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertyTypeMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in schemaEnumDescriptionInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumDescriptionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaEnumNameInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumNameInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaEnumsInvalidName", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumsInvalidName.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_PATTERN_MISMATCH");
  });

  it("detects issues in schemaEnumsInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumsInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaEnumValueDescriptionInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumValueDescriptionInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaEnumValueNameInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumValueNameInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaEnumValuesDuplicateName", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumValuesDuplicateName.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ENUM_VALUE_DUPLICATE_NAME");
  });

  it("detects issues in schemaEnumValuesDuplicateValue", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumValuesDuplicateValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ENUM_VALUE_DUPLICATE_VALUE");
  });

  it("detects issues in schemaEnumValuesEmpty", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumValuesEmpty.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in schemaEnumValuesMissing", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumValuesMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in schemaEnumValueTypeInvalid", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumValueTypeInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in schemaEnumValueTypeInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumValueTypeInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaEnumValueTypeInvalidValue", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumValueTypeInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in schemaEnumValueValueInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumValueValueInvalidType.json"
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

  it("detects issues in schemaClassPropertySemanticArrayMismatchA", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertySemanticArrayMismatchA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SEMANTIC_INVALID");
  });

  it("detects issues in schemaClassPropertySemanticArrayMismatchB", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertySemanticArrayMismatchB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SEMANTIC_INVALID");
  });

  it("detects issues in schemaClassPropertySemanticComponentTypeMismatch", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertySemanticComponentTypeMismatch.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SEMANTIC_INVALID");
  });

  it("detects issues in schemaClassPropertySemanticCountMismatch", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertySemanticCountMismatch.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SEMANTIC_INVALID");
  });

  it("detects issues in schemaClassPropertySemanticInvalidType", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertySemanticInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in schemaClassPropertySemanticNormalizedMismatch", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertySemanticNormalizedMismatch.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SEMANTIC_INVALID");
  });

  it("detects issues in schemaClassPropertySemanticTypeMismatch", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertySemanticTypeMismatch.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SEMANTIC_INVALID");
  });

  it("detects issues in schemaClassPropertySemanticUnknown", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaClassPropertySemanticUnknown.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SEMANTIC_UNKNOWN");
  });

  it("detects issues in schemaEnumValueNotInValueTypeRange", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumValueNotInValueTypeRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in schemaEnumValueNotInDefaultValueTypeRange", async function () {
    const result = await Validators.validateSchemaFile(
      "specs/data/schemas/schemaEnumValueNotInDefaultValueTypeRange.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });
});
