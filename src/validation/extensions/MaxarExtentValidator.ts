import { defined } from "3d-tiles-tools";
import { Cartographic } from "cesium";

import { Validator } from "../Validator";
import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { JsonValidationIssues } from "../../issues/JsonValidationIssues";
import { IoValidationIssues } from "../../issues/IoValidationIssue";
import { SemanticValidationIssues } from "../../issues/SemanticValidationIssues";
import { GeojsonValidator } from "../../tileFormats/GeojsonValidator";

/**
 * A class for validating MAXAR_extent extension objects.
 *
 * @internal
 */
export class MaxarExtentValidator implements Validator<any> {
  /**
   * Performs the validation to determine whether the given tileset contains
   * a valid MAXAR_extent extension.
   *
   * @param path - The path for ValidationIssue instances
   * @param tileset - The tileset object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  async validateObject(
    path: string,
    tileset: any,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "tileset", tileset, context)) {
      return false;
    }

    let result = true;

    // If there is a MAXAR_extent extension,
    // perform the validation of the corresponding object
    const extensions = tileset.extensions;
    if (defined(extensions)) {
      const key = "MAXAR_extent";
      const extension = extensions[key];
      if (defined(extension)) {
        const extensionPath = path + "/extensions/" + key;
        const extensionValid = await MaxarExtentValidator.validateMaxarExtent(
          extensionPath,
          extension,
          tileset,
          context
        );
        if (!extensionValid) {
          result = false;
        }
      }
    }

    return result;
  }

  /**
   * Validates the MAXAR_extent extension object
   *
   * @param path - The path for ValidationIssue instances
   * @param maxar_extent - The MAXAR_extent object to validate
   * @param tileset - The tileset object containing the root tile bounding volume
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  static async validateMaxarExtent(
    path: string,
    maxar_extent: any,
    tileset: any,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "MAXAR_extent",
        maxar_extent,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the uri property (required)
    const uri = maxar_extent.uri;
    const uriPath = path + "/uri";

    if (!BasicValidator.validateString(uriPath, "uri", uri, context)) {
      result = false;
    } else {
      // Validate that the URI is not empty
      if (uri.trim().length === 0) {
        const message = "The 'uri' property must not be empty";
        const issue = JsonValidationIssues.STRING_VALUE_INVALID(
          uriPath,
          message
        );
        context.addIssue(issue);
        result = false;
      } else {
        // Validate that the URI is resolvable and contains valid GeoJSON
        const uriValid = await MaxarExtentValidator.validateUriContent(
          uriPath,
          uri,
          tileset,
          context
        );
        if (!uriValid) {
          result = false;
        }
      }
    }

    return result;
  }

  /**
   * Validates that the URI is resolvable and contains valid GeoJSON content
   * that is spatially contained within the root tile's bounding volume
   *
   * @param path - The path for ValidationIssue instances
   * @param uri - The URI to validate
   * @param tileset - The tileset object containing the root tile bounding volume
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the URI content was valid
   */
  static async validateUriContent(
    path: string,
    uri: string,
    tileset: any,
    context: ValidationContext
  ): Promise<boolean> {
    try {
      // Attempt to resolve the URI
      const resourceResolver = context.getResourceResolver();
      const uriData = await resourceResolver.resolveData(uri);

      if (!defined(uriData)) {
        const message = `The URI '${uri}' could not be resolved`;
        const issue = IoValidationIssues.IO_ERROR(path, message);
        context.addIssue(issue);
        return false;
      }

      // Validate the resolved content as GeoJSON
      const geojsonValidator = new GeojsonValidator();
      const geojsonValid = await geojsonValidator.validateObject(
        uri,
        uriData,
        context
      );

      if (!geojsonValid) {
        return false;
      }

      // Parse the GeoJSON for additional validation
      let geojsonObject: any;
      try {
        const jsonString = uriData.toString("utf-8");
        geojsonObject = JSON.parse(jsonString);
      } catch (error) {
        // JSON parsing error already handled by GeojsonValidator
        return false;
      }

      // Validate that GeoJSON contains only Polygon or MultiPolygon shapes
      const geometryValid = MaxarExtentValidator.validateGeometryTypes(
        path,
        geojsonObject,
        context
      );
      if (!geometryValid) {
        return false;
      }

      // Validate minimum coordinate count and self-intersection
      const extentValid = MaxarExtentValidator.validateExtentRequirements(
        path,
        geojsonObject,
        context
      );
      if (!extentValid) {
        return false;
      }

      // Validate spatial containment within root tile bounding volume
      const spatialValid =
        await MaxarExtentValidator.validateSpatialContainment(
          path,
          geojsonObject,
          tileset,
          context
        );

      return spatialValid;
    } catch (error) {
      const message = `Error resolving URI '${uri}': ${error}`;
      const issue = IoValidationIssues.IO_ERROR(path, message);
      context.addIssue(issue);
      return false;
    }
  }

  /**
   * Validates that all coordinates in the GeoJSON are spatially contained
   * within the root tile's bounding volume
   *
   * @param path - The path for ValidationIssue instances
   * @param geojsonObject - The parsed GeoJSON object
   * @param tileset - The tileset object containing the root tile bounding volume
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether all coordinates are contained within the bounding volume
   */
  static async validateSpatialContainment(
    path: string,
    geojsonObject: any,
    tileset: any,
    context: ValidationContext
  ): Promise<boolean> {
    // Get the root tile's bounding volume
    const rootTile = tileset.root;
    if (!defined(rootTile) || !defined(rootTile.boundingVolume)) {
      // If no root tile or bounding volume, skip spatial validation
      return true;
    }

    const boundingVolume = rootTile.boundingVolume;

    // Extract all coordinates from the GeoJSON
    const coordinates =
      MaxarExtentValidator.extractAllCoordinates(geojsonObject);

    // Check each coordinate for containment
    for (let i = 0; i < coordinates.length; i++) {
      const coord = coordinates[i];
      if (!MaxarExtentValidator.isCoordinateContained(coord, boundingVolume)) {
        const message = `GeoJSON coordinate [${coord.join(
          ", "
        )}] is not contained within the root tile's bounding volume`;
        const issue = SemanticValidationIssues.BOUNDING_VOLUMES_INCONSISTENT(
          path,
          message
        );
        context.addIssue(issue);
        return false;
      }
    }

    return true;
  }

  /**
   * Validates that the GeoJSON contains only Polygon or MultiPolygon geometries
   *
   * @param path - The path for ValidationIssue instances
   * @param geojsonObject - The parsed GeoJSON object
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether all geometries are Polygon or MultiPolygon
   */
  static validateGeometryTypes(
    path: string,
    geojsonObject: any,
    context: ValidationContext
  ): boolean {
    const invalidGeometries: string[] = [];

    function checkGeometry(geometry: any): void {
      if (!geometry || !geometry.type) {
        return;
      }

      const type = geometry.type;
      if (type !== "Polygon" && type !== "MultiPolygon") {
        if (type === "GeometryCollection") {
          // Recursively check geometries in collection
          if (geometry.geometries) {
            for (const subGeometry of geometry.geometries) {
              checkGeometry(subGeometry);
            }
          }
        } else {
          // Invalid geometry type
          invalidGeometries.push(type);
        }
      }
    }

    // Handle different GeoJSON types
    if (geojsonObject.type === "Feature") {
      checkGeometry(geojsonObject.geometry);
    } else if (geojsonObject.type === "FeatureCollection") {
      for (const feature of geojsonObject.features || []) {
        checkGeometry(feature.geometry);
      }
    } else {
      // Direct geometry object
      checkGeometry(geojsonObject);
    }

    // Report any invalid geometry types found
    if (invalidGeometries.length > 0) {
      const uniqueTypes = [...new Set(invalidGeometries)];
      const message = `MAXAR_extent GeoJSON must contain only Polygon or MultiPolygon geometries, but found: ${uniqueTypes.join(
        ", "
      )}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUMES_INCONSISTENT(
        path,
        message
      );
      context.addIssue(issue);
      return false;
    }

    return true;
  }

  /**
   * Validates extent-specific requirements: minimum coordinate count and self-intersection
   *
   * @param path - The path for ValidationIssue instances
   * @param geojsonObject - The parsed GeoJSON object
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the extent requirements are met
   */
  static validateExtentRequirements(
    path: string,
    geojsonObject: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    function validateGeometry(geometry: any): boolean {
      if (!geometry || !geometry.type || !geometry.coordinates) {
        return true; // Skip invalid geometries (already handled by GeoJSON validator)
      }

      const type = geometry.type;
      if (type === "Polygon") {
        return MaxarExtentValidator.validatePolygonExtent(
          geometry.coordinates,
          path,
          context
        );
      } else if (type === "MultiPolygon") {
        for (let i = 0; i < geometry.coordinates.length; i++) {
          if (
            !MaxarExtentValidator.validatePolygonExtent(
              geometry.coordinates[i],
              path,
              context
            )
          ) {
            return false;
          }
        }
        return true;
      } else if (type === "GeometryCollection") {
        if (geometry.geometries) {
          for (const subGeometry of geometry.geometries) {
            if (!validateGeometry(subGeometry)) {
              return false;
            }
          }
        }
        return true;
      }
      return true;
    }

    // Handle different GeoJSON types
    if (geojsonObject.type === "Feature") {
      result = validateGeometry(geojsonObject.geometry);
    } else if (geojsonObject.type === "FeatureCollection") {
      for (const feature of geojsonObject.features || []) {
        if (!validateGeometry(feature.geometry)) {
          result = false;
          break;
        }
      }
    } else {
      // Direct geometry object
      result = validateGeometry(geojsonObject);
    }

    return result;
  }

  /**
   * Validates a polygon's coordinates for extent requirements
   *
   * @param polygonCoords - The polygon coordinates array
   * @param path - The path for ValidationIssue instances
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the polygon meets extent requirements
   */
  static validatePolygonExtent(
    polygonCoords: number[][][],
    path: string,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate each ring (exterior and holes)
    for (let ringIndex = 0; ringIndex < polygonCoords.length; ringIndex++) {
      const ring = polygonCoords[ringIndex];

      // Check minimum coordinate count (at least 3 unique coordinates)
      const uniqueCoords = MaxarExtentValidator.getUniqueCoordinates(ring);
      if (uniqueCoords.length < 3) {
        const message = `Extent polygon ring must have at least 3 unique coordinates, but has ${uniqueCoords.length}`;
        const issue = SemanticValidationIssues.BOUNDING_VOLUMES_INCONSISTENT(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }

      // Check for self-intersection
      if (MaxarExtentValidator.isRingSelfIntersecting(ring)) {
        const message = `Extent polygon ring ${ringIndex} is self-intersecting, which is forbidden`;
        const issue = SemanticValidationIssues.BOUNDING_VOLUMES_INCONSISTENT(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    return result;
  }

  /**
   * Gets unique coordinates from a ring, excluding the closing coordinate
   */
  static getUniqueCoordinates(ring: number[][]): number[][] {
    if (ring.length === 0) return [];

    const unique: number[][] = [];
    const seen = new Set<string>();

    // Process all coordinates except the last one (which should close the ring)
    const coordsToCheck =
      ring.length > 0 &&
      ring[0][0] === ring[ring.length - 1][0] &&
      ring[0][1] === ring[ring.length - 1][1]
        ? ring.slice(0, -1)
        : ring;

    for (const coord of coordsToCheck) {
      const key = `${coord[0]},${coord[1]}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(coord);
      }
    }

    return unique;
  }

  /**
   * Checks if a ring is self-intersecting using a simple line segment intersection algorithm
   */
  static isRingSelfIntersecting(ring: number[][]): boolean {
    if (ring.length < 4) return false; // Need at least 4 points to form a closed polygon

    // Check each edge against every other non-adjacent edge
    for (let i = 0; i < ring.length - 1; i++) {
      const edge1Start = ring[i];
      const edge1End = ring[i + 1];

      for (let j = i + 2; j < ring.length - 1; j++) {
        // Skip adjacent edges and the closing edge
        if (j === ring.length - 2 && i === 0) continue; // Skip last edge vs first edge

        const edge2Start = ring[j];
        const edge2End = ring[j + 1];

        if (
          MaxarExtentValidator.doLineSegmentsIntersect(
            edge1Start,
            edge1End,
            edge2Start,
            edge2End
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Checks if two line segments intersect using the orientation method
   */
  static doLineSegmentsIntersect(
    p1: number[],
    q1: number[],
    p2: number[],
    q2: number[]
  ): boolean {
    const orientation = (p: number[], q: number[], r: number[]): number => {
      const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
      if (Math.abs(val) < 1e-10) return 0; // Collinear
      return val > 0 ? 1 : 2; // Clockwise or Counterclockwise
    };

    const onSegment = (p: number[], q: number[], r: number[]): boolean => {
      return (
        q[0] <= Math.max(p[0], r[0]) &&
        q[0] >= Math.min(p[0], r[0]) &&
        q[1] <= Math.max(p[1], r[1]) &&
        q[1] >= Math.min(p[1], r[1])
      );
    };

    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    // General case
    if (o1 !== o2 && o3 !== o4) return true;

    // Special cases - collinear points
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    return false;
  }

  /**
   * Extracts all coordinate arrays from a GeoJSON object
   *
   * @param geojsonObject - The GeoJSON object to extract coordinates from
   * @returns Array of coordinate arrays [longitude, latitude, optional height]
   */
  static extractAllCoordinates(geojsonObject: any): number[][] {
    const coordinates: number[][] = [];

    function extractFromGeometry(geometry: any): void {
      if (!geometry || !geometry.type || !geometry.coordinates) {
        return;
      }

      switch (geometry.type) {
        case "Point":
          coordinates.push(geometry.coordinates);
          break;
        case "LineString":
        case "MultiPoint":
          for (const coord of geometry.coordinates) {
            coordinates.push(coord);
          }
          break;
        case "Polygon":
        case "MultiLineString":
          for (const ring of geometry.coordinates) {
            for (const coord of ring) {
              coordinates.push(coord);
            }
          }
          break;
        case "MultiPolygon":
          for (const polygon of geometry.coordinates) {
            for (const ring of polygon) {
              for (const coord of ring) {
                coordinates.push(coord);
              }
            }
          }
          break;
        case "GeometryCollection":
          if (geometry.geometries) {
            for (const subGeometry of geometry.geometries) {
              extractFromGeometry(subGeometry);
            }
          }
          break;
      }
    }

    // Handle different GeoJSON types
    if (geojsonObject.type === "Feature") {
      extractFromGeometry(geojsonObject.geometry);
    } else if (geojsonObject.type === "FeatureCollection") {
      for (const feature of geojsonObject.features || []) {
        extractFromGeometry(feature.geometry);
      }
    } else {
      // Direct geometry object
      extractFromGeometry(geojsonObject);
    }

    return coordinates;
  }

  /**
   * Checks if a coordinate is contained within a bounding volume
   *
   * @param coordinate - The coordinate array [longitude, latitude, optional height]
   * @param boundingVolume - The bounding volume to check against
   * @returns Whether the coordinate is contained within the bounding volume
   */
  static isCoordinateContained(
    coordinate: number[],
    boundingVolume: any
  ): boolean {
    const longitude = coordinate[0];
    const latitude = coordinate[1];
    const height = coordinate.length > 2 ? coordinate[2] : 0.0;

    if (defined(boundingVolume.region)) {
      // For region, work directly with degrees/radians
      const cartographic = Cartographic.fromDegrees(
        longitude,
        latitude,
        height
      );
      return MaxarExtentValidator.isPointInRegion(
        cartographic,
        boundingVolume.region
      );
    } else if (defined(boundingVolume.box)) {
      // TODO: Box bounding volume spatial validation requires complex coordinate system conversion
      // For now, skip spatial validation for box bounding volumes
      return true;
    } else if (defined(boundingVolume.sphere)) {
      // TODO: Sphere bounding volume spatial validation requires complex coordinate system conversion
      // For now, skip spatial validation for sphere bounding volumes
      return true;
    }

    // Unknown bounding volume type, assume contained
    return true;
  }

  /**
   * Checks if a point is within a region bounding volume
   */
  static isPointInRegion(
    cartographic: Cartographic,
    region: number[]
  ): boolean {
    const [west, south, east, north, minHeight, maxHeight] = region;

    return (
      cartographic.longitude >= west &&
      cartographic.longitude <= east &&
      cartographic.latitude >= south &&
      cartographic.latitude <= north &&
      cartographic.height >= minHeight &&
      cartographic.height <= maxHeight
    );
  }
}
