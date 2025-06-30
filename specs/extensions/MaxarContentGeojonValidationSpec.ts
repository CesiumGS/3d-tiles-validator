import { Validators } from "../../src/validation/Validators";

describe("Tileset MAXAR_content_geojson extension validation", function () {
  it("detects issues in invalidTilesetWithGeojson", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidTilesetWithGeojson.json"
    );
    // Expect validation error because GeoJSON content is used without
    // declaring the MAXAR_content_geojson extension in extensionsUsed
    expect(result.length).toEqual(1);

    // Should have content validation error for undeclared extension
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_ERROR");
    expect(result.get(0).message).toContain(
      "GeoJSON content is not valid by default"
    );
  });

  it("detects invalid propertiesSchemaUri type", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidPropertiesSchemaUri.json"
    );
    // Expect error for invalid propertiesSchemaUri type
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
    expect(result.get(0).message).toContain("propertiesSchemaUri");
  });

  it("detects invalid extension object type", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidExtensionObject.json"
    );
    // Expect errors for invalid extension object type
    expect(result.length).toEqual(2);
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
    expect(result.get(0).message).toContain("MAXAR_content_geojson");
    expect(result.get(1).type).toEqual("TYPE_MISMATCH");
    expect(result.get(1).message).toContain("MAXAR_content_geojson");
  });

  it("validates extension without propertiesSchemaUri", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/validTilesetWithMaxarContentGeojson.json"
    );
    // Should have no validation errors for valid tileset
    expect(result.length).toEqual(0);
  });

  it("validates extension with valid propertiesSchemaUri", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/validWithPropertiesSchemaUri.json"
    );
    // Should have no validation errors for valid tileset
    expect(result.length).toEqual(0);
  });

  it("detects errors in invalid schema content", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidSchemaContent.json"
    );
    // Should have multiple errors for invalid schema content
    expect(result.length).toBeGreaterThan(1);

    // Check that we have validation errors for the schema
    let hasSchemaErrors = false;
    for (let i = 0; i < result.length; i++) {
      if (
        result.get(i).type === "PROPERTY_MISSING" ||
        result.get(i).type === "VALUE_NOT_IN_LIST" ||
        result.get(i).type === "VALUE_NOT_IN_RANGE" ||
        result.get(i).type === "ARRAY_LENGTH_MISMATCH"
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
    // Should have IO error for missing file
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("IO_ERROR");
    expect(result.get(0).message).toContain("could not be resolved");
  });

  it("detects error when min > max in property schema", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidMinMaxTileset.json"
    );
    // Should have validation errors for min > max and missing defaults
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
  });

  it("detects error when required property has default value", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidRequiredWithDefaultTileset.json"
    );
    // Should have validation error for required with default
    expect(result.length).toEqual(1);

    // Check that we have a VALUE_NOT_IN_RANGE error for required property with default
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(0).message).toContain(
      "required property cannot have a default value"
    );
  });

  it("detects error when non-required non-Variant properties lack default values", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidMissingDefaultTileset.json"
    );
    // Should have validation errors for missing default values
    expect(result.length).toEqual(4);

    // Check that we have PROPERTY_MISSING errors for non-required properties without defaults
    let missingDefaultErrors = 0;
    for (let i = 0; i < result.length; i++) {
      if (
        result.get(i).type === "PROPERTY_MISSING" &&
        result.get(i).message.includes("must specify a default value")
      ) {
        missingDefaultErrors++;
      }
    }
    // Should have errors for String, Integer, Float, and Boolean types (4 total)
    expect(missingDefaultErrors).toEqual(4);
  });

  it("detects error when default values have incorrect types", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidDefaultTypesTileset.json"
    );
    // Should have validation errors for incorrect default value types
    expect(result.length).toEqual(5);

    // Check that we have TYPE_MISMATCH errors for incorrect default value types
    let typeMismatchErrors = 0;
    let variantDefaultErrors = 0;
    for (let i = 0; i < result.length; i++) {
      if (result.get(i).type === "TYPE_MISMATCH") {
        typeMismatchErrors++;
      }
      if (
        result.get(i).type === "VALUE_NOT_IN_RANGE" &&
        result
          .get(i)
          .message.includes(
            "Variant type properties cannot have default values"
          )
      ) {
        variantDefaultErrors++;
      }
    }
    // Should have errors for String, Integer, Float, and Boolean types with wrong defaults (4 total)
    expect(typeMismatchErrors).toEqual(4);
    // Should have error for Variant type with default value (1 total)
    expect(variantDefaultErrors).toEqual(1);
  });
});
