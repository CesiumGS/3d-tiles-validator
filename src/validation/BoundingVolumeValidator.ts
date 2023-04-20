import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { ExtendedObjectsValidators } from "./ExtendedObjectsValidators";

import { BoundingVolume } from "3d-tiles-tools";

import { JsonValidationIssues } from "../issues/JsonValidationIssues";
import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A class for validations related to `boundingVolume` objects.
 *
 * @internal
 */
export class BoundingVolumeValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `boundingVolume` object.
   *
   * @param boundingVolumePath - The path that indicates the location of
   * the given object, to be used in the validation issue message.
   * @param boundingVolume - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the given object is valid
   */
  static async validateBoundingVolume(
    boundingVolumePath: string,
    boundingVolume: BoundingVolume,
    context: ValidationContext
  ): Promise<boolean> {
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

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        boundingVolumePath,
        "boundingVolume",
        boundingVolume,
        context
      )
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(
        boundingVolumePath,
        boundingVolume,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(boundingVolume)) {
      return result;
    }
    if (
      !BoundingVolumeValidator.validateBoundingVolumeInternal(
        boundingVolumePath,
        boundingVolume,
        context
      )
    ) {
      result = false;
    }
    return result;
  }

  /**
   * Implementation for validateBoundingVolume
   *
   * @param boundingVolumePath - The path that indicates the location of
   * the given object, to be used in the validation issue message.
   * @param boundingVolume - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the given object is valid
   */
  private static validateBoundingVolumeInternal(
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
    const boxPath = boundingVolumePath + "/box";
    if (defined(box)) {
      if (!BoundingVolumeValidator.validateBoundingBox(boxPath, box, context)) {
        result = false;
      }
    }

    // Validate the region
    const regionPath = boundingVolumePath + "/region";
    if (defined(region)) {
      if (
        !BoundingVolumeValidator.validateBoundingRegion(
          regionPath,
          region,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the sphere
    const spherePath = boundingVolumePath + "/sphere";
    if (defined(sphere)) {
      if (
        !BoundingVolumeValidator.validateBoundingSphere(
          spherePath,
          sphere,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Perform a validation of the given `boundingVolume.box` array.
   *
   * @param path - The path for the validation issues
   * @param box - The box array
   * @param context - The `ValidationContext`
   * @returns Whether the object was valid
   */
  static validateBoundingBox(
    path: string,
    box: number[],
    context: ValidationContext
  ): boolean {
    // The box MUST be an array with length 12
    // Each element of the box MUST be a number
    const expectedLength = 12;
    const expectedElementType = "number";
    if (
      !BasicValidator.validateArray(
        path,
        "box",
        box,
        expectedLength,
        expectedLength,
        expectedElementType,
        context
      )
    ) {
      return false;
    }
    return true;
  }

  /**
   * Perform a validation of the given `boundingVolume.sphere` array.
   *
   * @param path - The path for the validation issues
   * @param sphere - The sphere array
   * @param context - The `ValidationContext`
   * @returns Whether the object was valid
   */
  static validateBoundingSphere(
    path: string,
    sphere: number[],
    context: ValidationContext
  ): boolean {
    // The sphere MUST be an array with length 4
    // Each element of the sphere MUST be a number
    const expectedLength = 4;
    const expectedElementType = "number";
    if (
      !BasicValidator.validateArray(
        path,
        "sphere",
        sphere,
        expectedLength,
        expectedLength,
        expectedElementType,
        context
      )
    ) {
      return false;
    }

    // The radius MUST NOT be negative
    const radius = sphere[3];
    if (radius < 0.0) {
      const message =
        `The 'radius' entry of the bounding sphere ` +
        `may not be negative, but is ${radius}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INVALID(
        path + "/3",
        message
      );
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Perform a validation of the given `boundingVolume.region` array.
   *
   * @param path - The path for the validation issues
   * @param region - The region array
   * @param context - The `ValidationContext`
   * @returns Whether the object was valid
   */
  static validateBoundingRegion(
    path: string,
    region: number[],
    context: ValidationContext
  ): boolean {
    // The region MUST be an array with length 6
    // Each element of the region MUST be a number
    const expectedLength = 6;
    const expectedElementType = "number";
    if (
      !BasicValidator.validateArray(
        path,
        "region",
        region,
        expectedLength,
        expectedLength,
        expectedElementType,
        context
      )
    ) {
      return false;
    }

    const westRad = region[0];
    const southRad = region[1];
    const eastRad = region[2];
    const northRad = region[3];
    const minimumHeight = region[4];
    const maximumHeight = region[5];

    let result = true;

    if (westRad < -Math.PI || westRad > Math.PI) {
      const message =
        `The 'west' entry of the bounding region ` +
        `must be in [-PI,PI], but is ${westRad}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INVALID(
        path + "/0",
        message
      );
      context.addIssue(issue);
      result = false;
    }
    if (southRad < -Math.PI / 2 || southRad > Math.PI / 2) {
      const message =
        `The 'south' entry of the bounding region ` +
        `must be in [-PI/2,PI/2], but is ${southRad}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INVALID(
        path + "/1",
        message
      );
      context.addIssue(issue);
      result = false;
    }
    if (eastRad < -Math.PI || eastRad > Math.PI) {
      const message =
        `The 'east' entry of the bounding region ` +
        `must be in [-PI,PI], but is ${eastRad}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INVALID(
        path + "/2",
        message
      );
      context.addIssue(issue);
      result = false;
    }
    if (northRad < -Math.PI / 2 || northRad > Math.PI / 2) {
      const message =
        `The 'north' entry of the bounding region ` +
        `must be in [-PI/2,PI/2], but is ${northRad}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INVALID(
        path + "/3",
        message
      );
      context.addIssue(issue);
      result = false;
    }
    if (southRad > northRad) {
      const message =
        `The 'south' entry of the bounding region ` +
        `may not be larger than the 'north' entry, but the south ` +
        `is ${southRad} and the north is ${northRad}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INVALID(
        path,
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
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INVALID(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }
    return result;
  }
}
