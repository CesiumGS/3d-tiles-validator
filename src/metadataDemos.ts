import { SchemaClass } from "./structure/Metadata/SchemaClass";
import { DefaultMetadataEntityModel } from "./metadata/DefaultMetadataEntityModel";

function test_exampleScalarInt32() {
  console.log("exampleScalarInt32:");
  const schemaClass: SchemaClass = {
    properties: {
      testProperty: {
        type: "SCALAR",
        componentType: "INT32",
      },
    },
  };
  const entityJson = {
    testProperty: 1234,
  };
  const entity = new DefaultMetadataEntityModel(schemaClass, entityJson);

  const value = entity.getPropertyValue("testProperty");
  console.log("  Property value: " + value);
}

function test_exampleArrayInt16WithDefault() {
  console.log("exampleArrayInt16WithDefault:");
  const schemaClass: SchemaClass = {
    properties: {
      testProperty: {
        array: true,
        type: "SCALAR",
        componentType: "INT16",
        required: false,
        noData: [],
        default: [1, 1, 1],
      },
    },
  };
  const entityJson = {
    testProperty: undefined,
  };
  const entity = new DefaultMetadataEntityModel(schemaClass, entityJson);
  const value = entity.getPropertyValue("testProperty");
  console.log("  Property value: " + value);
}

function test_exampleVec3Uint16Normalized() {
  console.log("exampleVec3Uint16Normalized:");
  const schemaClass: SchemaClass = {
    properties: {
      testProperty: {
        type: "VEC3",
        componentType: "UINT16",
        normalized: true,
      },
    },
  };
  const entityJson = {
    testProperty: [0, 32767, 65535],
  };
  const entity = new DefaultMetadataEntityModel(schemaClass, entityJson);
  const value = entity.getPropertyValue("testProperty");
  console.log("  Property value: " + value);
}

function runDemos() {
  test_exampleScalarInt32();
  test_exampleArrayInt16WithDefault();
  test_exampleVec3Uint16Normalized();
}

runDemos();
