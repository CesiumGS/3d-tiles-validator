import { defined } from "../base/defined";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";

import { BoundingVolume } from "../structure/BoundingVolume";

import { JsonValidationIssues } from "../issues/JsonValidationIssues";
import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A class for validations related to `boundingVolume` objects.
 *
 * @private
 */
export class BoundingVolumeValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `boundingVolume` object.
   *
   * @param boundingVolumePath The path that indicates the location of
   * the given object, to be used in the validation issue message.
   * @param boundingVolume The object to validate
   * @param context The `ValidationContext` that any issues will be added to
   * @returns Whether the given object is valid
   */
  static validateBoundingVolume(
    boundingVolumePath: string,
    boundingVolume: BoundingVolume,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        boundingVolumePath,
        "boundingVolume",
        boundingVolume,
        context
      )
    ) {
      return false;
    }

    let result = true;

    const box = boundingVolume.box;
    const region = boundingVolume.region;
    const sphere = boundingVolume.sphere;

    // The bounding volume MUST contain one of these properties
    if (!defined(box) && !defined(region) && !defined(sphere)) {
      const path = boundingVolumePath;
      const issue = JsonValidationIssues.ANY_OF_ERROR(
        path,
        "boundingVolume",
        "box",
        "region",
        "sphere"
      );
      context.addIssue(issue);
      result = false;
    }

    // Validate the box
    if (defined(box)) {
      // The box MUST be an array with length 12
      // Each element of the box MUST be a number
      const expectedLength = 12;
      const expectedElementType = "number";
      const boxPath = boundingVolumePath + "/box";
      if (
        !BasicValidator.validateArray(
          boxPath,
          "box",
          box,
          expectedLength,
          expectedLength,
          expectedElementType,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the region
    if (defined(region)) {
      // The region MUST be an array with length 6
      // Each element of the region MUST be a number
      const expectedLength = 6;
      const expectedElementType = "number";
      const regionPath = boundingVolumePath + "/region";
      if (
        !BasicValidator.validateArray(
          regionPath,
          "region",
          region,
          expectedLength,
          expectedLength,
          expectedElementType,
          context
        )
      ) {
        result = false;
      } else {
        if (
          !BoundingVolumeValidator.validateBoundingRegion(
            regionPath,
            region!,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate the sphere
    if (defined(sphere)) {
      // The sphere MUST be an array with length 4
      // Each element of the sphere MUST be a number
      const expectedLength = 4;
      const expectedElementType = "number";
      const spherePath = boundingVolumePath + "/sphere";
      if (
        !BasicValidator.validateArray(
          spherePath,
          "sphere",
          sphere,
          expectedLength,
          expectedLength,
          expectedElementType,
          context
        )
      ) {
        result = false;
      } else {
        // The radius MUST NOT be negative
        const radius = sphere![3];
        if (radius < 0.0) {
          const message =
            `The 'radius' entry of the bounding sphere ` +
            `may not be negative, but is ${radius}`;
          const issue = SemanticValidationIssues.BOUNDING_VOLUME_INCONSISTENT(
            spherePath + "/3",
            message
          );
          context.addIssue(issue);
          result = false;
        }
      }
    }
    return result;
  }

  /**
   * Perform a validation of the given `boundingVolume.region` array.
   *
   * This assumes that the array is an array of 6 numbers, and checks the
   * constraints of these west/south/east/north/minHeight/maxHeight entries
   *
   * @param regionPath The path for the validation issues
   * @param region The region array
   * @param context The `ValidationContext`
   * @returns Whether the object was valid
   */
  private static validateBoundingRegion(
    regionPath: string,
    region: number[],
    context: ValidationContext
  ): boolean {
    const west = region[0];
    const south = region[1];
    const east = region[2];
    const north = region[3];
    const minimumHeight = region[4];
    const maximumHeight = region[5];

    let result = true;

    if (west < -180.0 || west > 180) {
      const message =
        `The 'west' entry of the bounding region ` +
        `must be in [-180,180], but is ${west}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INCONSISTENT(
        regionPath + "/0",
        message
      );
      context.addIssue(issue);
      result = false;
    }
    if (south < -90.0 || south > 90) {
      const message =
        `The 'south' entry of the bounding region ` +
        `must be in [-90,90], but is ${south}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INCONSISTENT(
        regionPath + "/1",
        message
      );
      context.addIssue(issue);
      result = false;
    }
    if (east < -180.0 || east > 180) {
      const message =
        `The 'east' entry of the bounding region ` +
        `must be in [-180,180], but is ${east}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INCONSISTENT(
        regionPath + "/2",
        message
      );
      context.addIssue(issue);
      result = false;
    }
    if (north < -90.0 || north > 90) {
      const message =
        `The 'north' entry of the bounding region ` +
        `must be in [-90,90], but is ${north}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INCONSISTENT(
        regionPath + "/3",
        message
      );
      context.addIssue(issue);
      result = false;
    }
    if (south > north) {
      const message =
        `The 'south' entry of the bounding region ` +
        `may not be larger than the 'north' entry, but the south ` +
        `is ${south} and the north is ${north}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INCONSISTENT(
        regionPath,
        message
      );
      context.addIssue(issue);
      result = false;
    }
    if (minimumHeight > maximumHeight) {
      const message =
        `The minimum height of the bounding region ` +
        `may not be larger than the maximum height, but the minimum height ` +
        `is ${minimumHeight} and the maximum height is ${maximumHeight}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INCONSISTENT(
        regionPath,
        message
      );
      context.addIssue(issue);
      result = false;
    }
    return result;
  }
}
