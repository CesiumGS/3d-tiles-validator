import { Schema } from "3d-tiles-tools";

import { readJsonUnchecked } from "../src/base/readJsonUnchecked";

import { Validators } from "../src/validation/Validators";
import { ValidatedElement } from "../src/validation/ValidatedElement";
import { ValidationResult } from "../src/validation/ValidationResult";

/**
 * Validate the specified subtree file from the `specs/data/subtrees`
 * directory.
 * 
 * Note that in order to validate a subtree file, the validator requires
 * additional data elements. Namely, the `TileImplicitTiling` that 
 * defines the structure of the subtree, and a `Schema` (if the
 * subtree contains metadata).
 * 
 * This function will load this data from the additional files in
 * the `specs/data/` directory that define the same structure for
 * all subtree spec files.
 * 
 * @param fileName - The subtree file name
 * @returns A promise to the `ValidationResult`
 */
async function validateSpecSubtreeFile(fileName: string): Promise<ValidationResult> {
  // The schema for the subtrees in the specs directory
  const specSchema: Schema = await readJsonUnchecked(
    "specs/data/schemas/validSchema.json"
  );
  const specSchemaState: ValidatedElement<Schema> = {
    wasPresent: true,
    validatedElement: specSchema,
  };

  // The `TileImplicitTiling` object that defines the
  // structure of subtrees in the specs directory
  const specImplicitTiling = await readJsonUnchecked(
    "specs/data/subtrees/validSubtreeImplicitTiling.json.input"
  );

  const validationResult = await Validators.validateSubtreeFile(
    fileName,
    specSchemaState,
    specImplicitTiling
  );
  return validationResult;
}


describe("Subtree validation", function () {
  it("detects issues in binarySubtreeComputedLengthInvalid", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/binarySubtreeComputedLengthInvalid.subtree"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("BINARY_INVALID_LENGTH");
  });

  it("detects issues in binarySubtreeInvalidBinaryByteLengthAlignment", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/binarySubtreeInvalidBinaryByteLengthAlignment.subtree"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("BINARY_INVALID_ALIGNMENT");
  });

  it("detects issues in binarySubtreeInvalidJsonByteLengthAlignment", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/binarySubtreeInvalidJsonByteLengthAlignment.subtree"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("BINARY_INVALID_ALIGNMENT");
  });

  it("detects issues in binarySubtreeInvalidMagic", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/binarySubtreeInvalidMagic.subtree"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IO_ERROR");
  });

  it("detects issues in binarySubtreeInvalidVersion", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/binarySubtreeInvalidVersion.subtree"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("BINARY_INVALID_VALUE");
  });

  it("detects issues in binarySubtreeJsonInvalid", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/binarySubtreeJsonInvalid.subtree"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("JSON_PARSE_ERROR");
  });

  it("detects no issues in binarySubtreeValid", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/binarySubtreeValid.subtree"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in subtreeBufferViewsWithoutBuffers", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeBufferViewsWithoutBuffers.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("BUFFER_VIEWS_WITHOUT_BUFFERS");
  });

  it("detects issues in subtreeChildSubtreeAvailabilityInvalidType", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeChildSubtreeAvailabilityInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in subtreeChildSubtreeAvailabilityMissing", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeChildSubtreeAvailabilityMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in subtreeContentAvailabilityInvalidLength", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeContentAvailabilityInvalidLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in subtreeContentAvailabilityInvalidType", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeContentAvailabilityInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in subtreeContentMetadataArrayElementInvalidType", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeContentMetadataArrayElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in subtreeContentMetadataArrayElementInvalidValueA", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeContentMetadataArrayElementInvalidValueA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in subtreeContentMetadataArrayElementInvalidValueB", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeContentMetadataArrayElementInvalidValueB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in subtreeContentMetadataInvalidLength", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeContentMetadataInvalidLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in subtreeContentMetadataInvalidType", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeContentMetadataInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in subtreeContentMetadataWithoutPropertyTables", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeContentMetadataWithoutPropertyTables.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });

  it("detects issues in subtreePropertyTablesElementInvalidType", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreePropertyTablesElementInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in subtreePropertyTablesInvalidLength", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreePropertyTablesInvalidLength.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in subtreePropertyTablesInvalidType", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreePropertyTablesInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in subtreeTileAvailabilityAvailableCountInvalid", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityAvailableCountInvalid.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SUBTREE_AVAILABILITY_INCONSISTENT");
  });

  it("detects issues in subtreeTileAvailabilityAvailableCountMismatch", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityAvailableCountMismatch.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SUBTREE_AVAILABILITY_INCONSISTENT");
  });

  it("detects issues in subtreeTileAvailabilityBitstreamAndConstant", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityBitstreamAndConstant.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ONE_OF_ERROR");
  });

  it("detects issues in subtreeTileAvailabilityBitstreamInvalidType", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityBitstreamInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in subtreeTileAvailabilityBitstreamInvalidValueA", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityBitstreamInvalidValueA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in subtreeTileAvailabilityBitstreamInvalidValueB", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityBitstreamInvalidValueB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in subtreeTileAvailabilityBitstreamInvalidValueC", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityBitstreamInvalidValueC.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in subtreeTileAvailabilityBitstreamLengthTooLarge", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityBitstreamLengthTooLarge.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SUBTREE_AVAILABILITY_INCONSISTENT");
  });

  it("detects issues in subtreeTileAvailabilityBitstreamLengthTooSmall", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityBitstreamLengthTooSmall.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SUBTREE_AVAILABILITY_INCONSISTENT");
  });

  it("detects issues in subtreeTileAvailabilityConstantInvalidType", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityConstantInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in subtreeTileAvailabilityConstantInvalidValue", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityConstantInvalidValue.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_LIST");
  });

  it("detects issues in subtreeTileAvailabilityForParentMissingForAvailableTile", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityForParentMissingForAvailableTile.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SUBTREE_AVAILABILITY_INCONSISTENT");
  });

  it("detects issues in subtreeTileAvailabilityInvalidType", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in subtreeTileAvailabilityMissing", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityMissing.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in subtreeTileAvailabilityMissingForAvailableContent", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityMissingForAvailableContent.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("SUBTREE_AVAILABILITY_INCONSISTENT");
  });

  it("detects issues in subtreeTileAvailabilityNeitherBitstreamNorConstant", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileAvailabilityNeitherBitstreamNorConstant.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ANY_OF_ERROR");
  });

  it("detects issues in subtreeTileMetadataInvalidType", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileMetadataInvalidType.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in subtreeTileMetadataInvalidValueA", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileMetadataInvalidValueA.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in subtreeTileMetadataInvalidValueB", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/subtreeTileMetadataInvalidValueB.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects no issues in validSubtree", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/validSubtree.json"
    );
    expect(result.length).toEqual(0);
  });

  it("detects issues in validSubtreeBuffersWithoutBufferViews", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/validSubtreeBuffersWithoutBufferViews.json"
    );
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("BUFFERS_WITHOUT_BUFFER_VIEWS");
  });

  it("detects no issues in validSubtreeNoBuffers", async function () {
    const result = await validateSpecSubtreeFile(
      "specs/data/subtrees/validSubtreeNoBuffers.json"
    );
    expect(result.length).toEqual(0);
  });

});
