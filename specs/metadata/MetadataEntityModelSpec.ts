import { DefaultMetadataEntityModel } from "../../src/metadata/DefaultMetadataEntityModel";
import { SchemaClass } from "../../src/structure/Metadata/SchemaClass";
import { defaultValue } from "../../src/base/defaultValue";

// TODO Do this Jasmine hookup thing instead of this:
const equalsEpsilon = function (
  left: number,
  right: number,
  relativeEpsilon: number,
  absoluteEpsilon?: number
) {
  relativeEpsilon = defaultValue(relativeEpsilon, 0.0);
  absoluteEpsilon = defaultValue(absoluteEpsilon, relativeEpsilon);
  const absDiff = Math.abs(left - right);
  return (
    absDiff <= absoluteEpsilon! ||
    absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right))
  );
};
const arraysEqualsEpsilon = function (a: any, b: any, epsilon: number) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; ++i) {
      if (!equalsEpsilon(a[i], b[i], epsilon)) {
        return false;
      }
    }

    return true;
  }
};

describe("metadata/MetadataEntityModel", function () {
  it("throws when the value of an unknown property is accessed", function () {
    expect(function () {
      const testSchemaClass: SchemaClass = {
        properties: {},
      };
      const entityJson = {
        testProperty: 1234,
      };
      const entity = new DefaultMetadataEntityModel(
        testSchemaClass,
        entityJson
      );
      const value = entity.getPropertyValue("testProperty");
    }).toThrow();
  });

  it("obtains a scalar int32 value", function () {
    const testSchemaClass: SchemaClass = {
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
    const entity = new DefaultMetadataEntityModel(testSchemaClass, entityJson);
    const value = entity.getPropertyValue("testProperty");
    expect(value).toBe(1234);
  });

  it("obtains a string value", function () {
    const testSchemaClass: SchemaClass = {
      properties: {
        testProperty: {
          type: "STRING",
        },
      },
    };
    const entityJson = {
      testProperty: "example",
    };
    const entity = new DefaultMetadataEntityModel(testSchemaClass, entityJson);
    const value = entity.getPropertyValue("testProperty");
    expect(value).toBe("example");
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
    const entity = new DefaultMetadataEntityModel(testSchemaClass, entityJson);
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
    const entity = new DefaultMetadataEntityModel(testSchemaClass, entityJson);
    const value = entity.getPropertyValue("testProperty");
    expect(value).toBe(1234);
  });

  it("obtains an array float32 value", function () {
    const testSchemaClass: SchemaClass = {
      properties: {
        testProperty: {
          type: "SCALAR",
          array: true,
          componentType: "FLOAT32",
        },
      },
    };
    const entityJson = {
      testProperty: [1.2, 2.3, 3.4, 4.5],
    };
    const entity = new DefaultMetadataEntityModel(testSchemaClass, entityJson);
    const value = entity.getPropertyValue("testProperty");
    expect(value).toEqual([1.2, 2.3, 3.4, 4.5]);
  });

  it("obtains a vec3 float32 value", function () {
    const testSchemaClass: SchemaClass = {
      properties: {
        testProperty: {
          type: "VEC3",
          componentType: "FLOAT32",
        },
      },
    };
    const entityJson = {
      testProperty: [1.2, 2.3, 3.4],
    };
    const entity = new DefaultMetadataEntityModel(testSchemaClass, entityJson);
    const value = entity.getPropertyValue("testProperty");
    expect(value).toEqual([1.2, 2.3, 3.4]);
  });

  it("obtains a mat2 float32 value", function () {
    const testSchemaClass: SchemaClass = {
      properties: {
        testProperty: {
          type: "MAT2",
          componentType: "FLOAT32",
        },
      },
    };
    const entityJson = {
      testProperty: [1.2, 2.3, 3.4, 4.5],
    };
    const entity = new DefaultMetadataEntityModel(testSchemaClass, entityJson);
    const value = entity.getPropertyValue("testProperty");
    expect(value).toEqual([1.2, 2.3, 3.4, 4.5]);
  });

  it("obtains a an array of mat2 float32 values", function () {
    const testSchemaClass: SchemaClass = {
      properties: {
        testProperty: {
          type: "MAT2",
          array: true,
          componentType: "FLOAT32",
        },
      },
    };
    const entityJson = {
      testProperty: [1.2, 2.3, 3.4, 4.5, 5.6, 6.7, 7.8, 8.9],
    };
    const entity = new DefaultMetadataEntityModel(testSchemaClass, entityJson);
    const value = entity.getPropertyValue("testProperty");
    expect(value).toEqual([1.2, 2.3, 3.4, 4.5, 5.6, 6.7, 7.8, 8.9]);
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
    const entity = new DefaultMetadataEntityModel(testSchemaClass, entityJson);
    const value = entity.getPropertyValue("testProperty");
    const expected = [5.7, 7.9, 10.1];
    const epsilon = 0.000001;
    expect(arraysEqualsEpsilon(value, expected, epsilon)).toBeTrue();
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
    const entity = new DefaultMetadataEntityModel(testSchemaClass, entityJson);
    const value = entity.getPropertyValue("testProperty");
    const expected = [6.0, 12.0, 20.0];
    const epsilon = 0.000001;
    expect(arraysEqualsEpsilon(value, expected, epsilon)).toBeTrue();
  });

});
