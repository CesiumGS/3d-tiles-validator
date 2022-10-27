import { defaultValue } from "./base/defaultValue";
import { readJsonUnchecked } from "./base/readJsonUnchecked";

import { MetadataClass } from "./structure/Metadata/MetadataClass";
import { Tileset } from "./structure/Tileset";

import { MetadataEntityModels } from "./metadata/MetadataEntityModels";

function test_exampleScalarInt32() {
  console.log("exampleScalarInt32:");
  const metadataClass: MetadataClass = {
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
  const entity = MetadataEntityModels.createFromClass(
    metadataClass,
    entityJson
  );

  const value = entity.getPropertyValue("testProperty");
  console.log("  Property value: " + value);
}

function test_exampleArrayInt16WithDefault() {
  console.log("exampleArrayInt16WithDefault:");
  const metadataClass: MetadataClass = {
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
  const entity = MetadataEntityModels.createFromClass(
    metadataClass,
    entityJson
  );
  const value = entity.getPropertyValue("testProperty");
  console.log("  Property value: " + value);
}

function test_exampleVec3Uint16Normalized() {
  console.log("exampleVec3Uint16Normalized:");
  const metadataClass: MetadataClass = {
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
  const entity = MetadataEntityModels.createFromClass(
    metadataClass,
    entityJson
  );
  const value = entity.getPropertyValue("testProperty");
  console.log("  Property value: " + value);
}

function createValueString(value: any) {
  let result = "";
  if (Array.isArray(value)) {
    result += "[";
    for (let i = 0; i < value.length; i++) {
      if (i > 0) {
        result += ", ";
      }
      result += createValueString(value[i]);
    }
    result += "]";
    return result;
  }
  if (typeof value === "string") {
    return '"' + value + '"';
  }
  return value.toString();
}

async function testTilesetWithFullMetadata() {
  // TODO This is totally unchecked, only for this basic test!!!
  const tileset: Tileset = await readJsonUnchecked(
    "specs/data/Samples/TilesetWithFullMetadata/tileset.json"
  );
  const metadataSchema = tileset.schema!;
  const metadataEntity = tileset.metadata!;
  const entity = MetadataEntityModels.create(metadataSchema, metadataEntity);

  console.log("Metadata property values:");
  const metadataClasses = defaultValue(metadataSchema.classes, {});
  const metadataClass = metadataClasses!["exampleClass"];
  for (const propertyName of Object.keys(metadataClass.properties!)) {
    const nameString = propertyName.padStart(60);
    const value = entity.getPropertyValue(propertyName);
    const valueString = createValueString(value);
    console.log(`  Property value of ${nameString}: ${valueString}`);
  }
}

function runDemos() {
  test_exampleScalarInt32();
  test_exampleArrayInt16WithDefault();
  test_exampleVec3Uint16Normalized();
  testTilesetWithFullMetadata();
}

runDemos();
