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

    // Should have exactly 7 errors for invalid schema content
    expect(result.length).toEqual(7);

    // Check that we have validation errors for the schema
    expect(result.get(0).message).toContain("property is required");

    expect(result.get(1).type).toEqual("VALUE_NOT_IN_LIST");
    expect(result.get(1).message).toContain("InvalidGeometryType");

    expect(result.get(2).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(2).message).toContain("property must be in");

    expect(result.get(3).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(3).message).toContain("requires dimensions");

    expect(result.get(4).type).toEqual("STRING_LENGTH_MISMATCH");
    expect(result.get(4).message).toContain("must have a length of at least 1");

    expect(result.get(5).type).toEqual("VALUE_NOT_IN_LIST");
    expect(result.get(5).message).toContain("InvalidType");

    expect(result.get(6).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(6).message).toContain(
      "can only be used with Integer and Float types"
    );
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

    // Should have exactly 1 validation errors for min > max
    expect(result.length).toEqual(1);

    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(0).message).toContain("min");
    expect(result.get(0).message).toContain("must be <= max");
  });

  it("detects error when required property has default value", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidRequiredWithDefaultTileset.json"
    );
    // Should have content validation info and validation errors for required with default
    expect(result.length).toEqual(1);

    // Check that we have a VALUE_NOT_IN_RANGE error for required property with default
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(0).message).toContain(
      "A required property cannot have a default value"
    );
  });

  it("validates non-required properties without default values (defaults to null)", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/validOptionalWithoutDefaultsTileset.json"
    );

    // Should have no validation errors for valid tileset
    expect(result.length).toEqual(0);
  });

  it("detects error when default values have incorrect types", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidDefaultTypesTileset.json"
    );

    expect(result.length).toEqual(5);

    // Check that we have TYPE_MISMATCH errors for incorrect default value types
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
    expect(result.get(0).message).toContain(
      "property must have type 'string', but has type 'number'"
    );

    expect(result.get(1).type).toEqual("TYPE_MISMATCH");
    expect(result.get(1).message).toContain(
      "roperty must have type 'integer', but has type 'string'"
    );

    expect(result.get(2).type).toEqual("TYPE_MISMATCH");
    expect(result.get(2).message).toContain(
      "property must have type 'number', but has type 'boolean'"
    );

    expect(result.get(3).type).toEqual("TYPE_MISMATCH");
    expect(result.get(3).message).toContain(
      "property must have type 'boolean', but has type 'string'"
    );

    expect(result.get(4).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(4).message).toContain(
      "Variant type properties cannot have default values"
    );
  });

  it("detects error when propertiesSchemaUri has invalid URI format", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidUriFormat.json"
    );
    // Should have validation error for invalid URI format
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_VALUE_INVALID");
    expect(result.get(0).message).toContain("must be a valid URI");
  });

  it("detects error when min/max properties are used on non-numeric types", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidMinMaxOnNonNumericType.json"
    );

    expect(result.length).toEqual(3);

    // Check that we have VALUE_NOT_IN_RANGE errors for min/max on wrong types
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(0).message).toContain(
      "Properties 'min' and 'max' can only be used with Integer and Float types, but property type is 'String'"
    );

    expect(result.get(1).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(1).message).toContain(
      "Properties 'min' and 'max' can only be used with Integer and Float types, but property type is 'Boolean'"
    );

    expect(result.get(2).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(2).message).toContain(
      "Properties 'min' and 'max' can only be used with Integer and Float types, but property type is 'Variant'"
    );
  });

  it("validates non-required properties without default values (defaults to null)", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/validOptionalWithoutDefaultsTileset.json"
    );

    // Should have no validation errors - non-required properties are allowed to omit defaults
    expect(result.length).toEqual(0);
  });

  it("detects error when default values have incorrect types", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidDefaultTypesTileset.json"
    );

    expect(result.length).toEqual(5);

    // Check that we have TYPE_MISMATCH errors for incorrect default value types
    expect(result.get(0).type).toEqual("TYPE_MISMATCH");
    expect(result.get(0).message).toContain(
      "property must have type 'string', but has type 'number'"
    );

    expect(result.get(1).type).toEqual("TYPE_MISMATCH");
    expect(result.get(1).message).toContain(
      "roperty must have type 'integer', but has type 'string'"
    );

    expect(result.get(2).type).toEqual("TYPE_MISMATCH");
    expect(result.get(2).message).toContain(
      "property must have type 'number', but has type 'boolean'"
    );

    expect(result.get(3).type).toEqual("TYPE_MISMATCH");
    expect(result.get(3).message).toContain(
      "property must have type 'boolean', but has type 'string'"
    );

    expect(result.get(4).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(4).message).toContain(
      "Variant type properties cannot have default values"
    );
  });

  it("detects error when propertiesSchemaUri has invalid URI format", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidUriFormat.json"
    );
    // Should have validation error for invalid URI format
    expect(result.length).toEqual(1);
    expect(result.get(0).type).toEqual("STRING_VALUE_INVALID");
    expect(result.get(0).message).toContain("must be a valid URI");
  });

  it("detects error when min/max properties are used on non-numeric types", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/invalidMinMaxOnNonNumericType.json"
    );

    expect(result.length).toEqual(3);

    // Check that we have VALUE_NOT_IN_RANGE errors for min/max on wrong types
    expect(result.get(0).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(0).message).toContain(
      "Properties 'min' and 'max' can only be used with Integer and Float types, but property type is 'String'"
    );

    expect(result.get(1).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(1).message).toContain(
      "Properties 'min' and 'max' can only be used with Integer and Float types, but property type is 'Boolean'"
    );

    expect(result.get(2).type).toEqual("VALUE_NOT_IN_RANGE");
    expect(result.get(2).message).toContain(
      "Properties 'min' and 'max' can only be used with Integer and Float types, but property type is 'Variant'"
    );
  });

  it("detects error when GeoJSON contains bare geometry instead of Feature or FeatureCollection", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/bareGeometryTileset.json"
    );

    // Should have validation error because while bare geometry is technically valid GeoJSON,
    // most GeoJSON consumers expect Features or FeatureCollections at the root level
    expect(result.length).toEqual(1);

    // Check that we have a content validation error for the bare geometry
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_ERROR");
    expect(result.get(0).message).toContain(
      "bare_geometry.geojson caused validation errors"
    );
  });

  it("detects error when GeoJSON contains GeometryCollection geometry", async function () {
    const result = await Validators.validateTilesetFile(
      "specs/data/extensions/maxarContentGeojson/geometryCollectionTileset.json"
    );

    // Should have validation error because GeometryCollection is not supported
    // by the MAXAR_content_geojson extension, even though it's valid GeoJSON
    expect(result.length).toEqual(1);

    // Check that we have a content validation error for the GeometryCollection
    expect(result.get(0).type).toEqual("CONTENT_VALIDATION_ERROR");
    expect(result.get(0).message).toContain(
      "geometryCollection.geojson caused validation errors"
    );

    // Check that the specific error message mentions MAXAR_content_geojson extension
    expect(result.get(0).causes.length).toEqual(1);
    expect(result.get(0).causes[0].type).toEqual("VALUE_NOT_IN_LIST");
    expect(result.get(0).causes[0].message).toContain(
      "GeometryCollection is not supported by the MAXAR_content_geojson extension"
    );
    expect(result.get(0).causes[0].message).toContain(
      "Supported geometry types are: Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon"
    );
  });
});
