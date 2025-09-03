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
   * Epsilon value used for floating-point comparisons throughout the validator
   */
  private static readonly EPSILON = 1e-10;

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
  private static async validateMaxarExtent(
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
  private static async validateUriContent(
    path: string,
    uri: string,
    tileset: any,
    context: ValidationContext
  ): Promise<boolean> {
    // Attempt to resolve the URI
    const resourceResolver = context.getResourceResolver();
    const uriData = await resourceResolver.resolveData(uri);

    if (!defined(uriData)) {
      const message = `The URI '${uri}' could not be resolved`;
      const issue = IoValidationIssues.IO_ERROR(path, message);
      context.addIssue(issue);
      return false;
    }

    // Parse the JSON once for both GeoJSON validation and geometric validation
    let geojsonObject: any;
    try {
      const jsonString = uriData.toString("utf-8");
      geojsonObject = JSON.parse(jsonString);
    } catch (error) {
      const message = `Invalid JSON in GeoJSON file: ${error}`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(path, message);
      context.addIssue(issue);
      return false;
    }

    // Validate the parsed GeoJSON object using the static method
    const geojsonValid = await GeojsonValidator.validateGeojsonObject(
      uri,
      geojsonObject,
      context
    );

    if (!geojsonValid) {
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

    // Perform all geometric validations and accumulate results
    // This allows us to report multiple issues instead of failing on the first one
    let allValidationsValid = true;

    // Validate minimum coordinate count and self-intersection
    const extentValid = MaxarExtentValidator.validateExtentRequirements(
      path,
      geojsonObject,
      context
    );
    if (!extentValid) {
      allValidationsValid = false;
    }

    // Validate spatial containment within root tile bounding volume
    const spatialValid = await MaxarExtentValidator.validateSpatialContainment(
      path,
      geojsonObject,
      tileset,
      context
    );
    if (!spatialValid) {
      allValidationsValid = false;
    }

    return allValidationsValid;
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
  private static async validateSpatialContainment(
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
  private static validateGeometryTypes(
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
      const issue = SemanticValidationIssues.INVALID_GEOMETRY_TYPE(
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
  private static validateExtentRequirements(
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
  private static validatePolygonExtent(
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
        const issue = SemanticValidationIssues.INVALID_GEOMETRY_SIZE(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }

      // Check for self-intersection with debug details
      const intersection = MaxarExtentValidator.findRingSelfIntersection(ring);
      if (intersection) {
        const { e1s, e1e, e2s, e2e, point } = intersection;
        // Try to identify if the intersection lies exactly on an existing vertex
        const vertexIndex = point
          ? MaxarExtentValidator.findMatchingVertexIndex(ring, point)
          : -1;
        const atVertex = vertexIndex !== -1;
        const coordStr = point
          ? `[${point[0]}, ${point[1]}${
              point.length > 2 ? ", " + point[2] : ""
            }]`
          : "unknown";
        const message = atVertex
          ? `Extent polygon ring ${ringIndex} is self-intersecting, which is forbidden. Intersection at vertex ${vertexIndex} ${coordStr}`
          : `Extent polygon ring ${ringIndex} is self-intersecting, which is forbidden. Intersects between edges (${e1s}-${e1e}) and (${e2s}-${e2e}) near ${coordStr}`;
        const issue = SemanticValidationIssues.INVALID_GEOMETRY_STRUCTURE(
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
   * Uses epsilon-based comparison to handle floating point precision issues
   *
   * @param ring - Array of coordinate pairs [longitude, latitude]
   * @returns Array of unique coordinates with duplicates removed
   */
  private static getUniqueCoordinates(ring: number[][]): number[][] {
    if (ring.length === 0) return [];

    const unique: number[][] = [];

    // Process all coordinates except the last one (which should close the ring)
    const coordsToCheck =
      ring.length > 0 &&
      MaxarExtentValidator.coordinatesEqual(
        ring[0],
        ring[ring.length - 1],
        MaxarExtentValidator.EPSILON
      )
        ? ring.slice(0, -1)
        : ring;

    for (const coord of coordsToCheck) {
      // Check if this coordinate is already in the unique list
      const isDuplicate = unique.some((existingCoord) =>
        MaxarExtentValidator.coordinatesEqual(
          coord,
          existingCoord,
          MaxarExtentValidator.EPSILON
        )
      );

      if (!isDuplicate) {
        unique.push(coord);
      }
    }

    return unique;
  }

  /**
   * Compares two coordinates for equality within epsilon tolerance
   *
   * @param coord1 - First coordinate [longitude, latitude]
   * @param coord2 - Second coordinate [longitude, latitude]
   * @param epsilon - Tolerance for floating point comparison
   * @returns Whether the coordinates are equal within tolerance
   */
  private static coordinatesEqual(
    coord1: number[],
    coord2: number[],
    epsilon: number
  ): boolean {
    if (coord1.length !== coord2.length) return false;

    for (let i = 0; i < coord1.length; i++) {
      if (Math.abs(coord1[i] - coord2[i]) > epsilon) {
        return false;
      }
    }
    return true;
  }

  /**
   * Finds the first pair of intersecting non-adjacent edges in a ring and the intersection point
   * Returns indices of the edge start/end vertices and the intersection point (if computable)
   */
  private static findRingSelfIntersection(ring: number[][]): {
    e1s: number;
    e1e: number;
    e2s: number;
    e2e: number;
    point: number[] | null;
  } | null {
    if (ring.length < 4) return null;

    for (let i = 0; i < ring.length - 1; i++) {
      const a1 = ring[i];
      const a2 = ring[i + 1];

      for (let j = i + 2; j < ring.length - 1; j++) {
        if (j === ring.length - 2 && i === 0) continue; // Skip adjacent/closing edges

        const b1 = ring[j];
        const b2 = ring[j + 1];

        const point = MaxarExtentValidator.segmentsIntersectionFinite(
          a1,
          a2,
          b1,
          b2
        );
        if (point) {
          return { e1s: i, e1e: i + 1, e2s: j, e2e: j + 1, point };
        }
      }
    }

    return null;
  }

  /**
   * Find index of a vertex in ring that matches the given point within epsilon, or -1
   */
  private static findMatchingVertexIndex(
    ring: number[][],
    point: number[]
  ): number {
    for (let i = 0; i < ring.length; i++) {
      if (
        MaxarExtentValidator.coordinatesEqual(
          ring[i],
          point,
          MaxarExtentValidator.EPSILON
        )
      ) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Robust finite-segment intersection check.
   * Returns an intersection point on the finite segments (with epsilon tolerance),
   * or a representative point for collinear overlaps, or null if segments don't intersect.
   */
  private static segmentsIntersectionFinite(
    p1: number[],
    p2: number[],
    p3: number[],
    p4: number[]
  ): number[] | null {
    const eps = MaxarExtentValidator.EPSILON;

    const r = [p2[0] - p1[0], p2[1] - p1[1]];
    const s = [p4[0] - p3[0], p4[1] - p3[1]];

    const cross = (a: number[], b: number[]) => a[0] * b[1] - a[1] * b[0];

    const denom = cross(r, s);
    const qmp = [p3[0] - p1[0], p3[1] - p1[1]];
    const crossQmpR = cross(qmp, r);

    if (Math.abs(denom) < eps) {
      // Parallel: either collinear or disjoint
      if (Math.abs(crossQmpR) >= eps) {
        return null; // Parallel, non-collinear
      }
      // Collinear: check overlap in 1D along r
      const rr = r[0] * r[0] + r[1] * r[1];
      if (rr < eps) {
        return null; // Degenerate segment: |p2 - p1| ≈ 0 (within EPSILON). Intersection parameters are ill-defined; ignore as non-intersecting.
      }
      const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1];
      const t0 = dot([p3[0] - p1[0], p3[1] - p1[1]], r) / rr;
      const t1 = dot([p4[0] - p1[0], p4[1] - p1[1]], r) / rr;
      const tmin = Math.min(t0, t1);
      const tmax = Math.max(t0, t1);
      const overlapStart = Math.max(0 - eps, tmin);
      const overlapEnd = Math.min(1 + eps, tmax);
      if (overlapStart <= overlapEnd) {
        // Pick a representative point within the overlap interval, clamped to [0,1]
        const t = Math.min(1, Math.max(0, (overlapStart + overlapEnd) / 2));
        return [p1[0] + t * r[0], p1[1] + t * r[1]];
      }
      return null;
    }

    // Proper intersection: compute parameters along each segment
    const t = cross(qmp, s) / denom; // along p1->p2
    const u = cross(qmp, r) / denom; // along p3->p4

    const inside01 = (x: number) => x >= 0 && x <= 1;
    const nearEndpoint = (x: number) =>
      Math.abs(x) <= eps || Math.abs(1 - x) <= eps;

    if ((inside01(t) || nearEndpoint(t)) && (inside01(u) || nearEndpoint(u))) {
      return [p1[0] + t * r[0], p1[1] + t * r[1]];
    }

    return null;
  }
  /**
   * Extracts all coordinate arrays from a GeoJSON object
   *
   * @param geojsonObject - The GeoJSON object to extract coordinates from
   * @returns Array of coordinate arrays [longitude, latitude, optional height]
   */

  private static extractAllCoordinates(geojsonObject: any): number[][] {
    const coordinates: number[][] = [];

    function extractFromGeometry(geometry: any): void {
      if (!geometry || !geometry.type || !geometry.coordinates) {
        return;
      }

      // Only extract coordinates from Polygon and MultiPolygon geometries
      // since those are the only valid types for MAXAR_extent
      switch (geometry.type) {
        case "Polygon":
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
        // Skip other geometry types (Point, LineString, etc.) as they are invalid for MAXAR_extent
        // and should have been caught by validateGeometryTypes
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
  private static isCoordinateContained(
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
      console.warn(
        "MAXAR_extent: Spatial validation not yet implemented for box bounding volumes - skipping containment check"
      );
      return true;
    } else if (defined(boundingVolume.sphere)) {
      // TODO: Sphere bounding volume spatial validation requires complex coordinate system conversion
      // For now, skip spatial validation for sphere bounding volumes
      console.warn(
        "MAXAR_extent: Spatial validation not yet implemented for sphere bounding volumes - skipping containment check"
      );
      return true;
    }

    // Unknown bounding volume type, assume contained
    console.warn(
      "MAXAR_extent: Unknown bounding volume type - skipping containment check"
    );
    return true;
  }

  /**
   * Checks if a point is within a region bounding volume
   *
   * @param cartographic - The cartographic position to check (longitude/latitude in radians, height in meters)
   * @param region - The region array [west, south, east, north, minHeight, maxHeight] in radians and meters
   * @returns Whether the point is contained within the region bounds
   */
  private static isPointInRegion(
    cartographic: Cartographic,
    region: number[]
  ): boolean {
    // Validate region array has exactly 6 elements
    if (!region || region.length !== 6) {
      return false;
    }

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
