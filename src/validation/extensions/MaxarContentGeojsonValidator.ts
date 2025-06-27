import { defined } from "3d-tiles-tools";

import { Validator } from "../Validator";
import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { StructureValidator } from "../StructureValidator";
import { JsonValidationIssues } from "../../issues/JsonValidationIssues";
import { IoValidationIssues } from "../../issues/IoValidationIssue";

/**
 * A class for the validation of `MAXAR_content_geojson` extension objects
 *
 * @internal
 */
export class MaxarContentGeojsonValidator implements Validator<any> {
  /**
   * Performs the validation of a metadata entity object that may contain
   * a `MAXAR_content_geojson` extension.
   *
   * @param path - The path for ValidationIssue instances
   * @param metadataEntity - The metadata entity object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  async validateObject(
    path: string,
    metadataEntity: any,
    context: ValidationContext
  ): Promise<boolean> {
    let result = true;

    // If there is a MAXAR_content_geojson extension,
    // perform the validation of the corresponding object
    const extensions = metadataEntity.extensions;
    if (defined(extensions)) {
      const key = "MAXAR_content_geojson";
      const extension = extensions[key];
      const extensionPath = path + "/extensions/" + key;
      const extensionValid =
        await MaxarContentGeojsonValidator.validateMaxarContentGeojson(
          extensionPath,
          extension,
          context
        );
      if (!extensionValid) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validates a MAXAR_content_geojson extension object
   *
   * @param path - The path for ValidationIssue instances
   * @param maxar_content_geojson - The MAXAR_content_geojson object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  static async validateMaxarContentGeojson(
    path: string,
    maxar_content_geojson: any,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "MAXAR_content_geojson",
        maxar_content_geojson,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate that only propertiesSchemaUri is supported (not inline propertiesSchema)
    const disallowedProperties = ["propertiesSchema"];
    if (
      !StructureValidator.validateDisallowedProperties(
        path,
        "MAXAR_content_geojson",
        maxar_content_geojson,
        disallowedProperties,
        context
      )
    ) {
      result = false;
    }

    // Validate propertiesSchemaUri property (optional)
    const propertiesSchemaUri = maxar_content_geojson.propertiesSchemaUri;
    if (defined(propertiesSchemaUri)) {
      const propertiesSchemaUriPath = path + "/propertiesSchemaUri";
      if (
        !BasicValidator.validateString(
          propertiesSchemaUriPath,
          "propertiesSchemaUri",
          propertiesSchemaUri,
          context
        )
      ) {
        result = false;
      } else {
        // Validate the referenced schema content
        const schemaValid =
          await MaxarContentGeojsonValidator.validatePropertiesSchema(
            propertiesSchemaUriPath,
            propertiesSchemaUri,
            context
          );
        if (!schemaValid) {
          result = false;
        }
      }
    }

    return result;
  }

  /**
   * Validates the properties schema referenced by propertiesSchemaUri
   *
   * @param path - The path for ValidationIssue instances
   * @param propertiesSchemaUri - The URI of the properties schema to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the schema was valid
   */
  static async validatePropertiesSchema(
    path: string,
    propertiesSchemaUri: string,
    context: ValidationContext
  ): Promise<boolean> {
    try {
      // Resolve and load the schema content
      const resourceResolver = context.getResourceResolver();
      const schemaData = await resourceResolver.resolveData(
        propertiesSchemaUri
      );

      if (!defined(schemaData)) {
        const message = `The properties schema URI '${propertiesSchemaUri}' could not be resolved`;
        const issue = IoValidationIssues.IO_ERROR(path, message);
        context.addIssue(issue);
        return false;
      }

      // Parse the schema JSON
      let schemaObject;
      try {
        const schemaString = schemaData.toString();
        schemaObject = JSON.parse(schemaString);
      } catch (error) {
        const message = `Invalid JSON in properties schema: ${error}`;
        const issue = IoValidationIssues.JSON_PARSE_ERROR(path, message);
        context.addIssue(issue);
        return false;
      }

      // Validate the schema against geojsonproperties.schema.json structure
      return MaxarContentGeojsonValidator.validateGeojsonPropertiesSchema(
        path,
        schemaObject,
        context
      );
    } catch (error) {
      const message = `Error validating properties schema: ${error}`;
      const issue = IoValidationIssues.IO_ERROR(path, message);
      context.addIssue(issue);
      return false;
    }
  }

  /**
   * Validates a GeoJSON properties schema object against the expected structure
   *
   * @param path - The path for ValidationIssue instances
   * @param schema - The schema object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the schema was valid
   */
  static validateGeojsonPropertiesSchema(
    path: string,
    schema: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "schema", schema, context)) {
      return false;
    }

    let result = true;

    // Validate required properties: semantic, geometry, properties
    const requiredProperties = ["semantic", "geometry", "properties"];
    for (const propertyName of requiredProperties) {
      const propertyPath = path + "/" + propertyName;
      if (
        !BasicValidator.validateDefined(
          propertyPath,
          propertyName,
          schema[propertyName],
          context
        )
      ) {
        result = false;
      }
    }

    // Validate semantic property
    if (defined(schema.semantic)) {
      const semanticPath = path + "/semantic";
      if (
        !BasicValidator.validateString(
          semanticPath,
          "semantic",
          schema.semantic,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate geometry property
    if (defined(schema.geometry)) {
      if (
        !MaxarContentGeojsonValidator.validateGeometrySchema(
          path + "/geometry",
          schema.geometry,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate properties array
    if (defined(schema.properties)) {
      if (
        !MaxarContentGeojsonValidator.validatePropertiesArray(
          path + "/properties",
          schema.properties,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate optional name property
    if (defined(schema.name)) {
      const namePath = path + "/name";
      if (
        !BasicValidator.validateString(namePath, "name", schema.name, context)
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validates the geometry schema object
   *
   * @param path - The path for ValidationIssue instances
   * @param geometry - The geometry object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the geometry was valid
   */
  static validateGeometrySchema(
    path: string,
    geometry: any,
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateObject(path, "geometry", geometry, context)) {
      return false;
    }

    let result = true;

    // Validate required type property
    const type = geometry.type;
    const typePath = path + "/type";
    const validTypes = [
      "Point",
      "LineString",
      "Polygon",
      "MultiPoint",
      "MultiLineString",
      "MultiPolygon",
    ];
    if (
      !BasicValidator.validateEnum(typePath, "type", type, validTypes, context)
    ) {
      result = false;
    }

    // Validate required dimensions property
    const dimensions = geometry.dimensions;
    const dimensionsPath = path + "/dimensions";
    if (
      !BasicValidator.validateIntegerRange(
        dimensionsPath,
        "dimensions",
        dimensions,
        2,
        true,
        3,
        true,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validates the properties array
   *
   * @param path - The path for ValidationIssue instances
   * @param properties - The properties array to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the properties array was valid
   */
  static validatePropertiesArray(
    path: string,
    properties: any,
    context: ValidationContext
  ): boolean {
    if (
      !BasicValidator.validateArray(
        path,
        "properties",
        properties,
        1,
        undefined,
        "object",
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate each property object
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      const propertyPath = path + "/" + i;
      if (
        !MaxarContentGeojsonValidator.validatePropertySchema(
          propertyPath,
          property,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validates a single property schema object
   *
   * @param path - The path for ValidationIssue instances
   * @param property - The property object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the property was valid
   */
  static validatePropertySchema(
    path: string,
    property: any,
    context: ValidationContext
  ): boolean {
    if (!BasicValidator.validateObject(path, "property", property, context)) {
      return false;
    }

    let result = true;

    // Validate required id property
    const id = property.id;
    const idPath = path + "/id";
    if (!BasicValidator.validateString(idPath, "id", id, context)) {
      result = false;
    }

    // Validate required type property
    const type = property.type;
    const typePath = path + "/type";
    const validTypes = ["Integer", "Float", "String", "Boolean", "Variant"];
    if (
      !BasicValidator.validateEnum(typePath, "type", type, validTypes, context)
    ) {
      result = false;
    }

    // Validate optional properties
    if (defined(property.description)) {
      const descriptionPath = path + "/description";
      if (
        !BasicValidator.validateString(
          descriptionPath,
          "description",
          property.description,
          context
        )
      ) {
        result = false;
      }
    }

    if (defined(property.unit)) {
      const unitPath = path + "/unit";
      if (
        !BasicValidator.validateString(unitPath, "unit", property.unit, context)
      ) {
        result = false;
      }
    }

    if (defined(property.semantic)) {
      const semanticPath = path + "/semantic";
      if (
        !BasicValidator.validateString(
          semanticPath,
          "semantic",
          property.semantic,
          context
        )
      ) {
        result = false;
      }
    }

    if (defined(property.required)) {
      const requiredPath = path + "/required";
      if (
        !BasicValidator.validateBoolean(
          requiredPath,
          "required",
          property.required,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate min/max properties (only for Integer and Float types)
    if (type === "Integer" || type === "Float") {
      if (defined(property.min)) {
        const minPath = path + "/min";
        if (
          !BasicValidator.validateNumber(minPath, "min", property.min, context)
        ) {
          result = false;
        }
      }

      if (defined(property.max)) {
        const maxPath = path + "/max";
        if (
          !BasicValidator.validateNumber(maxPath, "max", property.max, context)
        ) {
          result = false;
        }
      }

      // Validate that min <= max if both are defined
      if (defined(property.min) && defined(property.max)) {
        if (property.min > property.max) {
          const message = `The property min (${property.min}) must be <= max (${property.max})`;
          const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(path, message);
          context.addIssue(issue);
          result = false;
        }
      }
    }

    return result;
  }
}
