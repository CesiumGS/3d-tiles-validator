import { genericEquals } from "./genericEquals";

import { BinaryPropertyTables } from "../../src/binary/BinaryPropertyTables";
import { PropertyTableModel } from "../../src/binary/PropertyTableModel";

import { ClassProperty } from "../../src/structure/Metadata/ClassProperty";

/**
 * Test for the `PropertyTableModels` class.
 *
 * These tests just verify the "roundtrip":
 * - They create a `PropertyTableModel` from a single property
 *   and its associated data
 * - They obtain the `MetadataEntityModel` instances from the
 *   property table model
 * - They check whether the elements of the input data and the
 *   values from the entity model are generically equal.
 */
describe("metadata/PropertyTableModelSpec", function () {
  const epsilon = 0.000001;

  it("correctly represents example_INT16_SCALAR", function () {
    const example_INT16_SCALAR: ClassProperty = {
      type: "SCALAR",
      componentType: "INT16",
    };
    const example_INT16_SCALAR_values = [-32768, 32767];

    const classProperty = example_INT16_SCALAR;
    const values = example_INT16_SCALAR_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_variable_length_INT16_SCALAR_array", function () {
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

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_fixed_length_INT16_SCALAR_array", function () {
    const example_fixed_length_INT16_SCALAR_array: ClassProperty = {
      type: "SCALAR",
      componentType: "INT16",
      array: true,
      count: 2,
    };
    const example_fixed_length_INT16_SCALAR_array_values = [
      [-32768, 32767],
      [-1, 1],
    ];

    const classProperty = example_fixed_length_INT16_SCALAR_array;
    const values = example_fixed_length_INT16_SCALAR_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_BOOLEAN", function () {
    const example_BOOLEAN: ClassProperty = {
      type: "BOOLEAN",
    };
    const example_BOOLEAN_values = [true, false];

    const classProperty = example_BOOLEAN;
    const values = example_BOOLEAN_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_variable_length_BOOLEAN_array", function () {
    const example_variable_length_BOOLEAN_array: ClassProperty = {
      type: "BOOLEAN",
      array: true,
    };
    const example_variable_length_BOOLEAN_array_values = [
      [true, false],
      [false, true, false, true],
    ];

    const classProperty = example_variable_length_BOOLEAN_array;
    const values = example_variable_length_BOOLEAN_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_fixed_length_BOOLEAN_array", function () {
    const example_fixed_length_BOOLEAN_array: ClassProperty = {
      type: "BOOLEAN",
      array: true,
    };
    const example_fixed_length_BOOLEAN_array_values = [
      [true, false, true],
      [false, true, false],
    ];

    const classProperty = example_fixed_length_BOOLEAN_array;
    const values = example_fixed_length_BOOLEAN_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_STRING", function () {
    const example_STRING: ClassProperty = {
      type: "STRING",
    };
    const example_STRING_values = ["Test string", "Another string"];

    const classProperty = example_STRING;
    const values = example_STRING_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_variable_length_STRING_array", function () {
    const example_variable_length_STRING_array: ClassProperty = {
      type: "STRING",
      array: true,
    };
    const example_variable_length_STRING_array_values = [
      ["A0", "A1", "A2"],
      ["B0", "B1"],
    ];

    const classProperty = example_variable_length_STRING_array;
    const values = example_variable_length_STRING_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_fixed_length_STRING_array", function () {
    const example_fixed_length_STRING_array: ClassProperty = {
      type: "STRING",
      array: true,
      count: 3,
    };
    const example_fixed_length_STRING_array_values = [
      ["A0", "A1", "A2"],
      ["B0", "B1", "B2"],
    ];

    const classProperty = example_fixed_length_STRING_array;
    const values = example_fixed_length_STRING_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_FLOAT32_VEC2", function () {
    const example_FLOAT32_VEC2: ClassProperty = {
      type: "VEC2",
      componentType: "FLOAT32",
    };
    const example_FLOAT32_VEC2_values = [
      [0.0, 1.0],
      [2.0, 3.0],
    ];

    const classProperty = example_FLOAT32_VEC2;
    const values = example_FLOAT32_VEC2_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_variable_length_UINT32_VEC2_array", function () {
    const example_variable_length_UINT32_VEC2_array: ClassProperty = {
      type: "VEC2",
      componentType: "FLOAT32",
      array: true,
    };
    const example_variable_length_UINT32_VEC2_array_values = [
      [
        [0.0, 1.0],
        [2.0, 3.0],
      ],
      [
        [4.0, 5.0],
        [6.0, 7.0],
        [8.0, 9.0],
      ],
    ];

    const classProperty = example_variable_length_UINT32_VEC2_array;
    const values = example_variable_length_UINT32_VEC2_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });

  it("correctly represents example_fixed_length_UINT32_VEC2_array", function () {
    const example_fixed_length_UINT32_VEC2_array: ClassProperty = {
      type: "VEC2",
      componentType: "FLOAT32",
      array: true,
      count: 2,
    };
    const example_fixed_length_UINT32_VEC2_array_values = [
      [
        [0.0, 1.0],
        [2.0, 3.0],
      ],
      [
        [4.0, 5.0],
        [6.0, 7.0],
      ],
    ];

    const classProperty = example_fixed_length_UINT32_VEC2_array;
    const values = example_fixed_length_UINT32_VEC2_array_values;

    const arrayOffsetType = "UINT32";
    const stringOffsetType = "UINT32";
    const binaryPropertyTable =
      BinaryPropertyTables.createBinaryPropertyTableFromProperty(
        "testProperty",
        classProperty,
        values,
        arrayOffsetType,
        stringOffsetType,
        undefined
      );
    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
    const count = values.length;
    for (let i = 0; i < count; i++) {
      const entity = propertyTableModel.getMetadataEntityModel(i);
      const expected = values[i];
      const actual = entity.getPropertyValue("testProperty");
      expect(genericEquals(actual, expected, epsilon)).toBeTrue();
    }
  });
});
