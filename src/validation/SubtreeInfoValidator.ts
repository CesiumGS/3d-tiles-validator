import { BinarySubtreeData, defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";

import { SubtreeInfos } from "3d-tiles-tools";
import { AvailabilityInfo } from "3d-tiles-tools";
import { ImplicitTilings } from "3d-tiles-tools";

import { TileImplicitTiling } from "3d-tiles-tools";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";
import { ImplicitTilingError } from "3d-tiles-tools";
import { ValidationIssues } from "../issues/ValidationIssues";

/**
 * A class for validation of subtree information.
 *
 * The methods in this class assume that the basic structure
 * of the given objects has already been validated, using
 * the `SubtreeValidator` and `SubtreeConsistencyValidator`.
 *
 * They will attempt to create instances of the "high level"
 * convenience classes from the `implicitTiling` package,
 * and perform consistency checks with these instances.
 *
 * @internal
 */
export class SubtreeInfoValidator {
  static async validateSubtreeInfo(
    path: string,
    binarySubtreeData: BinarySubtreeData,
    implicitTiling: TileImplicitTiling,
    context: ValidationContext
  ): Promise<boolean> {
    let optionalSubtreeInfo = undefined;
    try {
      optionalSubtreeInfo = SubtreeInfos.create(
        binarySubtreeData,
        implicitTiling
      );
    } catch (error) {
      if (error instanceof ImplicitTilingError) {
        const message = `Could not read subtree data: ${error.message}`;
        const issue = SemanticValidationIssues.IMPLICIT_TILING_ERROR(
          path,
          message
        );
        context.addIssue(issue);
        return false;
      }
      const message = `Internal error while reading subtree data: ${error}`;
      const issue = ValidationIssues.INTERNAL_ERROR(path, message);
      context.addIssue(issue);
      return false;
    }
    const subtreeInfo = optionalSubtreeInfo;
    const subtree = binarySubtreeData.subtree;

    let result = true;

    // Validate the tileAvailability
    const tileAvailabilityInfo = subtreeInfo.tileAvailabilityInfo;
    const tileAvailabilityInfoPath = path + "/tileAvailability";

    // Validate the tileAvailability availableCount
    if (
      !SubtreeInfoValidator.validateAvailableCount(
        tileAvailabilityInfoPath,
        "tile availability",
        subtree.tileAvailability.availableCount,
        tileAvailabilityInfo,
        context
      )
    ) {
      result = false;
    }

    // Validate the tileAvailability consistency
    if (
      !SubtreeInfoValidator.validateTileAvailabilityConsistency(
        tileAvailabilityInfoPath,
        tileAvailabilityInfo,
        implicitTiling,
        context
      )
    ) {
      result = false;
    }

    // Validate the childSubtreeAvailability
    const childSubtreeAvailabilityInfo =
      subtreeInfo.childSubtreeAvailabilityInfo;
    const childSubtreeAvailabilityInfoPath = path + "/childSubtreeAvailability";

    // Validate the childSubtreeAvailability availableCount
    if (
      !SubtreeInfoValidator.validateAvailableCount(
        childSubtreeAvailabilityInfoPath,
        "child subtree availability",
        subtree.childSubtreeAvailability.availableCount,
        childSubtreeAvailabilityInfo,
        context
      )
    ) {
      result = false;
    }

    // TOOD The validation of whether the child subtrees that are
    // marked as available are actually available is not done yet
    // (Should this really try to resolve the resource?)

    // Validate the contentAvailability
    const contentAvailabilityInfos = subtreeInfo.contentAvailabilityInfos;
    const contentAvailabilityInfosPath = path + "/contentAvailability";
    const contentAvailability = defaultValue(subtree.contentAvailability, []);
    for (let i = 0; i < contentAvailabilityInfos.length; i++) {
      // Validate each contentAvailability
      const contentAvailabilityInfo = contentAvailabilityInfos[i];
      const contentAvailabilityInfoPath =
        contentAvailabilityInfosPath + "/" + i;

      // Validate the contentAvailability availableCount
      if (
        !SubtreeInfoValidator.validateAvailableCount(
          contentAvailabilityInfoPath,
          `content availability ${i}`,
          contentAvailability[i].availableCount,
          contentAvailabilityInfo,
          context
        )
      ) {
        result = false;
      }

      // Validate that for each available content, there is als
      // an available tile
      if (
        !SubtreeInfoValidator.validateTileAvailabilityPresence(
          path,
          tileAvailabilityInfo,
          contentAvailabilityInfo,
          i,
          implicitTiling,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validates that the `availableCount` - if it is defined -
   * properly reflects the actual number of available elements
   * in the given availability info.
   *
   * If this is the case, then `true` is returned.
   *
   * If this is not the case, a `SUBTREE_AVAILABILITY_INCONSISTENT`
   * issue will be added to the given context, and `false` is returned.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param name - The name of the availability object
   * @param availableCount -
   * @param availabilityInfo - The `AvailabilityInfo`
   * @param context - The `ValidationContext`
   * @returns Whether the availability was consistent
   */
  private static validateAvailableCount(
    path: string,
    name: string,
    availableCount: number | undefined,
    availabilityInfo: AvailabilityInfo,
    context: ValidationContext
  ): boolean {
    // The availableCount is not required
    if (!defined(availableCount)) {
      return true;
    }

    // Count the number of actually available elements
    let actualAvailableCount = 0;
    for (let index = 0; index < availabilityInfo.length; index++) {
      const available = availabilityInfo.isAvailable(index);
      if (available) {
        actualAvailableCount++;
      }
    }
    if (actualAvailableCount === availableCount) {
      return true;
    }
    const message =
      `The ${name} declares an 'availableCount' of ${availableCount} ` +
      `but the number of available elements is ${actualAvailableCount}`;
    const issue = SemanticValidationIssues.SUBTREE_AVAILABILITY_INCONSISTENT(
      path,
      message
    );
    context.addIssue(issue);
    return false;
  }

  /**
   * Validate that the given tile availability is consistent,
   * meaning that for each tile that is available, the parent
   * tile is also available.
   *
   * If this is the case, then `true` is returned.
   *
   * If this is not the case, a `SUBTREE_AVAILABILITY_INCONSISTENT`
   * issue will be added to the given context, and `false` is returned.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param tileAvailabilityInfo - The `AvailabilityInfo`
   * @param implicitTiling - The `TileImplicitTiling` object
   * @param context - The `ValidationContext`
   * @returns Whether the availability was consistent
   */
  static validateTileAvailabilityConsistency(
    path: string,
    tileAvailabilityInfo: AvailabilityInfo,
    implicitTiling: TileImplicitTiling,
    context: ValidationContext
  ): boolean {
    let result = true;

    const coordinates =
      ImplicitTilings.createSubtreeCoordinatesIterator(implicitTiling);
    for (const c of coordinates) {
      const p = c.parent();
      if (defined(p)) {
        const cIndex = c.toIndex();
        const pIndex = p.toIndex();
        const cAvailable = tileAvailabilityInfo.isAvailable(cIndex);
        const pAvailable = tileAvailabilityInfo.isAvailable(pIndex);
        if (cAvailable && !pAvailable) {
          const message =
            `Tile availability declares tile at ${c} ` +
            `with index ${cIndex} to be available, but its parent ` +
            `tile at ${p} with index ${pIndex} is not available`;
          const issue =
            SemanticValidationIssues.SUBTREE_AVAILABILITY_INCONSISTENT(
              path,
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
   * Validate that the given tile availability matches the given content
   * availability, meaning that for each content that is available, the
   * corresponding tile is also available.
   *
   * If this is the case, then `true` is returned.
   *
   * If this is not the case, a `SUBTREE_AVAILABILITY_INCONSISTENT`
   * issue will be added to the given context, and `false` is returned.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param tileAvailabilityInfo - The `AvailabilityInfo` for tiles
   * @param contentAvailabilityInfo - The `AvailabilityInfo` for content
   * @param contentAvailabilityIndex - The index of the content
   * @param implicitTiling - The `TileImplicitTiling` object
   * @param context - The `ValidationContext`
   * @returns Whether the availability was consistent
   */
  static validateTileAvailabilityPresence(
    path: string,
    tileAvailabilityInfo: AvailabilityInfo,
    contentAvailabilityInfo: AvailabilityInfo,
    contentAvailabilityIndex: number,
    implicitTiling: TileImplicitTiling,
    context: ValidationContext
  ): boolean {
    let result = true;

    const coordinates =
      ImplicitTilings.createSubtreeCoordinatesIterator(implicitTiling);
    for (const c of coordinates) {
      const index = c.toIndex();
      const contentAvailable = contentAvailabilityInfo.isAvailable(index);
      const tileAvailable = tileAvailabilityInfo.isAvailable(index);
      if (contentAvailable && !tileAvailable) {
        const message =
          `Content availability ${contentAvailabilityIndex} declares ` +
          `content at ${c} with index ${index} to be available, but ` +
          `the corresponding tile is not available`;
        const issue =
          SemanticValidationIssues.SUBTREE_AVAILABILITY_INCONSISTENT(
            path,
            message
          );
        context.addIssue(issue);
        result = false;
      }
    }
    return result;
  }
}
