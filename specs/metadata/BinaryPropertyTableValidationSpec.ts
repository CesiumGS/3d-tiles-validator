import { ResourceResolvers } from "3d-tiles-tools";

import { ValidationContext } from "../../src/validation/ValidationContext";
import { BinaryPropertyTableValidator } from "../../src/validation/metadata/BinaryPropertyTableValidator";

import { PropertyTableTestUtilities } from "./PropertyTableTestUtilities";

// A flag to enable printing all `ValidationResult`
// instances to the console during the tests.
const debugLogResults = false;

describe("metadata/BinaryPropertyTableValidationSpec", function () {
  //==========================================================================
  //=== example_INT16_SCALAR test cases:
  // - no issues for valid input
  // - `values` not properly aligned due to wrong `byteOffset`
  // - `values` length invalid due to wrong `byteLength`

  describe("issues for example_INT16_SCALAR", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for a valid example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });

    it("detects unaligned values byteOffset for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test: Assign a value to values
      // byteOffset to cause an invalid alignment
      const valuesBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"].values;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      binaryMetadata.binaryBufferStructure!.bufferViews![
        valuesBufferViewIndex
      ].byteOffset = 1;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_ALIGNMENT");
    });

    it("detects invalid values byteLength for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test: Assign a value to values
      // byteLength to cause an invalid size
      const valuesBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"].values;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      binaryMetadata.binaryBufferStructure!.bufferViews![
        valuesBufferViewIndex
      ].byteLength = 12345;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_LENGTH");
    });
  });

  //==========================================================================
  //=== example_variable_length_INT16_SCALAR_array test cases:
  // - no issues for valid input
  // - `arrayOffsets` not properly aligned due to wrong `byteOffset`
  // - `arrayOffsets` length invalid due to wrong `byteLength`
  // - `arrayOffsets` contains descending values
  // - `arrayOffsets` contains values that are out of range for the `values`

  describe("issues for example_variable_length_INT16_SCALAR_array", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for a valid example_variable_length_INT16_SCALAR_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_variable_length_INT16_SCALAR_array();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });

    it("detects unaligned arrayOffsets byteOffset for example_variable_length_INT16_SCALAR_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_variable_length_INT16_SCALAR_array();

      // For the test: Assign a value to arrayOffsets
      // byteOffset to cause an invalid alignment
      const arrayOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .arrayOffsets!;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      binaryMetadata.binaryBufferStructure!.bufferViews![
        arrayOffsetsBufferViewIndex
      ].byteOffset = 5;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_ALIGNMENT");
    });

    it("detects wrong arrayOffsets byteLength for example_variable_length_INT16_SCALAR_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_variable_length_INT16_SCALAR_array();

      // For the test: Assign a value to arrayOffsets
      // byteLength to cause an invalid length
      const arrayOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .arrayOffsets!;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      binaryMetadata.binaryBufferStructure!.bufferViews![
        arrayOffsetsBufferViewIndex
      ].byteLength = 12345;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_LENGTH");
    });

    it("detects descending arrayOffsets for example_variable_length_INT16_SCALAR_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_variable_length_INT16_SCALAR_array();

      // For the test: Write a value into the arrayOffsets
      // buffer, to make it descending
      const arrayOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .arrayOffsets!;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      const arrayOffsetsBufferViewData =
        binaryMetadata.binaryBufferData!.bufferViewsData![
          arrayOffsetsBufferViewIndex
        ];
      arrayOffsetsBufferViewData.writeInt32LE(12345, 4);

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_OFFSETS");
    });

    it("detects arrayOffsets that are out of range for example_variable_length_INT16_SCALAR_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_variable_length_INT16_SCALAR_array();

      // For the test: Write values into the arrayOffsets
      // buffer so that the 'values' buffer is not long
      // enough to match the last array offsets entry
      const arrayOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .arrayOffsets!;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      const arrayOffsetsBufferViewData =
        binaryMetadata.binaryBufferData!.bufferViewsData![
          arrayOffsetsBufferViewIndex
        ];
      arrayOffsetsBufferViewData.writeInt32LE(0, 0);
      arrayOffsetsBufferViewData.writeInt32LE(123, 4);
      arrayOffsetsBufferViewData.writeInt32LE(12345, 8);

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_LENGTH");
    });
  });

  //==========================================================================
  //=== example_fixed_length_INT16_SCALAR_array test cases:
  // - no issues for valid input
  // - `values` length does not match in view of the `classProperty.count`

  describe("issues for example_fixed_length_INT16_SCALAR_array", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for a valid example_fixed_length_INT16_SCALAR_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_INT16_SCALAR_array();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });

    it("detects invalid values byteLength for example_fixed_length_INT16_SCALAR_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_INT16_SCALAR_array();

      // For the test: Assign a value to the 'count' of
      // the property, so that the length of the 'values'
      // buffer view does no longer match
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      binaryMetadata.metadataClass.properties!["testProperty"].count = 12345;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_LENGTH");
    });
  });

  //==========================================================================
  //=== example_BOOLEAN test cases:
  // - no issues for valid input
  // - `values` length does not match for `propertyTable.count`

  describe("issues for example_BOOLEAN", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for a valid example_BOOLEAN", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_BOOLEAN();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });

    it("should not report issues for valid values byteLength for example_BOOLEAN", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_BOOLEAN();

      // For the test: Assign a value to the 'count' of
      // the property table that JUST SO fits into one
      // byte (this should NOT cause an issue!)
      binaryPropertyTable.propertyTable.count = 8;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });

    it("detects invalid values byteLength for example_BOOLEAN", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_BOOLEAN();

      // For the test: Assign a value to the 'count' of
      // the property table, so that the length of the 'values'
      // buffer view does no longer match
      binaryPropertyTable.propertyTable.count = 9;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_LENGTH");
    });
  });

  //==========================================================================
  //=== example_variable_length_BOOLEAN_array test cases:
  // - no issues for valid input
  // - `values` length does not match for given `arrayOffsets`

  describe("issues for example_variable_length_BOOLEAN_array", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for a valid example_variable_length_BOOLEAN_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_variable_length_BOOLEAN_array();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });

    it("detects invalid values byteLength for example_variable_length_BOOLEAN_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_variable_length_BOOLEAN_array();

      // For the test: Write values into the arrayOffsets
      // buffer so that the 'values' buffer is not long
      // enough to match the last array offsets entry
      const arrayOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .arrayOffsets!;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      const arrayOffsetsBufferViewData =
        binaryMetadata.binaryBufferData!.bufferViewsData![
          arrayOffsetsBufferViewIndex
        ];
      arrayOffsetsBufferViewData.writeInt32LE(0, 0);
      arrayOffsetsBufferViewData.writeInt32LE(123, 4);
      arrayOffsetsBufferViewData.writeInt32LE(12345, 8);

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_LENGTH");
    });
  });

  //==========================================================================
  //=== example_fixed_length_BOOLEAN_array test cases:
  // - no issues for valid input
  // - `values` length does not match for given `arrayOffsets`

  describe("issues for example_fixed_length_BOOLEAN_array", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for a valid example_fixed_length_BOOLEAN_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_BOOLEAN_array();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });

    it("detects invalid values byteLength for example_fixed_length_BOOLEAN_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_BOOLEAN_array();

      // For the test: Assign a value to the 'count' of
      // the property, so that the length of the 'values'
      // buffer view does no longer match
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      binaryMetadata.metadataClass.properties!["testProperty"].count = 12345;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_LENGTH");
    });
  });

  //==========================================================================
  //=== example_STRING test cases
  // - no issues for valid input
  // - `stringOffsets` not properly aligned due to wrong `byteOffset`
  // - `stringOffsets` length invalid due to wrong `byteLength`
  // - `stringOffsets` contains descending values
  // - `stringOffsets` contains values that are out of range for the `values`

  describe("issues for example_STRING", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for a valid example_STRING", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_STRING();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });

    it("detects unaligned stringOffsets byteOffset for example_STRING", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_STRING();

      // For the test: Assign a value to stringOffsets
      // byteOffset to cause an invalid alignment
      const stringOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .stringOffsets!;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      binaryMetadata.binaryBufferStructure!.bufferViews![
        stringOffsetsBufferViewIndex
      ].byteOffset = 5;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_ALIGNMENT");
    });

    it("detects wrong stringOffsets byteLength for example_STRING", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_STRING();

      // For the test: Assign a value to stringOffsets
      // byteLength to cause an invalid length
      const stringOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .stringOffsets!;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      binaryMetadata.binaryBufferStructure!.bufferViews![
        stringOffsetsBufferViewIndex
      ].byteLength = 12345;

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_LENGTH");
    });

    it("detects descending stringOffsets for example_STRING", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_STRING();

      // For the test: Write a value into the stringOffsets
      // buffer, to make it descending
      const stringOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .stringOffsets!;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      const stringOffsetsBufferViewData =
        binaryMetadata.binaryBufferData!.bufferViewsData![
          stringOffsetsBufferViewIndex
        ];
      stringOffsetsBufferViewData.writeInt32LE(12345, 4);

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_OFFSETS");
    });

    it("detects stringOffsets that are out of range for example_STRING", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_STRING();

      // For the test: Write values into the stringOffsets
      // buffer so that the 'values' buffer is not long
      // enough to match the last string offsets entry
      const stringOffsetsBufferViewIndex =
        binaryPropertyTable.propertyTable.properties!["testProperty"]
          .stringOffsets!;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      const stringOffsetsBufferViewData =
        binaryMetadata.binaryBufferData!.bufferViewsData![
          stringOffsetsBufferViewIndex
        ];
      stringOffsetsBufferViewData.writeInt32LE(0, 0);
      stringOffsetsBufferViewData.writeInt32LE(123, 4);
      stringOffsetsBufferViewData.writeInt32LE(12345, 8);

      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(1);
      expect(result.get(0).type).toEqual("METADATA_INVALID_LENGTH");
    });
  });

  //==========================================================================
  //=== example_variable_length_STRING_array test cases
  // - no issues for valid input
  // (arrayOffsets issues are already covered with example_variable_length_INT16_SCALAR_array)
  // (stringOffsets issues are already covered with example_STRING)

  describe("issues for example_variable_length_STRING_array", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for a valid example_variable_length_STRING_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_variable_length_STRING_array();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });
  });

  //==========================================================================
  //=== example_fixed_length_STRING_array test cases
  // - no issues for valid input
  // (stringOffsets issues are already covered with example_STRING)

  describe("issues for example_fixed_length_STRING_array", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for a valid example_fixed_length_STRING_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_STRING_array();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });
  });

  //==========================================================================
  //=== example_FLOAT32_VEC2 test cases
  // - no issues for valid input

  describe("issues for example_FLOAT32_VEC2", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for a valid example_FLOAT32_VEC2", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_FLOAT32_VEC2();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });
  });

  //==========================================================================
  //=== example_variable_length_UINT32_VEC2_array test cases
  // - no issues for valid input
  // (arrayOffsets issues are already covered with example_variable_length_INT16_SCALAR_array)

  describe("issues for example_variable_length_UINT32_VEC2_array", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for a valid example_variable_length_UINT32_VEC2_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_variable_length_UINT32_VEC2_array();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });
  });

  //==========================================================================
  //=== example_fixed_length_UINT32_VEC2_array test cases
  // - no issues for valid input
  // (arrayOffsets issues are already covered with example_fixed_length_INT16_SCALAR_array)

  describe("issues for example_fixed_length_UINT32_VEC2_array", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for a valid example_fixed_length_UINT32_VEC2_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_UINT32_VEC2_array();
      BinaryPropertyTableValidator.validateBinaryPropertyTable(
        "test",
        binaryPropertyTable,
        context
      );
      const result = context.getResult();
      if (debugLogResults) {
        console.log(result.toJson());
      }
      expect(result.length).toEqual(0);
    });
  });
});
