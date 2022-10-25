import { readJsonUnchecked } from "../../src/base/readJsonUnchecked";
import { ResourceResolvers } from "../../src/io/ResourceResolvers";

import { ValidationContext } from "../../src/validation/ValidationContext";

import { PropertyTableValidator } from "../../src/validation/metadata/PropertyTableValidator";

import { Schema } from "../../src/structure/Metadata/Schema";

describe("metadata/PropertyTableValidationSpec", function () {
  let fullMetadataSchema: Schema;
  let context: ValidationContext;

  beforeAll(async function () {
    fullMetadataSchema = await readJsonUnchecked(
      "specs/data/schemas/FullMetadataSchema.json"
    );
  });

  beforeEach(async function () {
    const directory = "specs/data/propertyTables/";
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);
    context = new ValidationContext(resourceResolver);
  });

  it("detects issues in propertiesInvalidType", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertiesInvalidType.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });
  it("detects issues in propertiesMinPropertiesMismatch", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertiesMinPropertiesMismatch.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("NUMBER_OF_PROPERTIES_MISMATCH");
  });
  it("detects issues in propertyArrayOffsetsInvalidType", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyArrayOffsetsInvalidType.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });
  it("detects issues in propertyArrayOffsetsInvalidValue", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyArrayOffsetsInvalidValue.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });
  it("detects issues in propertyArrayOffsetTypeInvalidType", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyArrayOffsetTypeInvalidType.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });
  it("detects issues in propertyArrayOffsetTypeInvalidValue", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyArrayOffsetTypeInvalidValue.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });
  it("detects issues in propertyClassInvalidType", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyClassInvalidType.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });
  it("detects issues in propertyClassInvalidValue", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyClassInvalidValue.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });
  it("detects issues in propertyCountInvalidType", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyCountInvalidType.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });
  it("detects issues in propertyCountInvalidValue", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyCountInvalidValue.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });
  it("detects issues in propertyIdInvalid", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyIdInvalid.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IDENTIFIER_NOT_FOUND");
  });
  it("detects issues in propertyStringOffsetsInvalidType", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyStringOffsetsInvalidType.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });
  it("detects issues in propertyStringOffsetsInvalidValue", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyStringOffsetsInvalidValue.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });
  it("detects issues in propertyStringOffsetTypeInvalidType", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyStringOffsetTypeInvalidType.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });
  it("detects issues in propertyStringOffsetTypeInvalidValue", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyStringOffsetTypeInvalidValue.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });
  it("detects issues in propertyStringWithoutStringOffsets", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyStringWithoutStringOffsets.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });
  it("detects issues in propertyValueMissing", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyValueMissing.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });
  it("detects issues in propertyValuesInvalidType", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyValuesInvalidType.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });
  it("detects issues in propertyVariableLengthArrayWithoutArrayOffsets", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertyVariableLengthArrayWithoutArrayOffsets.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const numBufferViews = 2;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      numBufferViews,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });
});
