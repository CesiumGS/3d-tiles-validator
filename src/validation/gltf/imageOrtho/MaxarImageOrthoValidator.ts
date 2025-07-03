import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { BasicValidator } from "../../BasicValidator";
import { StructureValidator } from "../../StructureValidator";

import { GltfData } from "../GltfData";

import { JsonValidationIssues } from "../../../issues/JsonValidationIssues";
import { SemanticValidationIssues } from "../../../issues/SemanticValidationIssues";

/**
 * A class for validating the `MAXAR_image_ortho` extension in
 * glTF assets.
 *
 * This class assumes that the structure of the glTF asset itself
 * has already been validated (e.g. with the glTF Validator).
 *
 * @internal
 */
export class MaxarImageOrthoValidator {
  /**
   * Performs the validation to ensure that the `MAXAR_image_ortho`
   * extensions in the given glTF are valid
   *
   * @param path - The path for validation issues
   * @param gltfData - The glTF data, containing the parsed JSON and the
   * (optional) binary buffer
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static async validateGltf(
    path: string,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    const gltf = gltfData.gltf;

    // Check if the extension is used
    const extensionsUsed = gltf.extensionsUsed;
    if (!extensionsUsed || !extensionsUsed.includes("MAXAR_image_ortho")) {
      return true; // Extension not used, nothing to validate
    }

    let result = true;

    // Validate MAXAR_image_ortho extensions in images
    const images = gltf.images;
    if (defined(images)) {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (
          defined(image.extensions) &&
          defined(image.extensions.MAXAR_image_ortho)
        ) {
          const imagePath = path + "/images/" + i;
          const extensionPath = imagePath + "/extensions/MAXAR_image_ortho";

          if (
            !MaxarImageOrthoValidator.validateMaxarImageOrtho(
              extensionPath,
              image.extensions.MAXAR_image_ortho,
              context
            )
          ) {
            result = false;
          }
        }
      }
    }

    return result;
  }

  /**
   * Validates a MAXAR_image_ortho extension object
   *
   * @param path - The path for ValidationIssue instances
   * @param maxarImageOrtho - The MAXAR_image_ortho object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateMaxarImageOrtho(
    path: string,
    maxarImageOrtho: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "MAXAR_image_ortho",
        maxarImageOrtho,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the transform property (optional)
    const transform = maxarImageOrtho.transform;
    if (defined(transform)) {
      const transformPath = path + "/transform";
      if (
        !MaxarImageOrthoValidator.validateTransform(
          transformPath,
          transform,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the srs property (required)
    const srs = maxarImageOrtho.srs;
    const srsPath = path + "/srs";
    if (!defined(srs)) {
      const message = "The 'srs' property is required";
      const issue = JsonValidationIssues.PROPERTY_MISSING(srsPath, message);
      context.addIssue(issue);
      result = false;
    } else {
      if (!MaxarImageOrthoValidator.validateSrs(srsPath, srs, context)) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validates the transform property
   *
   * @param path - The path for ValidationIssue instances
   * @param transform - The transform array to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the transform was valid
   */
  static validateTransform(
    path: string,
    transform: any,
    context: ValidationContext
  ): boolean {
    // The transform MUST be an array with exactly 6 numbers
    const expectedLength = 6;
    const expectedElementType = "number";

    return BasicValidator.validateArray(
      path,
      "transform",
      transform,
      expectedLength,
      expectedLength,
      expectedElementType,
      context
    );
  }

  /**
   * Validates the srs (spatial reference system) property
   *
   * @param path - The path for ValidationIssue instances
   * @param srs - The srs object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the srs was valid
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

    // Validate required properties
    const requiredProperties = [
      "referenceSystem",
      "epoch",
      "coordinateSystem",
      "elevation",
    ];
    for (const property of requiredProperties) {
      if (!defined(srs[property])) {
        const propertyPath = path + "/" + property;
        const message = `The '${property}' property is required`;
        const issue = JsonValidationIssues.PROPERTY_MISSING(
          propertyPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate referenceSystem enum
    const referenceSystem = srs.referenceSystem;
    if (defined(referenceSystem)) {
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
    }

    // Validate epoch pattern
    const epoch = srs.epoch;
    if (defined(epoch)) {
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
    }

    // Validate coordinateSystem
    const coordinateSystem = srs.coordinateSystem;
    if (defined(coordinateSystem)) {
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
          !MaxarImageOrthoValidator.validateCoordinateSystem(
            coordinateSystemPath,
            coordinateSystem,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate elevation enum
    const elevation = srs.elevation;
    if (defined(elevation)) {
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
    }

    // Validate optional properties with defaults
    result =
      MaxarImageOrthoValidator.validateOptionalSrsProperties(
        path,
        srs,
        context
      ) && result;

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
    const utmPattern = /^UTM(0[123456789]|60|[12345][0123456789])[NS]$/;
    if (utmPattern.test(coordinateSystem)) {
      return true;
    }

    // Check S2 pattern: S2F[1-6]
    const s2Pattern = /^S2F[123456]$/;
    if (s2Pattern.test(coordinateSystem)) {
      return true;
    }

    // If none of the patterns match, it's invalid
    const message =
      "The 'coordinateSystem' must be 'GEOD', 'ECEF', match UTM pattern 'UTM(01-60)[NS]', or S2 pattern 'S2F[1-6]'";
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
