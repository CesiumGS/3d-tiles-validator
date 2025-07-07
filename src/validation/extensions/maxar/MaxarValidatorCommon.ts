import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { BasicValidator } from "../../BasicValidator";

import { JsonValidationIssues } from "../../../issues/JsonValidationIssues";

/**
 * A class for validating common elements that appear in both
 * `MAXAR_image_ortho` and `MAXAR_grid` extensions.
 *
 * @internal
 */
export class MaxarValidatorCommon {
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
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "srs", srs, context)) {
      return false;
    }

    let result = true;

    // Validate referenceSystem enum
    const referenceSystem = srs.referenceSystem;
    const referenceSystemPath = path + "/referenceSystem";
    const validReferenceSystemValues = ["WGS84-G1762", "ITRF2008"];
    if (
      !BasicValidator.validateEnum(
        referenceSystemPath,
        "referenceSystem",
        referenceSystem,
        validReferenceSystemValues,
        context
      )
    ) {
      result = false;
    }

    // Validate epoch pattern
    const epoch = srs.epoch;
    const epochPath = path + "/epoch";
    if (!BasicValidator.validateString(epochPath, "epoch", epoch, context)) {
      result = false;
    } else {
      const epochPattern = /^[0-9]+(\.[0-9]+)?$/;
      if (!epochPattern.test(epoch)) {
        const message =
          "The 'epoch' must match the pattern '^[0-9]+(\\.[0-9]+)?$'";
        const issue = JsonValidationIssues.STRING_VALUE_INVALID(
          epochPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate coordinateSystem
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
      if (
        !MaxarValidatorCommon.validateCoordinateSystem(
          coordinateSystemPath,
          coordinateSystem,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate elevation enum
    const elevation = srs.elevation;
    const elevationPath = path + "/elevation";
    const validElevationValues = ["ELLIPSOID", "EGM2008"];
    if (
      !BasicValidator.validateEnum(
        elevationPath,
        "elevation",
        elevation,
        validElevationValues,
        context
      )
    ) {
      result = false;
    }

    // Validate optional properties with defaults
    result =
      MaxarValidatorCommon.validateOptionalSrsProperties(path, srs, context) &&
      result;

    return result;
  }

  /**
   * Validates the coordinateSystem property which has complex validation rules
   */
  static validateCoordinateSystem(
    path: string,
    coordinateSystem: string,
    context: ValidationContext
  ): boolean {
    // Check if it's one of the simple enum values
    const simpleValues = ["GEOD", "ECEF"];
    if (simpleValues.includes(coordinateSystem)) {
      return true;
    }

    // Check UTM pattern: UTM(01-60)[NS]
    const utmPattern = /^UTM(0[1-9]|[1-5][0-9]|60)[NS]$/;
    if (utmPattern.test(coordinateSystem)) {
      return true;
    }

    // Check S2 pattern: S2F[1-6]
    const s2Pattern = /^S2F[1-6]$/;
    if (s2Pattern.test(coordinateSystem)) {
      return true;
    }

    // If none of the patterns match, it's invalid
    const message = `The 'coordinateSystem' value '${coordinateSystem}' is invalid. It must be 'GEOD', 'ECEF', match UTM pattern 'UTM(01-60)[NS]', or S2 pattern 'S2F[1-6]'`;
    const issue = JsonValidationIssues.STRING_VALUE_INVALID(path, message);
    context.addIssue(issue);
    return false;
  }

  /**
   * Validates optional SRS properties with their default values and constraints
   */
  static validateOptionalSrsProperties(
    path: string,
    srs: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate axis enum (optional, default: "NED")
    const axis = srs.axis;
    if (defined(axis)) {
      const axisPath = path + "/axis";
      const validAxisValues = ["NED", "ENU"];
      if (
        !BasicValidator.validateEnum(
          axisPath,
          "axis",
          axis,
          validAxisValues,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate unitHorizontal enum (optional, default: "METER")
    const unitHorizontal = srs.unitHorizontal;
    if (defined(unitHorizontal)) {
      const unitHorizontalPath = path + "/unitHorizontal";
      const validUnitHorizontalValues = ["METER", "DEGREE"];
      if (
        !BasicValidator.validateEnum(
          unitHorizontalPath,
          "unitHorizontal",
          unitHorizontal,
          validUnitHorizontalValues,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate unitVertical enum (optional, default: "METER")
    const unitVertical = srs.unitVertical;
    if (defined(unitVertical)) {
      const unitVerticalPath = path + "/unitVertical";
      const validUnitVerticalValues = ["METER"];
      if (
        !BasicValidator.validateEnum(
          unitVerticalPath,
          "unitVertical",
          unitVertical,
          validUnitVerticalValues,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }
}
