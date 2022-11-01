import { ResourceResolvers } from "../../src/io/ResourceResolvers";

import { ValidationContext } from "../../src/validation/ValidationContext";
import { BinaryPropertyTableValidator } from "../../src/validation/metadata/BinaryPropertyTableValidator";

import { PropertyTableTestUtilities } from "./PropertyTableTestUtilities";

// A flag to enable printing all `ValidationResult`
// instances to the console during the tests.
const debugLogResults = true;

describe("metadata/BinaryPropertyTableValuesValidationSpec", function () {
  //==========================================================================
  //=== example_INT16_SCALAR test cases:
  // - no issues for valid input
  // - values out of range for 'min' and 'max' in classProperty
  //   and in propertyTableProperty

  describe("issues for example_INT16_SCALAR", function () {
    let context: ValidationContext;

    beforeEach(function () {
      const directory = "specs/data/propertyTables/";
      const resourceResolver =
        ResourceResolvers.createFileResourceResolver(directory);
      context = new ValidationContext(resourceResolver);
    });

    it("should not report issues for a valid example_INT16_SCALAR", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test: Fill the property with the
      // values 10 and 12, and set the minimum
      // to be 10 and the maximum to be 12 in the
      // class property
      const classProperty =
        binaryPropertyTable.metadataClass.properties!["testProperty"];
      const propertyTableProperty =
        binaryPropertyTable.propertyTable.properties!["testProperty"];
      const valuesBufferViewIndex = propertyTableProperty.values;
      const valuesBufferViewData =
        binaryPropertyTable.binaryBufferData!.bufferViewsData![
          valuesBufferViewIndex
        ];
      valuesBufferViewData.writeInt16LE(10, 0);
      valuesBufferViewData.writeInt16LE(12, 2);
      classProperty.min = 10;
      classProperty.max = 12;

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

      // For the test: Fill the property with the
      // values 10 and 12, and set the minimum
      // to be 11 in the class property
      const classProperty =
        binaryPropertyTable.metadataClass.properties!["testProperty"];
      const propertyTableProperty =
        binaryPropertyTable.propertyTable.properties!["testProperty"];
      const valuesBufferViewIndex = propertyTableProperty.values;
      const valuesBufferViewData =
        binaryPropertyTable.binaryBufferData!.bufferViewsData![
          valuesBufferViewIndex
        ];
      valuesBufferViewData.writeInt16LE(10, 0);
      valuesBufferViewData.writeInt16LE(12, 2);
      classProperty.min = 11;

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

      // For the test: Fill the property with the
      // values 10 and 12, and set the minimum
      // to be 11 in the class property
      const classProperty =
        binaryPropertyTable.metadataClass.properties!["testProperty"];
      const propertyTableProperty =
        binaryPropertyTable.propertyTable.properties!["testProperty"];
      const valuesBufferViewIndex = propertyTableProperty.values;
      const valuesBufferViewData =
        binaryPropertyTable.binaryBufferData!.bufferViewsData![
          valuesBufferViewIndex
        ];
      valuesBufferViewData.writeInt16LE(10, 0);
      valuesBufferViewData.writeInt16LE(12, 2);
      classProperty.max = 11;

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

      // For the test: Fill the property with the
      // values 10 and 12, and set the minimum
      // to be 11 in the class property
      const classProperty =
        binaryPropertyTable.metadataClass.properties!["testProperty"];
      const propertyTableProperty =
        binaryPropertyTable.propertyTable.properties!["testProperty"];
      const valuesBufferViewIndex = propertyTableProperty.values;
      const valuesBufferViewData =
        binaryPropertyTable.binaryBufferData!.bufferViewsData![
          valuesBufferViewIndex
        ];
      valuesBufferViewData.writeInt16LE(10, 0);
      valuesBufferViewData.writeInt16LE(12, 2);
      propertyTableProperty.min = 11;
      // This should be overridden by the property table property:
      classProperty.min = 12345;

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

      // For the test: Fill the property with the
      // values 10 and 12, and set the minimum
      // to be 11 in the class property
      const classProperty =
        binaryPropertyTable.metadataClass.properties!["testProperty"];
      const propertyTableProperty =
        binaryPropertyTable.propertyTable.properties!["testProperty"];
      const valuesBufferViewIndex = propertyTableProperty.values;
      const valuesBufferViewData =
        binaryPropertyTable.binaryBufferData!.bufferViewsData![
          valuesBufferViewIndex
        ];
      valuesBufferViewData.writeInt16LE(10, 0);
      valuesBufferViewData.writeInt16LE(12, 2);
      propertyTableProperty.max = 11;
      // This should be overridden by the property table property:
      classProperty.max = 12345;

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

    it("should not report issues for an example_INT16_SCALAR that is in the required range after applying offset", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12.
      // Assign an offset of 100 to the class property.
      // Assign a maximum of 112 to the property table property
      const classProperty =
        binaryPropertyTable.metadataClass.properties!["testProperty"];
      const propertyTableProperty =
        binaryPropertyTable.propertyTable.properties!["testProperty"];
      const valuesBufferViewIndex = propertyTableProperty.values;
      const valuesBufferViewData =
        binaryPropertyTable.binaryBufferData!.bufferViewsData![
          valuesBufferViewIndex
        ];
      valuesBufferViewData.writeInt16LE(10, 0);
      valuesBufferViewData.writeInt16LE(12, 2);
      classProperty.offset = 100;
      propertyTableProperty.max = 112;

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

    it("should not report issues for an example_INT16_SCALAR that is in the required range after applying scale", function () {
      const binaryPropertyTable =
        PropertyTableTestUtilities.createDefaultBinaryPropertyTable_example_INT16_SCALAR();

      // For the test:
      // - Fill the property with the values 10 and 12.
      // Assign an offset of 100 to the class property.
      // Assign a maximum of 112 to the property table property
      const classProperty =
        binaryPropertyTable.metadataClass.properties!["testProperty"];
      const propertyTableProperty =
        binaryPropertyTable.propertyTable.properties!["testProperty"];
      const valuesBufferViewIndex = propertyTableProperty.values;
      const valuesBufferViewData =
        binaryPropertyTable.binaryBufferData!.bufferViewsData![
          valuesBufferViewIndex
        ];
      valuesBufferViewData.writeInt16LE(10, 0);
      valuesBufferViewData.writeInt16LE(12, 2);
      classProperty.scale = 10;
      propertyTableProperty.max = 120;

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
