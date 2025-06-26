import { Validators } from "../../src/validation/Validators";

describe("Tileset MAXAR_content_geojson extension validation", function () {
  it("detects issues in validTilesetWithGeojson", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/validTilesetWithGeojson.json"
    );
    // Expect one info for skipping the GeoJSON validation
    // and one for the missing declaration of the
    // MAXAR_content_geojson usage in the extensionsUsed
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_INFO");
    expect(result.get(1).type).toEqual("EXTENSION_FOUND_BUT_NOT_USED");
  });

  it("detects invalid propertiesSchemaUri type", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidPropertiesSchemaUri.json"
    );
    // Expect multiple errors for invalid propertiesSchemaUri type (from different validation stages)
    // and one info for skipping the GeoJSON validation
    expect(result.length).toEqual(3);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
    expect(result.get(0).message).toContain("propertiesSchemaUri");
    expect(result.get(1).type).toEqual("TYPE_MISMATCH");
    expect(result.get(1).message).toContain("propertiesSchemaUri");
    expect(result.get(2).type).toEqual("CONTENT_VALIDATION_INFO");
  });

  it("detects invalid extension object type", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidExtensionObject.json"
    );
    // Expect multiple errors for invalid extension object type (from different validation stages)
    // and one error for extension not found
    expect(result.length).toEqual(5);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
    expect(result.get(0).message).toContain("MAXAR_content_geojson");
    expect(result.get(1).type).toEqual("TYPE_MISMATCH");
    expect(result.get(1).message).toContain("MAXAR_content_geojson");
    expect(result.get(2).type).toEqual("TYPE_MISMATCH");
    expect(result.get(2).message).toContain("MAXAR_content_geojson");
    expect(result.get(3).type).toEqual("TYPE_MISMATCH");
    expect(result.get(3).message).toContain("MAXAR_content_geojson");
    expect(result.get(4).type).toEqual("EXTENSION_USED_BUT_NOT_FOUND");
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
    // Should have content validation info and one IO error for missing file
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("IO_ERROR");
    expect(result.get(0).message).toContain("could not be resolved");
    expect(result.get(1).type).toEqual("CONTENT_VALIDATION_INFO");
  });
});
