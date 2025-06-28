import fs from "fs";

import { ResourceResolvers } from "3d-tiles-tools";

import { BinaryBufferStructure } from "3d-tiles-tools";

import { BinaryBufferStructureValidator } from "../src/validation/BinaryBufferStructureValidator";
import { ValidationContext } from "../src/validation/ValidationContext";

/**
 * Only for internal use and basic tests:
 *
 * Reads a JSON file, parses it, and returns the result.
 * If the file cannot be read or parsed, then an error
 * message will be printed and `undefined` is returned.
 *
 * @param filePath - The path to the file
 * @returns A promise that resolves with the result or `undefined`
 */
async function readJsonUnchecked(filePath: string): Promise<any> {
  try {
    const data = fs.readFileSync(filePath);
    if (!data) {
      console.error("Could not read " + filePath);
      return undefined;
    }
    const jsonString = data.toString();
    const result = JSON.parse(jsonString);
    return result;
  } catch (error) {
    console.error("Could not parse JSON", error);
    return undefined;
  }
}

function performTestValidation(
  binaryBufferStructure: BinaryBufferStructure,
  context: ValidationContext
): void {
  const path = "test";
  const firstBufferUriIsRequired = true;
  if (
    BinaryBufferStructureValidator.validateBinaryBufferStructure(
      path,
      binaryBufferStructure.buffers,
      binaryBufferStructure.bufferViews,
      firstBufferUriIsRequired,
      context
    )
  ) {
    BinaryBufferStructureValidator.validateBinaryBufferStructureConsistency(
      path,
      binaryBufferStructure,
      context
    );
  }
}

describe("3d-tiles-tools", function () {
  let context: ValidationContext;

  beforeEach(async function () {
    const directory = "specs/data/buffers/";
    const resourceResolver =
      ResourceResolvers.createFileResourceResolver(directory);
    context = new ValidationContext(directory, resourceResolver);
  });

  it("detects issues in buffersElementByteLengthInvalidType", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/buffersElementByteLengthInvalidType.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in buffersElementByteLengthInvalidValueA", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/buffersElementByteLengthInvalidValueA.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in buffersElementByteLengthInvalidValueB", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/buffersElementByteLengthInvalidValueB.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in buffersElementByteLengthMissing", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/buffersElementByteLengthMissing.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("PROPERTY_MISSING");
  });

  it("detects issues in buffersElementInvalidType", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/buffersElementInvalidType.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in buffersElementNameInvalidLength", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/buffersElementNameInvalidLength.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_LENGTH_MISMATCH");
  });

  it("detects issues in buffersElementNameInvalidType", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/buffersElementNameInvalidType.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in buffersElementUriInvalidType", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/buffersElementUriInvalidType.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in buffersElementUriMissing", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/buffersElementUriMissing.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("REQUIRED_VALUE_NOT_FOUND");
  });

  it("detects issues in buffersInvalidLength", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/buffersInvalidLength.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in buffersInvalidType", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/buffersInvalidType.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in bufferViewsElementBufferInvalidType", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsElementBufferInvalidType.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in bufferViewsElementBufferInvalidValueA", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsElementBufferInvalidValueA.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in bufferViewsElementBufferInvalidValueB", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsElementBufferInvalidValueB.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in bufferViewsElementBufferInvalidValueC", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsElementBufferInvalidValueC.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in bufferViewsElementByteLengthInvalidType", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsElementByteLengthInvalidType.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in bufferViewsElementByteLengthInvalidValueA", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsElementByteLengthInvalidValueA.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in bufferViewsElementByteLengthInvalidValueB", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsElementByteLengthInvalidValueB.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in bufferViewsElementByteOffsetInvalidType", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsElementByteOffsetInvalidType.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in bufferViewsElementByteOffsetInvalidValueA", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsElementByteOffsetInvalidValueA.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });

  it("detects issues in bufferViewsElementByteOffsetInvalidValueB", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsElementByteOffsetInvalidValueB.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
  });

  it("detects issues in bufferViewsElementExceedsBufferLength", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsElementExceedsBufferLength.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("BUFFERS_INCONSISTENT");
  });

  it("detects issues in bufferViewsElementInvalidType", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsElementInvalidType.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_ELEMENT_TYPE_MISMATCH");
  });

  it("detects issues in bufferViewsInvalidLength", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsInvalidLength.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("ARRAY_LENGTH_MISMATCH");
  });

  it("detects issues in bufferViewsInvalidType", async function () {
    const binaryBufferStructure = await readJsonUnchecked(
      "specs/data/buffers/bufferViewsInvalidType.json"
    );
    performTestValidation(binaryBufferStructure, context);
    const result = context.getResult();
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
  });
});
