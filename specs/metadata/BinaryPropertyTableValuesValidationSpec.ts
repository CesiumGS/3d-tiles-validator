import { ResourceResolvers } from "3d-tiles-tools";

import { ValidationContext } from "../../src/validation/ValidationContext";
import { BinaryPropertyTableValidator } from "../../src/validation/metadata/BinaryPropertyTableValidator";

import { PropertyTableTestUtilities } from "./PropertyTableTestUtilities";
import { BinaryPropertyTable } from "3d-tiles-tools";

// A flag to enable printing all `ValidationResult`
// instances to the console during the tests.
const debugLogResults = false;

// A function for preparing a property table with the
// example_INT16_SCALAR for the tests, by filling it
// with the values 10 and 12
function prepareTest_example_INT16_SCALAR(
  binaryPropertyTable: BinaryPropertyTable
) {
  const propertyTableProperty =
    binaryPropertyTable.propertyTable.properties!["testProperty"];
  const valuesBufferViewIndex = propertyTableProperty.values;
  const binaryMetadata = binaryPropertyTable.binaryMetadata;
  const valuesBufferViewData =
    binaryMetadata.binaryBufferData!.bufferViewsData![valuesBufferViewIndex];
  valuesBufferViewData.writeInt16LE(10, 0);
  valuesBufferViewData.writeInt16LE(12, 2);
}

// A function to set the offset/scale of the class property for the tests
function setClassPropertyOffsetScale(
  binaryPropertyTable: BinaryPropertyTable,
  offset: any,
  scale: any
) {
  const binaryMetadata = binaryPropertyTable.binaryMetadata;
  const classProperty =
    binaryMetadata.metadataClass.properties!["testProperty"];
  classProperty.offset = offset;
  classProperty.scale = scale;
}

// A function to set the offset/scale of the property table property for the tests
function setPropertyTablePropertyOffsetScale(
  binaryPropertyTable: BinaryPropertyTable,
  offset: any,
  scale: any
) {
  const propertyTableProperty =
    binaryPropertyTable.propertyTable.properties!["testProperty"];
  propertyTableProperty.offset = offset;
  propertyTableProperty.scale = scale;
}

// A function to set the min/max of the class property for the tests
function setClassPropertyMinMax(
  binaryPropertyTable: BinaryPropertyTable,
  min: any,
  max: any
) {
  const binaryMetadata = binaryPropertyTable.binaryMetadata;
  const classProperty =
    binaryMetadata.metadataClass.properties!["testProperty"];
  classProperty.min = min;
  classProperty.max = max;
}

// A function to set the min/max of the property table property for the tests
function setPropertyTablePropertyMinMax(
  binaryPropertyTable: BinaryPropertyTable,
  min: any,
  max: any
) {
  const propertyTableProperty =
    binaryPropertyTable.propertyTable.properties!["testProperty"];
  propertyTableProperty.min = min;
  propertyTableProperty.max = max;
}

describe("metadata/BinaryPropertyTableValuesValidationSpec", function () {
  //==========================================================================
  //=== example_ENUM_with_noData test cases:
  // - no issues for valid input
  // - no issues for values that are the 'noData' value
  describe("issues for example_ENUM_with_noData", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for values that are valid for example_ENUM with a noData value", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_ENUM_with_noData();

      // For the test:
      // Write a value into the 'values' buffer that
      // matches the 'noData' value of the example
      const propertyTableProperty =
        binaryPropertyTable.propertyTable.properties!["testProperty"];
      const valuesBufferViewIndex = propertyTableProperty.values;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      const valuesBufferViewData =
        binaryMetadata.binaryBufferData!.bufferViewsData![
          valuesBufferViewIndex
        ];
      valuesBufferViewData.writeUInt16LE(9999, 2);

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
  //=== example_variable_length_ENUM_array test cases:
  // - no issues for valid input
  describe("issues for example_variable_length_ENUM_array", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for values that are valid for example_variable_length_ENUM_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_variable_length_ENUM_array();

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

    it("detects values that are not valid enum values for example_variable_length_ENUM_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_variable_length_ENUM_array();

      // For the test:
      // Write a value into the 'values' buffer that
      // does not represent a valid enum value
      const propertyTableProperty =
        binaryPropertyTable.propertyTable.properties!["testProperty"];
      const valuesBufferViewIndex = propertyTableProperty.values;
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      const valuesBufferViewData =
        binaryMetadata.binaryBufferData!.bufferViewsData![
          valuesBufferViewIndex
        ];
      valuesBufferViewData.writeUInt16LE(12345, 2);

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
      expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
    });
  });

  //==========================================================================
  //=== example_INT16_SCALAR test cases:
  // - no issues for valid input
  // - values out of range for 'min' and 'max' in classProperty
  //   and in propertyTableProperty
  // - computed values do not match the 'min' or 'max'
  //   of the propertyTableProperty

  //
  //
  //
  //
  //
  //=== example_INT16_SCALAR test cases without offset or scale:
  //
  //
  //
  //
  //
  describe("issues for example_INT16_SCALAR (without offset or scale)", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for values that are valid for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property min/max to 10/12
      // - Set the property table property min/max to 10/12
      // This should NOT cause any issues!
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyMinMax(binaryPropertyTable, 10, 12);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 10, 12);

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

    it("detects values smaller than the class property minimum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property minimum to 11
      // This should cause an issue for 10 being smaller than 11
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyMinMax(binaryPropertyTable, 11, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values greater than the class property maximum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set class property maximum to 11
      // This should cause an issue for 12 being greater than 11
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyMinMax(binaryPropertyTable, undefined, 11);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values smaller than the property table property minimum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property minimum to 11
      // This should cause an issue for 10 being smaller than 11
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 11, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values greater than the property table property maximum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property maximum to 11
      // This should cause an issue for 12 being greater than 11
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyMinMax(binaryPropertyTable, undefined, 11);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects when the property table property minimum does not match the computed minimum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property minimum to 9
      // This should cause an issue for the computed minimum
      // of 10 not matching the property table property minimum of 9
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 9, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
    });

    it("detects when the property table property maximum does not match the computed maximum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property minimum to 13
      // This should cause an issue for the computed maximum
      // of 12 not matching the property table property maximum of 13
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyMinMax(binaryPropertyTable, undefined, 13);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
    });
  });

  //
  //
  //
  //
  //
  //=== example_INT16_SCALAR test cases with offset in class property:
  //
  //
  //
  //
  //

  describe("issues for example_INT16_SCALAR with offset in class property", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for values with offset in class property that are valid for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set the class property min/max to 110/112
      // - Set the property table property min/max to 110/112
      // This should NOT cause any issues!
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setClassPropertyMinMax(binaryPropertyTable, 110, 112);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 110, 112);

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

    it("detects values with offset in class property smaller than the class property minimum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set the class property minimum to 111
      // This should cause an issue for 110 being smaller than 111
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setClassPropertyMinMax(binaryPropertyTable, 111, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values with offset in class property greater than the class property maximum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set class property maximum to 111
      // This should cause an issue for 112 being greater than 111
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setClassPropertyMinMax(binaryPropertyTable, undefined, 111);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values with offset in class property smaller than the property table property minimum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set the property table property minimum to 111
      // This should cause an issue for 110 being smaller than 111
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 111, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values with offset in class property greater than the property table property maximum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set the property table property maximum to 111
      // This should cause an issue for 112 being greater than 111
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setPropertyTablePropertyMinMax(binaryPropertyTable, undefined, 111);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects when the property table property minimum does not match the computed minimum with offset in class property for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set the property table property minimum to 109
      // This should cause an issue for the computed minimum
      // of 10 not matching the property table property minimum of 109
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 109, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
    });

    it("detects when the property table property maximum does not match the computed maximum with offset in class property for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set the property table property minimum to 113
      // This should cause an issue for the computed maximum
      // of 112 not matching the property table property maximum of 113
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setPropertyTablePropertyMinMax(binaryPropertyTable, undefined, 113);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
    });
  });

  //
  //
  //
  //
  //
  //=== example_INT16_SCALAR test cases with offset in property table property:
  //
  //
  //
  //
  //

  describe("issues for example_INT16_SCALAR with offset in property table property", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for values with offset in property table property that are valid for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property offset to 100
      // - Set the class property min/max to 110/112
      // - Set the property table property min/max to 110/112
      // This should NOT cause any issues!
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setClassPropertyMinMax(binaryPropertyTable, 110, 112);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 110, 112);

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

    it("detects values with offset in property table property smaller than the class property minimum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property offset to 100
      // - Set the class property minimum to 111
      // This should cause an issue for 110 being smaller than 111
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setClassPropertyMinMax(binaryPropertyTable, 111, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values with offset in property table property greater than the class property maximum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property offset to 100
      // - Set class property maximum to 111
      // This should cause an issue for 112 being greater than 111
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setClassPropertyMinMax(binaryPropertyTable, undefined, 111);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values with offset in property table property smaller than the property table property minimum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property offset to 100
      // - Set the property table property minimum to 111
      // This should cause an issue for 110 being smaller than 111
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 111, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values with offset in property table property greater than the property table property maximum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property offset to 100
      // - Set the property table property maximum to 111
      // This should cause an issue for 112 being greater than 111
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setPropertyTablePropertyMinMax(binaryPropertyTable, undefined, 111);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects when the property table property minimum does not match the computed minimum with offset in property table property for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property offset to 100
      // - Set the property table property minimum to 109
      // This should cause an issue for the computed minimum
      // of 10 not matching the property table property minimum of 109
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 109, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
    });

    it("detects when the property table property maximum does not match the computed maximum with offset in property table property for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property offset to 100
      // - Set the property table property minimum to 113
      // This should cause an issue for the computed maximum
      // of 112 not matching the property table property maximum of 113
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setPropertyTablePropertyMinMax(binaryPropertyTable, undefined, 113);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
    });
  });

  //
  //
  //
  //
  //
  //=== example_INT16_SCALAR test cases with offset in class property:
  //
  //
  //
  //
  //

  describe("issues for example_INT16_SCALAR with offset in class property", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for values with offset in class property that are valid for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set the class property min/max to 110/112
      // - Set the property table property min/max to 110/112
      // This should NOT cause any issues!
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setClassPropertyMinMax(binaryPropertyTable, 110, 112);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 110, 112);

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

    it("detects values with offset in class property smaller than the class property minimum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set the class property minimum to 111
      // This should cause an issue for 110 being smaller than 111
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setClassPropertyMinMax(binaryPropertyTable, 111, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values with offset in class property greater than the class property maximum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set class property maximum to 111
      // This should cause an issue for 112 being greater than 111
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setClassPropertyMinMax(binaryPropertyTable, undefined, 111);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values with offset in class property smaller than the property table property minimum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set the property table property minimum to 111
      // This should cause an issue for 110 being smaller than 111
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 111, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values with offset in class property greater than the property table property maximum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set the property table property maximum to 111
      // This should cause an issue for 112 being greater than 111
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setPropertyTablePropertyMinMax(binaryPropertyTable, undefined, 111);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects when the property table property minimum does not match the computed minimum with offset in class property for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set the property table property minimum to 109
      // This should cause an issue for the computed minimum
      // of 10 not matching the property table property minimum of 109
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 109, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
    });

    it("detects when the property table property maximum does not match the computed maximum with offset in class property for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the class property offset to 100
      // - Set the property table property minimum to 113
      // This should cause an issue for the computed maximum
      // of 112 not matching the property table property maximum of 113
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setClassPropertyOffsetScale(binaryPropertyTable, 100, undefined);
      setPropertyTablePropertyMinMax(binaryPropertyTable, undefined, 113);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
    });
  });

  //
  //
  //
  //
  //
  //=== example_INT16_SCALAR test cases with scale in property table property:
  //
  //
  //
  //
  //

  describe("issues for example_INT16_SCALAR with scale in property table property", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for values with scale in property table property that are valid for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property scale to 10
      // - Set the class property min/max to 100/120
      // - Set the property table property min/max to 100/120
      // This should NOT cause any issues!
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, undefined, 10);
      setClassPropertyMinMax(binaryPropertyTable, 100, 120);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 100, 120);

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

    it("detects values with scale in property table property smaller than the class property minimum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property scale to 10
      // - Set the class property minimum to 101
      // This should cause an issue for 100 being smaller than 101
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, undefined, 10);
      setClassPropertyMinMax(binaryPropertyTable, 101, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values with scale in property table property greater than the class property maximum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property scale to 10
      // - Set class property maximum to 119
      // This should cause an issue for 120 being greater than 119
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, undefined, 10);
      setClassPropertyMinMax(binaryPropertyTable, undefined, 119);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values with scale in property table property smaller than the property table property minimum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property scale to 10
      // - Set the property table property minimum to 101
      // This should cause an issue for 100 being smaller than 101
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, undefined, 10);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 101, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values with scale in property table property greater than the property table property maximum for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property scale to 10
      // - Set the property table property maximum to 119
      // This should cause an issue for 120 being greater than 119
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, undefined, 10);
      setPropertyTablePropertyMinMax(binaryPropertyTable, undefined, 119);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects when the property table property minimum does not match the computed minimum with scale in property table property for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property scale to 10
      // - Set the property table property minimum to 99
      // This should cause an issue for the computed minimum
      // of 100 not matching the property table property minimum of 99
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, undefined, 10);
      setPropertyTablePropertyMinMax(binaryPropertyTable, 99, undefined);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
    });

    it("detects when the property table property maximum does not match the computed maximum with scale in property table property for example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12
      // - Set the property table property scale to 10
      // - Set the property table property minimum to 121
      // This should cause an issue for the computed maximum
      // of 120 not matching the property table property maximum of 121
      prepareTest_example_INT16_SCALAR(binaryPropertyTable);
      setPropertyTablePropertyOffsetScale(binaryPropertyTable, undefined, 10);
      setPropertyTablePropertyMinMax(binaryPropertyTable, undefined, 121);

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
    });
  });
  //==========================================================================
  //=== example_fixed_length_normalized_INT64_VEC2_array test cases:
  // - no issues for valid input
  // - values out of range for 'min' and 'max' in classProperty
  //   and in propertyTableProperty
  // - computed values do not match the 'min' or 'max'
  //   of the propertyTableProperty

  //
  //
  //
  //
  //
  //=== example_fixed_length_normalized_INT64_VEC2_array test cases without offset or scale:
  //
  //
  //
  //
  //
  describe("issues for example_fixed_length_normalized_INT64_VEC2_array (without offset or scale)", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(directory, resourceResolver);
    });

    it("should not report issues for values that are valid for example_fixed_length_normalized_INT64_VEC2_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_normalized_INT64_VEC2_array();

      // For the test:
      // - Set the class property min/max to the actual min/max
      // - Set the property table property min/max to the actual min/max
      // This should NOT cause any issues!
      setClassPropertyMinMax(
        binaryPropertyTable,
        [
          [0, 0],
          [-1, 0],
          [0, -1],
        ],
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ]
      );
      setPropertyTablePropertyMinMax(
        binaryPropertyTable,
        [
          [0, 0],
          [-1, 0],
          [0, -1],
        ],
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ]
      );

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
    it("detects values smaller than the class property minimum for example_fixed_length_normalized_INT64_VEC2_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_normalized_INT64_VEC2_array();

      // For the test:
      // - Set the class property minimum to a value where one component
      //   is 0.5, even though the actual minimum component is -1
      // This should cause an issue
      setClassPropertyMinMax(
        binaryPropertyTable,
        [
          [0, 0],
          [-0.5, 0],
          [0, -1],
        ],
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ]
      );

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values greater than the class property maximum for example_fixed_length_normalized_INT64_VEC2_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_normalized_INT64_VEC2_array();

      // For the test:
      // - Set the class property maximum to a value where one component
      //   is 0.5, even though the actual maximum component is 1
      // This should cause an issue
      setClassPropertyMinMax(
        binaryPropertyTable,
        [
          [0, 0],
          [-1, 0],
          [0, -1],
        ],
        [
          [0, 0],
          [0.5, 0],
          [0, 1],
        ]
      );

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values smaller than the property table property minimum for example_fixed_length_normalized_INT64_VEC2_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_normalized_INT64_VEC2_array();

      // For the test:
      // - Set the property table property minimum to a value where one component
      //   is 0.5, even though the actual minimum component is -1
      // This should cause an issue
      setPropertyTablePropertyMinMax(
        binaryPropertyTable,
        [
          [0, 0],
          [-0.5, 0],
          [0, -1],
        ],
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ]
      );

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects values greater than the property table property maximum for example_fixed_length_normalized_INT64_VEC2_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_normalized_INT64_VEC2_array();

      // For the test:
      // - Set the property table property maximum to a value where one component
      //   is 0.5, even though the actual maximum component is 1
      // This should cause an issue
      setPropertyTablePropertyMinMax(
        binaryPropertyTable,
        [
          [0, 0],
          [-1, 0],
          [0, -1],
        ],
        [
          [0, 0],
          [0.5, 0],
          [0, 1],
        ]
      );

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_NOT_IN_RANGE");
    });

    it("detects when the property table property minimum does not match the computed minimum for example_fixed_length_normalized_INT64_VEC2_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_normalized_INT64_VEC2_array();

      // For the test:
      // - Set the property table property minimum to a value where one component
      //   is -1.5, even though the actual maximum component is 1
      // This should cause an issue
      setPropertyTablePropertyMinMax(
        binaryPropertyTable,
        [
          [0, 0],
          [-1.5, 0],
          [0, -1],
        ],
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ]
      );

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
    });

    it("detects when the property table property maximum does not match the computed maximum for example_fixed_length_normalized_INT64_VEC2_array", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_fixed_length_normalized_INT64_VEC2_array();

      // For the test:
      // - Set the property table property maximum to a value where one component
      //   is 1.5, even though the actual maximum component is 1
      // This should cause an issue
      setPropertyTablePropertyMinMax(
        binaryPropertyTable,
        [
          [0, 0],
          [-1, 0],
          [0, -1],
        ],
        [
          [0, 0],
          [1.5, 0],
          [0, 1],
        ]
      );

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
      expect(result.get(0).type).toEqual("METADATA_VALUE_MISMATCH");
    });
  });
});
