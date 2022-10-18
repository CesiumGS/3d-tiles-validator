import { MetadataEntityModels } from "../../src/metadata/MetadataEntityModels";
import { SchemaClass } from "../../src/structure/Metadata/SchemaClass";
import { genericEquals } from "./genericEquals";

describe("metadata/MetadataEntityModel", function () {
  it("throws when the value of an unknown property is accessed", function () {
    expect(function () {
      const testSchemaClass: SchemaClass = {
        properties: {},
      };
      const entityJson = {
        testProperty: 1234,
      };
      const entity = MetadataEntityModels.createFromClass(
        testSchemaClass,
        entityJson
      );
      entity.getPropertyValue("testProperty");
    }).toThrow();
  });

  it("obtains a default value for a scalar int32 value", function () {
    const testSchemaClass: SchemaClass = {
      properties: {
        testProperty: {
          type: "SCALAR",
          componentType: "INT32",
          default: 1234,
        },
      },
    };
    const entityJson = {
      testProperty: undefined,
    };
    const entity = MetadataEntityModels.createFromClass(
      testSchemaClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    expect(value).toBe(1234);
  });

  it("obtains a default value for a scalar int32 noData value", function () {
    const testSchemaClass: SchemaClass = {
      properties: {
        testProperty: {
          type: "SCALAR",
          componentType: "INT32",
          noData: 2345,
          default: 1234,
        },
      },
    };
    const entityJson = {
      testProperty: 2345,
    };
    const entity = MetadataEntityModels.createFromClass(
      testSchemaClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    expect(value).toBe(1234);
  });

  it("obtains a value for a vec3 float32 value with offset", function () {
    const testSchemaClass: SchemaClass = {
      properties: {
        testProperty: {
          type: "VEC3",
          componentType: "FLOAT32",
          offset: [1.2, 2.3, 3.4],
        },
      },
    };
    const entityJson = {
      testProperty: [4.5, 5.6, 6.7],
    };
    const entity = MetadataEntityModels.createFromClass(
      testSchemaClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    const expected = [5.7, 7.9, 10.1];
    const epsilon = 0.000001;
    expect(genericEquals(value, expected, epsilon)).toBeTrue();
  });

  it("obtains a value for a vec3 float32 value with scale", function () {
    const testSchemaClass: SchemaClass = {
      properties: {
        testProperty: {
          type: "VEC3",
          componentType: "FLOAT32",
          scale: [2.0, 3.0, 4.0],
        },
      },
    };
    const entityJson = {
      testProperty: [3.0, 4.0, 5.0],
    };
    const entity = MetadataEntityModels.createFromClass(
      testSchemaClass,
      entityJson
    );
    const value = entity.getPropertyValue("testProperty");
    const expected = [6.0, 12.0, 20.0];
    const epsilon = 0.000001;
    expect(genericEquals(value, expected, epsilon)).toBeTrue();
  });
});
