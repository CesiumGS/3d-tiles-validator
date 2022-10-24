import { readJsonUnchecked } from "../../src/base/readJsonUnchecked";
import { ResourceResolvers } from "../../src/io/ResourceResolvers";

import { ValidationContext } from "../../src/validation/ValidationContext";

import { PropertyTableValidator } from "../../src/validation/metadata/PropertyTableValidator";

import { Schema } from "../../src/structure/Metadata/Schema";

describe("metadata/PropertyTablesSpec", function () {
  let fullMetadataSchema: Schema;
  let context: ValidationContext;

  beforeAll(async function () {
    fullMetadataSchema = await readJsonUnchecked(
      "specs/data/schemas/FullMetadataSchema.json"
    );
  });

  beforeEach(async function () {
    const directory = "specs/data/propertyTables/";
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);
    context = new ValidationContext(resourceResolver);
  });

  it("detects issues in propertiesInvalidType", async function () {
    const inputData = await readJsonUnchecked(
      "specs/data/propertyTables/propertiesInvalidType.json"
    );
    const propertyTable = inputData.propertyTables[0];
    const binaryMetadata = {};
    PropertyTableValidator.validatePropertyTable(
      "test",
      propertyTable,
      binaryMetadata,
      fullMetadataSchema,
      context
    );
    const result = context.getResult();
    //console.log(result.toJson());
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });
});
