import { ResourceResolvers } from "../../src/io/ResourceResolvers";

import { ValidationContext } from "../../src/validation/ValidationContext";
import { BinaryPropertyTableValidator } from "../../src/validation/metadata/BinaryPropertyTableValidator";

import { BinaryPropertyTable } from "../../src/binary/BinaryPropertyTable";
import { PropertyTableModels } from "../../src/binary/PropertyTableModels";

import { Schema } from "../../src/structure/Metadata/Schema";
import { ClassProperty } from "../../src/structure/Metadata/ClassProperty";

/**
 * Creates an unspecified valid default `BinaryPropertyTable`, containing
 * a single example_INT16_SCALAR property
 *
 * @returns The `BinaryPropertyTable`
 */
function createDefaultBinaryPropertyTable_example_INT16_SCALAR(): BinaryPropertyTable {
  const example_INT16_SCALAR: ClassProperty = {
    type: "SCALAR",
    componentType: "INT16",
  };
  const example_INT16_SCALAR_values = [-32768, 32767];

  const classProperty = example_INT16_SCALAR;
  const values = example_INT16_SCALAR_values;

  const testSchema: Schema = {
    id: "testSchemaId",
    classes: {
      testClass: {
        properties: {
          testProperty: classProperty,
        },
      },
    },
  };

  const arrayOffsetType = "UINT32";
  const stringOffsetType = "UINT32";
  const binaryPropertyTable = PropertyTableModels.createBinaryPropertyTable(
    testSchema,
    "testClass",
    "testProperty",
    values,
    arrayOffsetType,
    stringOffsetType
  );
  return binaryPropertyTable;
}

/**
 * Creates an unspecified valid default `BinaryPropertyTable`, containing
 * a single example_variable_length_INT16_SCALAR_array property
 *
 * @returns The `BinaryPropertyTable`
 */
function createDefaultBinaryPropertyTable_example_variable_length_INT16_SCALAR_array(): BinaryPropertyTable {
  const example_variable_length_INT16_SCALAR_array: ClassProperty = {
    type: "SCALAR",
    componentType: "INT16",
    array: true,
  };
  const example_variable_length_INT16_SCALAR_array_values = [
    [-32768, 32767],
    [-1, 0, 1],
  ];

  const classProperty = example_variable_length_INT16_SCALAR_array;
  const values = example_variable_length_INT16_SCALAR_array_values;

  const testSchema: Schema = {
    id: "testSchemaId",
    classes: {
      testClass: {
        properties: {
          testProperty: classProperty,
        },
      },
    },
  };

  const arrayOffsetType = "UINT32";
  const stringOffsetType = "UINT32";
  const binaryPropertyTable = PropertyTableModels.createBinaryPropertyTable(
    testSchema,
    "testClass",
    "testProperty",
    values,
    arrayOffsetType,
    stringOffsetType
  );
  return binaryPropertyTable;
}

/**
 * Creates an unspecified valid default `BinaryPropertyTable`, containing
 * a single example_STRING property
 *
 * @returns The `BinaryPropertyTable`
 */
function createDefaultBinaryPropertyTable_example_STRING(): BinaryPropertyTable {
  const example_STRING: ClassProperty = {
    type: "STRING",
  };
  const example_STRING_values = ["FirstString", "SecondString"];

  const classProperty = example_STRING;
  const values = example_STRING_values;

  const testSchema: Schema = {
    id: "testSchemaId",
    classes: {
      testClass: {
        properties: {
          testProperty: classProperty,
        },
      },
    },
  };

  const arrayOffsetType = "UINT32";
  const stringOffsetType = "UINT32";
  const binaryPropertyTable = PropertyTableModels.createBinaryPropertyTable(
    testSchema,
    "testClass",
    "testProperty",
    values,
    arrayOffsetType,
    stringOffsetType
  );
  return binaryPropertyTable;
}

// TODO Add the cases that should NOT report issues from the
// PropertyTableModelsSpec file (and think about how the
// redundancy could be reduced here...)
describe("metadata/BinaryPropertyTableValidationSpec", function () {
  //==========================================================================

  describe("issues for example_INT16_SCALAR", function () {
    let context: ValidationContext;

    beforeEach(async function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(resourceResolver);
    });

    it("should not report issues for a valid example_INT16_SCALAR", async function () {
      const binaryPropertyTable =
        createDefaultBinaryPropertyTable_example_INT16_SCALAR();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      expect(result.length).toEqual(0);
    });

    it("detects unaligned values byteOffset for example_INT16_SCALAR", async function () {
      const binaryPropertyTable =
        createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test: Assign a value to values
      // byteOffset to cause an invalid alignment
      const valuesBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"].values;
      binaryPropertyTable.binaryBufferStructure!.bufferViews![
        valuesBufferViewIndex
      ].byteOffset = 1;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      console.log(result.toJson()); // TODO DEBUG
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_ALIGNMENT");
    });
  });

  //==========================================================================

  describe("issues for example_variable_length_INT16_SCALAR_array", function () {
    let context: ValidationContext;

    beforeEach(async function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(resourceResolver);
    });

    it("detects unaligned arrayOffsets byteOffset for example_variable_length_INT16_SCALAR_array", async function () {
      const binaryPropertyTable =
        createDefaultBinaryPropertyTable_example_variable_length_INT16_SCALAR_array();

      // For the test: Assign a value to arrayOffsets
      // byteOffset to cause an invalid alignment
      const arrayOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .arrayOffsets!;
      binaryPropertyTable.binaryBufferStructure!.bufferViews![
        arrayOffsetsBufferViewIndex
      ].byteOffset = 5;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      console.log(result.toJson()); // TODO DEBUG
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_ALIGNMENT");
    });

    it("detects wrong arrayOffsets byteLength for example_variable_length_INT16_SCALAR_array", async function () {
      const binaryPropertyTable =
        createDefaultBinaryPropertyTable_example_variable_length_INT16_SCALAR_array();

      // For the test: Assign a value to arrayOffsets
      // byteLength to cause an invalid length
      const arrayOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .arrayOffsets!;
      binaryPropertyTable.binaryBufferStructure!.bufferViews![
        arrayOffsetsBufferViewIndex
      ].byteLength = 1234;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      console.log(result.toJson()); // TODO DEBUG
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_SIZE");
    });

    it("detects descending arrayOffsets for example_variable_length_INT16_SCALAR_array", async function () {
      const binaryPropertyTable =
        createDefaultBinaryPropertyTable_example_variable_length_INT16_SCALAR_array();

      // For the test: Write a value into the arrayOffsets
      // buffer, to make it descending
      const arrayOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .arrayOffsets!;
      const arrayOffsetsBufferViewData =
        binaryPropertyTable.binaryBufferData!.bufferViewsData![
          arrayOffsetsBufferViewIndex
        ];
      arrayOffsetsBufferViewData.writeInt32LE(12345, 4);

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      console.log(result.toJson()); // TODO DEBUG
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_OFFSETS");
    });
  });

  //==========================================================================

  describe("issues for example_STRING", function () {
    let context: ValidationContext;

    beforeEach(async function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(resourceResolver);
    });

    it("detects unaligned stringOffsets byteOffset for example_STRING", async function () {
      const binaryPropertyTable =
        createDefaultBinaryPropertyTable_example_STRING();

      // For the test: Assign a value to arrayOffsets
      // byteOffset to cause an invalid alignment
      const stringOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .stringOffsets!;
      binaryPropertyTable.binaryBufferStructure!.bufferViews![
        stringOffsetsBufferViewIndex
      ].byteOffset = 5;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      console.log(result.toJson()); // TODO DEBUG
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_ALIGNMENT");
    });
  });
});
