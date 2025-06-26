import { defined } from "3d-tiles-tools";

import { Validator } from "../Validator";
import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { JsonValidationIssues } from "../../issues/JsonValidationIssues";

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
      if (!MaxarGridValidator.validateSrs(srsPath, srs, context)) {
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
    let result = true;

    // For s2/geod types, center, size, and srs properties must NOT be present
    if (defined(maxar_grid.center)) {
      const issue = JsonValidationIssues.TYPE_UNEXPECTED(
        path + "/center",
        "center",
        "undefined",
        "defined"
      );
      context.addIssue(issue);
      result = false;
    }

    if (defined(maxar_grid.size)) {
      const issue = JsonValidationIssues.TYPE_UNEXPECTED(
        path + "/size",
        "size",
        "undefined",
        "defined"
      );
      context.addIssue(issue);
      result = false;
    }

    if (defined(maxar_grid.srs)) {
      const issue = JsonValidationIssues.TYPE_UNEXPECTED(
        path + "/srs",
        "srs",
        "undefined",
        "defined"
      );
      context.addIssue(issue);
      result = false;
    }

    return result;
  }

  /**
   * Validates the spatial reference system (srs) object
   *
   * @param path - The path for ValidationIssue instances
   * @param srs - The srs object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateSrs(
    path: string,
    srs: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate referenceSystem (required)
    const referenceSystem = srs.referenceSystem;
    const referenceSystemPath = path + "/referenceSystem";
    if (
      !BasicValidator.validateString(
        referenceSystemPath,
        "referenceSystem",
        referenceSystem,
        context
      )
    ) {
      result = false;
    } else {
      const validReferenceSystems = ["WGS84-G1762", "ITRF2008"];
      if (
        !BasicValidator.validateEnum(
          referenceSystemPath,
          "referenceSystem",
          referenceSystem,
          validReferenceSystems,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate epoch (required)
    const epoch = srs.epoch;
    const epochPath = path + "/epoch";
    if (!BasicValidator.validateString(epochPath, "epoch", epoch, context)) {
      result = false;
    } else {
      // Validate epoch pattern: decimal year
      const epochPattern = /^[0-9]+(\.[0-9]+)?$/;
      if (!epochPattern.test(epoch)) {
        const message = `The 'epoch' property must be a decimal year string, but is '${epoch}'`;
        const issue = JsonValidationIssues.STRING_VALUE_INVALID(
          epochPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate coordinateSystem (required)
    const coordinateSystem = srs.coordinateSystem;
    const coordinateSystemPath = path + "/coordinateSystem";
    if (
      !BasicValidator.validateString(
        coordinateSystemPath,
        "coordinateSystem",
        coordinateSystem,
        context
      )
    ) {
      result = false;
    } else {
      // Validate coordinateSystem patterns
      const geodEcefPattern = /^(GEOD|ECEF)$/;
      const utmPattern = /^UTM(0[123456789]|60|[12345][0123456789])[NS]$/;
      const s2Pattern = /^S2F[123456]$/;

      if (
        !geodEcefPattern.test(coordinateSystem) &&
        !utmPattern.test(coordinateSystem) &&
        !s2Pattern.test(coordinateSystem)
      ) {
        const message = `The 'coordinateSystem' property has invalid value '${coordinateSystem}'`;
        const issue = JsonValidationIssues.STRING_VALUE_INVALID(
          coordinateSystemPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate elevation (required)
    const elevation = srs.elevation;
    const elevationPath = path + "/elevation";
    if (
      !BasicValidator.validateString(
        elevationPath,
        "elevation",
        elevation,
        context
      )
    ) {
      result = false;
    } else {
      const validElevations = ["ELLIPSOID", "EGM2008"];
      if (
        !BasicValidator.validateEnum(
          elevationPath,
          "elevation",
          elevation,
          validElevations,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate optional properties
    if (defined(srs.axis)) {
      const axis = srs.axis;
      const axisPath = path + "/axis";
      if (!BasicValidator.validateString(axisPath, "axis", axis, context)) {
        result = false;
      } else {
        const validAxis = ["NED", "ENU"];
        if (
          !BasicValidator.validateEnum(
            axisPath,
            "axis",
            axis,
            validAxis,
            context
          )
        ) {
          result = false;
        }
      }
    }

    if (defined(srs.unitHorizontal)) {
      const unitHorizontal = srs.unitHorizontal;
      const unitHorizontalPath = path + "/unitHorizontal";
      if (
        !BasicValidator.validateString(
          unitHorizontalPath,
          "unitHorizontal",
          unitHorizontal,
          context
        )
      ) {
        result = false;
      } else {
        const validUnits = ["METER", "DEGREE"];
        if (
          !BasicValidator.validateEnum(
            unitHorizontalPath,
            "unitHorizontal",
            unitHorizontal,
            validUnits,
            context
          )
        ) {
          result = false;
        }
      }
    }

    if (defined(srs.unitVertical)) {
      const unitVertical = srs.unitVertical;
      const unitVerticalPath = path + "/unitVertical";
      if (
        !BasicValidator.validateString(
          unitVerticalPath,
          "unitVertical",
          unitVertical,
          context
        )
      ) {
        result = false;
      } else {
        const validUnits = ["METER"];
        if (
          !BasicValidator.validateEnum(
            unitVerticalPath,
            "unitVertical",
            unitVertical,
            validUnits,
            context
          )
        ) {
          result = false;
        }
      }
    }

    return result;
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
    }

    // Validate level property (required)
    const level = maxar_grid.level;
    const levelPath = path + "/level";
    if (!BasicValidator.validateInteger(levelPath, "level", level, context)) {
      result = false;
    } else {
      // Level must be >= 0
      if (level < 0) {
        const message = `The 'level' property must be >= 0, but is ${level}`;
        const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(
          levelPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
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
        if (!Number.isInteger(indexValue) || indexValue < 0) {
          const message = `The 'index[${i}]' property must be an integer >= 0, but is ${indexValue}`;
          const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(
            indexValuePath,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      }
    }

    // Validate optional properties
    if (defined(maxar_grid.metersPerPixel)) {
      const metersPerPixel = maxar_grid.metersPerPixel;
      const metersPerPixelPath = path + "/metersPerPixel";
      if (
        !BasicValidator.validateNumber(
          metersPerPixelPath,
          "metersPerPixel",
          metersPerPixel,
          context
        )
      ) {
        result = false;
      } else {
        // metersPerPixel must be >= 0
        if (metersPerPixel < 0) {
          const message = `The 'metersPerPixel' property must be >= 0, but is ${metersPerPixel}`;
          const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(
            metersPerPixelPath,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      }
    }

    if (defined(maxar_grid.face)) {
      const face = maxar_grid.face;
      const facePath = path + "/face";
      if (!BasicValidator.validateInteger(facePath, "face", face, context)) {
        result = false;
      } else {
        // face must be between 0-5
        if (face < 0 || face > 5) {
          const message = `The 'face' property must be between 0-5, but is ${face}`;
          const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(
            facePath,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      }
    }

    return result;
  }
}
