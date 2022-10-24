import { ResourceResolvers } from "../../src/io/ResourceResolvers";

import { ValidationContext } from "../../src/validation/ValidationContext";
import { PropertyTableValidator } from "../../src/validation/metadata/PropertyTableValidator";

import { PropertyTableModels } from "../../src/binary/PropertyTableModels";

import { Schema } from "../../src/structure/Metadata/Schema";
import { ClassProperty } from "../../src/structure/Metadata/ClassProperty";

describe("metadata/BinaryPropertyTablesSpec", function () {
  let context: ValidationContext;

  beforeEach(async function () {
    const directory = "specs/data/propertyTables/";
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);
    context = new ValidationContext(resourceResolver);
  });

  it("TODO", async function () {
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

    const binaryPropertyTable = PropertyTableModels.createBinaryPropertyTable(
      testSchema,
      "testClass",
      "testProperty",
      values
    );

    const propertyTable = binaryPropertyTable.propertyTable;
    const binaryBufferStructure = binaryPropertyTable.binaryBufferStructure;
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      binaryBufferStructure,
      testSchema,
      context
    );
    const result = context.getResult();
    console.log(result.toJson());
    //expect(result.length).toEqual(1);
    //expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });
});
