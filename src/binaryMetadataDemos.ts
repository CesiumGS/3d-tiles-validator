import { ClassProperty } from "./structure/Metadata/ClassProperty";

import { BinaryPropertyTables } from "./binary/BinaryPropertyTables";
import { PropertyTableModel } from "./binary/PropertyTableModel";

function runPropertyTableModelTest(
  name: string,
  classProperty: ClassProperty,
  propertyValues: any
) {
  const count = propertyValues.length;
  const arrayOffsetType = "UINT32";
  const stringOffsetType = "UINT32";
  const binaryPropertyTable =
    BinaryPropertyTables.createBinaryPropertyTableFromProperty(
      "testProperty",
      classProperty,
      propertyValues,
      arrayOffsetType,
      stringOffsetType,
      count
    );
  const propertyTableModel = new PropertyTableModel(binaryPropertyTable);
  console.log("For " + name);
  console.log("  Original values: " + JSON.stringify(propertyValues));
  for (let i = 0; i < count; i++) {
    const entity0 = propertyTableModel.getMetadataEntityModel(i);
    const value0 = entity0.getPropertyValue("testProperty");
    console.log(`  Value from MetadataEntity ${i}: ` + JSON.stringify(value0));
  }
}

function runPropertyTableModelTests() {
  const example_variable_length_FLOAT32_SCALAR_array = {
    type: "SCALAR",
    componentType: "FLOAT32",
    array: true,
  };
  const example_fixed_length_FLOAT32_SCALAR_array = {
    type: "SCALAR",
    componentType: "FLOAT32",
    array: true,
    count: 5,
  };
  const example_STRING = {
    type: "STRING",
  };
  const example_variable_length_STRING_array = {
    type: "STRING",
    array: true,
  };
  const example_fixed_length_STRING_array = {
    type: "STRING",
    array: true,
    count: 5,
  };
  const example_BOOLEAN = {
    type: "BOOLEAN",
  };
  const example_variable_length_BOOLEAN_array = {
    type: "BOOLEAN",
    array: true,
  };
  const example_fixed_length_BOOLEAN_array = {
    type: "BOOLEAN",
    array: true,
    count: 5,
  };

  const example_variable_length_UINT32_VEC2_array = {
    type: "VEC2",
    componentType: "UINT32",
    array: true,
  };
  const example_fixed_length_UINT32_VEC2_array = {
    type: "VEC2",
    componentType: "UINT32",
    array: true,
    count: 5,
  };

  const example_variable_length_FLOAT32_SCALAR_array_values = [
    [-1.0, -0.5, 0.0, 0.5, 1.0],
    [-1.0, 0.0, 1.0],
  ];
  const example_fixed_length_FLOAT32_SCALAR_array_values = [
    [-1.0, -0.5, 0.0, 0.5, 1.0],
    [1.0, 2.0, 3.0, 4.0, 5.0],
  ];
  const example_STRING_values = ["This is a test", "This is another test"];
  const example_variable_length_STRING_array_values = [
    ["This", "is", "a", "test"],
    ["Another", "test"],
  ];
  const example_fixed_length_STRING_array_values = [
    ["zero", "one", "two", "three", "four"],
    ["A", "B", "C", "D", "E"],
  ];
  const example_BOOLEAN_values = [true, false];
  const example_variable_length_BOOLEAN_array_values = [
    [true, false, true, false],
    [false, true, false],
  ];
  const example_fixed_length_BOOLEAN_array_values = [
    [true, false, true, false, true],
    [false, true, false, true, false],
  ];

  const example_variable_length_UINT32_VEC2_array_values = [
    [
      [0, 1],
      [2, 3],
      [4, 5],
    ],
    [
      [6, 7],
      [8, 9],
    ],
  ];
  const example_fixed_length_UINT32_VEC2_array_values = [
    [
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
      [8, 9],
    ],
    [
      [10, 11],
      [12, 13],
      [14, 15],
      [16, 17],
      [18, 19],
    ],
  ];

  runPropertyTableModelTest(
    "example_fixed_length_STRING_array",
    example_fixed_length_STRING_array,
    example_fixed_length_STRING_array_values
  );
  runPropertyTableModelTest(
    "example_variable_length_BOOLEAN_array",
    example_variable_length_BOOLEAN_array,
    example_variable_length_BOOLEAN_array_values
  );
  runPropertyTableModelTest(
    "example_fixed_length_UINT32_VEC2_array",
    example_fixed_length_UINT32_VEC2_array,
    example_fixed_length_UINT32_VEC2_array_values
  );
  runPropertyTableModelTest(
    "example_variable_length_STRING_array",
    example_variable_length_STRING_array,
    example_variable_length_STRING_array_values
  );
  runPropertyTableModelTest(
    "example_fixed_length_FLOAT32_SCALAR_array",
    example_fixed_length_FLOAT32_SCALAR_array,
    example_fixed_length_FLOAT32_SCALAR_array_values
  );
  runPropertyTableModelTest(
    "example_STRING",
    example_STRING,
    example_STRING_values
  );
  runPropertyTableModelTest(
    "example_variable_length_FLOAT32_SCALAR_array",
    example_variable_length_FLOAT32_SCALAR_array,
    example_variable_length_FLOAT32_SCALAR_array_values
  );
  runPropertyTableModelTest(
    "example_BOOLEAN",
    example_BOOLEAN,
    example_BOOLEAN_values
  );
  runPropertyTableModelTest(
    "example_fixed_length_BOOLEAN_array",
    example_fixed_length_BOOLEAN_array,
    example_fixed_length_BOOLEAN_array_values
  );
  runPropertyTableModelTest(
    "example_variable_length_UINT32_VEC2_array",
    example_variable_length_UINT32_VEC2_array,
    example_variable_length_UINT32_VEC2_array_values
  );
}

runPropertyTableModelTests();
