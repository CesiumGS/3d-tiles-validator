import { Validators } from "../../src/validation/Validators";

describe("Tileset MAXAR_content_geojson extension validation", function () {
  it("detects issues in invalidTilesetWithGeojson", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidTilesetWithGeojson.json"
    );
    // Expect validation errors because GeoJSON content is used without
    // declaring the MAXAR_content_geojson extension in extensionsUsed
    expect(result.length).toEqual(2);

    // Should have content validation info for GeoJSON content
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_INFO");
    expect(result.get(0).message).toContain("caused validation infos");

    // Should have content validation error for undeclared extension
    expect(result.get(1).type).toEqual("CONTENT_VALIDATION_ERROR");
    expect(result.get(1).message).toContain(
      "GeoJSON content is not valid by default"
    );
  });

  it("detects invalid propertiesSchemaUri type", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidPropertiesSchemaUri.json"
    );
    // Expect error for invalid propertiesSchemaUri type and content validation info
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
    expect(result.get(0).message).toContain("propertiesSchemaUri");
    expect(result.get(1).type).toEqual("CONTENT_VALIDATION_INFO");
  });

  it("detects invalid extension object type", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidExtensionObject.json"
    );
    // Expect errors for invalid extension object type and content validation info
    expect(result.length).toEqual(3);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
    expect(result.get(0).message).toContain("MAXAR_content_geojson");
    expect(result.get(1).type).toEqual("TYPE_MISMATCH");
    expect(result.get(1).message).toContain("MAXAR_content_geojson");
    expect(result.get(2).type).toEqual("CONTENT_VALIDATION_INFO");
  });

  it("validates extension without propertiesSchemaUri", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/validTilesetWithMaxarContentGeojson.json"
    );
    // Should only have the content validation info, no errors
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_INFO");
  });

  it("validates extension with valid propertiesSchemaUri", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/validWithPropertiesSchemaUri.json"
    );
    // Should only have the content validation info, no errors
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_INFO");
  });

  it("detects errors in invalid schema content", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidSchemaContent.json"
    );
    // Should have content validation info and multiple errors for invalid schema content
    expect(result.length).toBeGreaterThan(1);
    expect(result.get(result.length - 1).type).toEqual(
      "CONTENT_VALIDATION_INFO"
    );
    // Check that we have validation errors for the schema
    let hasSchemaErrors = false;
    for (let i = 0; i < result.length - 1; i++) {
      if (
        result.get(i).type === "PROPERTY_MISSING" ||
        result.get(i).type === "TYPE_MISMATCH"
      ) {
        hasSchemaErrors = true;
        break;
      }
    }
    expect(hasSchemaErrors).toBe(true);
  });

  it("detects error when schema file does not exist", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/nonExistentSchema.json"
    );
    // Should have IO error for missing file and content validation info
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("IO_ERROR");
    expect(result.get(0).message).toContain("could not be resolved");
    expect(result.get(1).type).toEqual("CONTENT_VALIDATION_INFO");
  });

  it("detects error when min > max in property schema", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidMinMaxTileset.json"
    );
    // Should have content validation info and validation errors for min > max
    expect(result.length).toBeGreaterThan(1);

    // Check that we have a VALUE_NOT_IN_RANGE error for min > max
    let hasMinMaxError = false;
    for (let i = 0; i < result.length; i++) {
      if (
        result.get(i).type === "VALUE_NOT_IN_RANGE" &&
        result.get(i).message.includes("min") &&
        result.get(i).message.includes("max")
      ) {
        hasMinMaxError = true;
        break;
      }
    }
    expect(hasMinMaxError).toBe(true);

    // Should still have content validation info at the end
    expect(result.get(result.length - 1).type).toEqual(
      "CONTENT_VALIDATION_INFO"
    );
  });

  it("detects error when required property has default value", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidRequiredWithDefaultTileset.json"
    );
    // Should have content validation info and validation errors for required with default
    expect(result.length).toBeGreaterThan(1);

    // Check that we have a VALUE_NOT_IN_RANGE error for required property with default
    let hasRequiredDefaultError = false;
    for (let i = 0; i < result.length; i++) {
      if (
        result.get(i).type === "VALUE_NOT_IN_RANGE" &&
        result
          .get(i)
          .message.includes("required property cannot have a default value")
      ) {
        hasRequiredDefaultError = true;
        break;
      }
    }
    expect(hasRequiredDefaultError).toBe(true);

    // Should still have content validation info at the end
    expect(result.get(result.length - 1).type).toEqual(
      "CONTENT_VALIDATION_INFO"
    );
  });
});
