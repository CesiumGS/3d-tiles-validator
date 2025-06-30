import { defined } from "3d-tiles-tools";

import { Validator } from "../validation/Validator";
import { ValidationContext } from "../validation/ValidationContext";
import { BasicValidator } from "../validation/BasicValidator";
import { JsonValidationIssues } from "../issues/JsonValidationIssues";
import { ContentValidationIssues } from "../issues/ContentValidationIssues";

/**
 * A class for validating GeoJSON content data.
 *
 * This validator parses JSON from buffer data and validates it against
 * the GeoJSON specification schema, ensuring proper structure and types.
 *
 * @internal
 */
export class GeojsonValidator implements Validator<Buffer> {
  async validateObject(
    uri: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    // Parse the JSON from the buffer
    let geojsonObject: any;
    try {
      const jsonString = input.toString("utf-8");
      geojsonObject = JSON.parse(jsonString);
    } catch (error) {
      const message = `Invalid JSON in GeoJSON file: ${error}`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
        uri,
        message
      );
      context.addIssue(issue);
      return false;
    }

    // Validate the GeoJSON structure
    const result = await GeojsonValidator.validateGeojsonObject(
      uri,
      geojsonObject,
      context
    );

    return result;
  }

  /**
   * Validates a GeoJSON object against the GeoJSON specification
   *
   * @param path - The path for ValidationIssue instances
   * @param geojson - The GeoJSON object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the GeoJSON object was valid
   */
  static async validateGeojsonObject(
    path: string,
    geojson: any,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "geojson", geojson, context)) {
      return false;
    }

    // Validate required 'type' property
    if (
      !BasicValidator.validateString(
        path + "/type",
        "type",
        geojson.type,
        context
      )
    ) {
      return false;
    }

    // Validate based on GeoJSON type
    const type = geojson.type;
    switch (type) {
      case "Point":
        return GeojsonValidator.validatePoint(path, geojson, context);
      case "LineString":
        return GeojsonValidator.validateLineString(path, geojson, context);
      case "Polygon":
        return GeojsonValidator.validatePolygon(path, geojson, context);
      case "MultiPoint":
        return GeojsonValidator.validateMultiPoint(path, geojson, context);
      case "MultiLineString":
        return GeojsonValidator.validateMultiLineString(path, geojson, context);
      case "MultiPolygon":
        return GeojsonValidator.validateMultiPolygon(path, geojson, context);
      case "GeometryCollection":
        return GeojsonValidator.validateGeometryCollection(
          path,
          geojson,
          context
        );
      case "Feature":
        return GeojsonValidator.validateFeature(path, geojson, context);
      case "FeatureCollection":
        return GeojsonValidator.validateFeatureCollection(
          path,
          geojson,
          context
        );
      default: {
        const message = `Invalid GeoJSON type: ${type}. Must be one of: Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon, GeometryCollection, Feature, FeatureCollection`;
        const issue = JsonValidationIssues.VALUE_NOT_IN_LIST(
          path + "/type",
          message
        );
        context.addIssue(issue);
        return false;
      }
    }
  }

  /**
   * Validates coordinates array with minimum items requirement
   */
  private static validateCoordinatesArray(
    path: string,
    coordinates: any,
    minItems: number,
    context: ValidationContext
  ): boolean {
    if (
      !BasicValidator.validateArray(
        path,
        "coordinates",
        coordinates,
        minItems,
        undefined,
        undefined,
        context
      )
    ) {
      return false;
    }

    return true;
  }

  /**
   * Validates a position array (array of numbers with at least 2 items)
   */
  private static validatePosition(
    path: string,
    position: any,
    context: ValidationContext
  ): boolean {
    if (
      !GeojsonValidator.validateCoordinatesArray(path, position, 2, context)
    ) {
      return false;
    }

    for (let i = 0; i < position.length; i++) {
      if (
        !BasicValidator.validateNumber(
          path + `[${i}]`,
          `coordinate ${i}`,
          position[i],
          context
        )
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates optional bbox property
   */
  private static validateBbox(
    path: string,
    bbox: any,
    context: ValidationContext
  ): boolean {
    if (!defined(bbox)) {
      return true; // bbox is optional
    }

    if (
      !GeojsonValidator.validateCoordinatesArray(
        path + "/bbox",
        bbox,
        4,
        context
      )
    ) {
      return false;
    }

    for (let i = 0; i < bbox.length; i++) {
      if (
        !BasicValidator.validateNumber(
          path + `/bbox[${i}]`,
          `bbox coordinate ${i}`,
          bbox[i],
          context
        )
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates a Point geometry
   */
  private static validatePoint(
    path: string,
    point: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate required coordinates
    if (
      !GeojsonValidator.validatePosition(
        path + "/coordinates",
        point.coordinates,
        context
      )
    ) {
      result = false;
    }

    // Validate optional bbox
    if (!GeojsonValidator.validateBbox(path, point.bbox, context)) {
      result = false;
    }

    return result;
  }

  /**
   * Validates a LineString geometry
   */
  private static validateLineString(
    path: string,
    lineString: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate required coordinates
    if (
      !GeojsonValidator.validateCoordinatesArray(
        path + "/coordinates",
        lineString.coordinates,
        2,
        context
      )
    ) {
      result = false;
    } else {
      for (let i = 0; i < lineString.coordinates.length; i++) {
        if (
          !GeojsonValidator.validatePosition(
            path + `/coordinates[${i}]`,
            lineString.coordinates[i],
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate optional bbox
    if (!GeojsonValidator.validateBbox(path, lineString.bbox, context)) {
      result = false;
    }

    return result;
  }

  /**
   * Validates a Polygon geometry
   */
  private static validatePolygon(
    path: string,
    polygon: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate required coordinates
    if (
      !BasicValidator.validateArray(
        path + "/coordinates",
        "coordinates",
        polygon.coordinates,
        undefined,
        undefined,
        undefined,
        context
      )
    ) {
      result = false;
    } else {
      for (let i = 0; i < polygon.coordinates.length; i++) {
        const ringPath = path + `/coordinates[${i}]`;
        if (
          !GeojsonValidator.validateCoordinatesArray(
            ringPath,
            polygon.coordinates[i],
            4,
            context
          )
        ) {
          result = false;
        } else {
          for (let j = 0; j < polygon.coordinates[i].length; j++) {
            if (
              !GeojsonValidator.validatePosition(
                ringPath + `[${j}]`,
                polygon.coordinates[i][j],
                context
              )
            ) {
              result = false;
            }
          }
        }
      }
    }

    // Validate optional bbox
    if (!GeojsonValidator.validateBbox(path, polygon.bbox, context)) {
      result = false;
    }

    return result;
  }

  /**
   * Validates a MultiPoint geometry
   */
  private static validateMultiPoint(
    path: string,
    multiPoint: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate required coordinates
    if (
      !BasicValidator.validateArray(
        path + "/coordinates",
        "coordinates",
        multiPoint.coordinates,
        undefined,
        undefined,
        undefined,
        context
      )
    ) {
      result = false;
    } else {
      for (let i = 0; i < multiPoint.coordinates.length; i++) {
        if (
          !GeojsonValidator.validatePosition(
            path + `/coordinates[${i}]`,
            multiPoint.coordinates[i],
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate optional bbox
    if (!GeojsonValidator.validateBbox(path, multiPoint.bbox, context)) {
      result = false;
    }

    return result;
  }

  /**
   * Validates a MultiLineString geometry
   */
  private static validateMultiLineString(
    path: string,
    multiLineString: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate required coordinates
    if (
      !BasicValidator.validateArray(
        path + "/coordinates",
        "coordinates",
        multiLineString.coordinates,
        undefined,
        undefined,
        undefined,
        context
      )
    ) {
      result = false;
    } else {
      for (let i = 0; i < multiLineString.coordinates.length; i++) {
        const lineStringPath = path + `/coordinates[${i}]`;
        if (
          !GeojsonValidator.validateCoordinatesArray(
            lineStringPath,
            multiLineString.coordinates[i],
            2,
            context
          )
        ) {
          result = false;
        } else {
          for (let j = 0; j < multiLineString.coordinates[i].length; j++) {
            if (
              !GeojsonValidator.validatePosition(
                lineStringPath + `[${j}]`,
                multiLineString.coordinates[i][j],
                context
              )
            ) {
              result = false;
            }
          }
        }
      }
    }

    // Validate optional bbox
    if (!GeojsonValidator.validateBbox(path, multiLineString.bbox, context)) {
      result = false;
    }

    return result;
  }

  /**
   * Validates a MultiPolygon geometry
   */
  private static validateMultiPolygon(
    path: string,
    multiPolygon: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate required coordinates
    if (
      !BasicValidator.validateArray(
        path + "/coordinates",
        "coordinates",
        multiPolygon.coordinates,
        undefined,
        undefined,
        undefined,
        context
      )
    ) {
      result = false;
    } else {
      for (let i = 0; i < multiPolygon.coordinates.length; i++) {
        const polygonPath = path + `/coordinates[${i}]`;
        if (
          !BasicValidator.validateArray(
            polygonPath,
            "polygon",
            multiPolygon.coordinates[i],
            undefined,
            undefined,
            undefined,
            context
          )
        ) {
          result = false;
        } else {
          for (let j = 0; j < multiPolygon.coordinates[i].length; j++) {
            const ringPath = polygonPath + `[${j}]`;
            if (
              !GeojsonValidator.validateCoordinatesArray(
                ringPath,
                multiPolygon.coordinates[i][j],
                4,
                context
              )
            ) {
              result = false;
            } else {
              for (let k = 0; k < multiPolygon.coordinates[i][j].length; k++) {
                if (
                  !GeojsonValidator.validatePosition(
                    ringPath + `[${k}]`,
                    multiPolygon.coordinates[i][j][k],
                    context
                  )
                ) {
                  result = false;
                }
              }
            }
          }
        }
      }
    }

    // Validate optional bbox
    if (!GeojsonValidator.validateBbox(path, multiPolygon.bbox, context)) {
      result = false;
    }

    return result;
  }

  /**
   * Validates a GeometryCollection
   */
  private static validateGeometryCollection(
    path: string,
    geometryCollection: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate required geometries
    if (
      !BasicValidator.validateArray(
        path + "/geometries",
        "geometries",
        geometryCollection.geometries,
        undefined,
        undefined,
        undefined,
        context
      )
    ) {
      result = false;
    } else {
      for (let i = 0; i < geometryCollection.geometries.length; i++) {
        const geometryPath = path + `/geometries[${i}]`;
        if (
          !GeojsonValidator.validateGeometry(
            geometryPath,
            geometryCollection.geometries[i],
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate optional bbox
    if (
      !GeojsonValidator.validateBbox(path, geometryCollection.bbox, context)
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validates a properties object (used within Feature)
   */
  private static validateProperties(
    path: string,
    properties: any,
    context: ValidationContext
  ): boolean {
    if (properties === null) {
      return true; // null properties are allowed in Features
    }

    if (
      !BasicValidator.validateObject(path, "properties", properties, context)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Validates a geometry object (used within GeometryCollection and Feature)
   */
  private static validateGeometry(
    path: string,
    geometry: any,
    context: ValidationContext
  ): boolean {
    if (geometry === null) {
      return true; // null geometry is allowed in Features
    }

    if (!BasicValidator.validateObject(path, "geometry", geometry, context)) {
      return false;
    }

    if (
      !BasicValidator.validateString(
        path + "/type",
        "type",
        geometry.type,
        context
      )
    ) {
      return false;
    }

    const type = geometry.type;
    switch (type) {
      case "Point":
        return GeojsonValidator.validatePoint(path, geometry, context);
      case "LineString":
        return GeojsonValidator.validateLineString(path, geometry, context);
      case "Polygon":
        return GeojsonValidator.validatePolygon(path, geometry, context);
      case "MultiPoint":
        return GeojsonValidator.validateMultiPoint(path, geometry, context);
      case "MultiLineString":
        return GeojsonValidator.validateMultiLineString(
          path,
          geometry,
          context
        );
      case "MultiPolygon":
        return GeojsonValidator.validateMultiPolygon(path, geometry, context);
      default: {
        const message = `Invalid geometry type: ${type}. Must be one of: Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon`;
        const issue = JsonValidationIssues.VALUE_NOT_IN_LIST(
          path + "/type",
          message
        );
        context.addIssue(issue);
        return false;
      }
    }
  }

  /**
   * Validates a Feature object
   */
  private static validateFeature(
    path: string,
    feature: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate required properties
    if (
      !GeojsonValidator.validateProperties(
        path + "/properties",
        feature.properties,
        context
      )
    ) {
      result = false;
    }

    // Validate required geometry
    if (
      !GeojsonValidator.validateGeometry(
        path + "/geometry",
        feature.geometry,
        context
      )
    ) {
      result = false;
    }

    // Validate optional id
    if (defined(feature.id)) {
      if (typeof feature.id !== "string" && typeof feature.id !== "number") {
        const issue = JsonValidationIssues.TYPE_MISMATCH(
          path + "/id",
          "id",
          "string or number",
          typeof feature.id
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate optional bbox
    if (!GeojsonValidator.validateBbox(path, feature.bbox, context)) {
      result = false;
    }

    return result;
  }

  /**
   * Validates a FeatureCollection object
   */
  private static validateFeatureCollection(
    path: string,
    featureCollection: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate required features
    if (
      !BasicValidator.validateArray(
        path + "/features",
        "features",
        featureCollection.features,
        undefined,
        undefined,
        undefined,
        context
      )
    ) {
      result = false;
    } else {
      for (let i = 0; i < featureCollection.features.length; i++) {
        const featurePath = path + `/features[${i}]`;
        const feature = featureCollection.features[i];

        if (
          !BasicValidator.validateObject(
            featurePath,
            "feature",
            feature,
            context
          )
        ) {
          result = false;
          continue;
        }

        if (feature.type !== "Feature") {
          const message = `Feature type must be "Feature", but was "${feature.type}"`;
          const issue = JsonValidationIssues.VALUE_NOT_IN_LIST(
            featurePath + "/type",
            message
          );
          context.addIssue(issue);
          result = false;
          continue;
        }

        if (!GeojsonValidator.validateFeature(featurePath, feature, context)) {
          result = false;
        }
      }
    }

    // Validate optional bbox
    if (!GeojsonValidator.validateBbox(path, featureCollection.bbox, context)) {
      result = false;
    }

    return result;
  }
}
