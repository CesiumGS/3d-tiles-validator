import { defined } from "3d-tiles-tools";

import { Validator } from "../Validator";
import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { StructureValidator } from "../StructureValidator";
import { JsonValidationIssues } from "../../issues/JsonValidationIssues";
import { MaxarValidatorCommon } from "./maxar/MaxarValidatorCommon";

/**
 * A class for the validation of `MAXAR_grid` extension objects
 *
 * @internal
 */
export class MaxarGridValidator implements Validator<any> {
  /**
   * Performs the validation of a `Tileset` object that
   * contains a `MAXAR_grid` extension object.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param tileset - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
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

    // If there is a MAXAR_grid extension,
    // perform the validation of the corresponding object
    const extensions = tileset.extensions;
    if (defined(extensions)) {
      const key = "MAXAR_grid";
      const extension = extensions[key];
      const extensionPath = path + "/" + key;
      if (
        !MaxarGridValidator.validateMaxarGrid(extensionPath, extension, context)
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validates the MAXAR_grid extension object at either tileset or tile level
   *
   * @param path - The path for ValidationIssue instances
   * @param maxar_grid - The MAXAR_grid object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateMaxarGrid(
    path: string,
    maxar_grid: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(path, "MAXAR_grid", maxar_grid, context)
    ) {
      return false;
    }

    let result = true;

    // Determine if this is a tileset-level or tile-level extension
    // Tileset-level extensions have a 'type' property
    // Tile-level extensions have 'boundingBox', 'level', and 'index' properties
    const hasType = defined(maxar_grid.type);
    const hasTileProperties =
      defined(maxar_grid.boundingBox) ||
      defined(maxar_grid.level) ||
      defined(maxar_grid.index);

    if (hasType) {
      // This is a tileset-level MAXAR_grid extension
      if (
        !MaxarGridValidator.validateTilesetMaxarGrid(path, maxar_grid, context)
      ) {
        result = false;
      }
    } else if (hasTileProperties) {
      // This is a tile-level MAXAR_grid extension
      if (
        !MaxarGridValidator.validateTileMaxarGrid(path, maxar_grid, context)
      ) {
        result = false;
      }
    } else {
      // Neither tileset nor tile properties found - this is an error
      const message =
        "MAXAR_grid extension must have either tileset-level properties (type, center, size, srs) or tile-level properties (boundingBox, level, index)";
      const issue = JsonValidationIssues.PROPERTY_MISSING(path, message);
      context.addIssue(issue);
      result = false;
    }

    return result;
  }

  /**
   * Validates the MAXAR_grid extension object at the tileset level
   *
   * @param path - The path for ValidationIssue instances
   * @param maxar_grid - The MAXAR_grid object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateTilesetMaxarGrid(
    path: string,
    maxar_grid: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate the type property (required)
    const type = maxar_grid.type;
    const typePath = path + "/type";

    if (!BasicValidator.validateString(typePath, "type", type, context)) {
      return false;
    }

    // Validate type enum values based on schema
    const validTypes = ["quad", "s2", "geod"];
    if (
      !BasicValidator.validateEnum(typePath, "type", type, validTypes, context)
    ) {
      result = false;
      return result; // Can't continue with invalid type
    }

    // Validate properties based on grid type
    if (type === "quad") {
      if (!MaxarGridValidator.validateQuadGrid(path, maxar_grid, context)) {
        result = false;
      }
    } else if (type === "s2" || type === "geod") {
      if (!MaxarGridValidator.validateS2OrGeodGrid(path, maxar_grid, context)) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validates a quad grid type MAXAR_grid extension
   * Required properties: type, center, size, srs
   *
   * @param path - The path for ValidationIssue instances
   * @param maxar_grid - The MAXAR_grid object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateQuadGrid(
    path: string,
    maxar_grid: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate center property (required for quad type)
    const center = maxar_grid.center;
    const centerPath = path + "/center";
    if (
      !BasicValidator.validateArray(
        centerPath,
        "center",
        center,
        2,
        2,
        "number",
        context
      )
    ) {
      result = false;
    }

    // Validate size property (required for quad type)
    const size = maxar_grid.size;
    const sizePath = path + "/size";
    if (
      !BasicValidator.validateArray(
        sizePath,
        "size",
        size,
        2,
        2,
        "number",
        context
      )
    ) {
      result = false;
    }

    // Validate srs property (required for quad type)
    const srs = maxar_grid.srs;
    const srsPath = path + "/srs";
    if (!BasicValidator.validateObject(srsPath, "srs", srs, context)) {
      result = false;
    } else {
      if (!MaxarValidatorCommon.validateSrs(srsPath, srs, context)) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validates an S2 or geodetic grid type MAXAR_grid extension
   * For s2/geod types, center, size, and srs properties must NOT be present
   *
   * @param path - The path for ValidationIssue instances
   * @param maxar_grid - The MAXAR_grid object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateS2OrGeodGrid(
    path: string,
    maxar_grid: any,
    context: ValidationContext
  ): boolean {
    // For s2/geod types, center, size, and srs properties must NOT be present
    const disallowedProperties = ["center", "size", "srs"];
    return StructureValidator.validateDisallowedProperties(
      path,
      "MAXAR_grid with type=s2 or type=geod",
      maxar_grid,
      disallowedProperties,
      context
    );
  }

  /**
   * Validates the MAXAR_grid extension object at the tile level
   * Required properties: boundingBox, level, index
   * Optional properties: metersPerPixel, face
   *
   * @param path - The path for ValidationIssue instances
   * @param maxar_grid - The MAXAR_grid object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateTileMaxarGrid(
    path: string,
    maxar_grid: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate boundingBox property (required)
    const boundingBox = maxar_grid.boundingBox;
    const boundingBoxPath = path + "/boundingBox";
    if (
      !BasicValidator.validateArray(
        boundingBoxPath,
        "boundingBox",
        boundingBox,
        6,
        6,
        "number",
        context
      )
    ) {
      result = false;
    } else {
      // Semantic validation: xmin <= xmax, ymin <= ymax, zmin <= zmax
      // boundingBox format: [xmin, ymin, xmax, ymax, zmin, zmax]
      const [xmin, ymin, xmax, ymax, zmin, zmax] = boundingBox;

      if (xmin > xmax) {
        const message = `The boundingBox xmin (${xmin}) must be <= xmax (${xmax})`;
        const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(
          boundingBoxPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }

      if (ymin > ymax) {
        const message = `The boundingBox ymin (${ymin}) must be <= ymax (${ymax})`;
        const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(
          boundingBoxPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }

      if (zmin > zmax) {
        const message = `The boundingBox zmin (${zmin}) must be <= zmax (${zmax})`;
        const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(
          boundingBoxPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate level property (required)
    const level = maxar_grid.level;
    const levelPath = path + "/level";
    if (
      !BasicValidator.validateIntegerRange(
        levelPath,
        "level",
        level,
        0,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate index property (required)
    const index = maxar_grid.index;
    const indexPath = path + "/index";
    if (
      !BasicValidator.validateArray(
        indexPath,
        "index",
        index,
        2,
        2,
        "number",
        context
      )
    ) {
      result = false;
    } else {
      // Validate that index values are integers >= 0
      for (let i = 0; i < index.length; i++) {
        const indexValue = index[i];
        const indexValuePath = indexPath + "/" + i;
        if (
          !BasicValidator.validateIntegerRange(
            indexValuePath,
            `index[${i}]`,
            indexValue,
            0,
            true,
            undefined,
            false,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate optional properties
    if (defined(maxar_grid.metersPerPixel)) {
      const metersPerPixel = maxar_grid.metersPerPixel;
      const metersPerPixelPath = path + "/metersPerPixel";
      if (
        !BasicValidator.validateNumberRange(
          metersPerPixelPath,
          "metersPerPixel",
          metersPerPixel,
          0,
          true,
          undefined,
          false,
          context
        )
      ) {
        result = false;
      }
    }

    if (defined(maxar_grid.face)) {
      const face = maxar_grid.face;
      const facePath = path + "/face";
      if (
        !BasicValidator.validateIntegerRange(
          facePath,
          "face",
          face,
          0,
          true,
          5,
          true,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }
}
