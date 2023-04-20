import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { ContentDataValidator } from "./ContentDataValidator";

import { BoundingVolumeChecks } from "./legacy/BoundingVolumeChecks";

import { Tile } from "3d-tiles-tools";
import { Content } from "3d-tiles-tools";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A class for validating a `Tile` and its associated `Content`.
 *
 * @internal
 */
export class TileContentValidator {
  /**
   * Validates the given tile content.
   *
   * This assumes that the given content was already determined to
   * be _structurally_ valid on the JSON level, using the
   * `ContentValidator`.
   *
   * @param contentPath - The path for `ValidationIssue` instances
   * @param content - The `Content`
   * @param tile - The tile that the content belongs to
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  static async validateTileContent(
    contentPath: string,
    content: Content,
    tile: Tile,
    context: ValidationContext
  ): Promise<boolean> {
    // If the tile is the root of an implicit tileset, then
    // there is no content to validate here. This method
    // will be called for each implicit tile during traversal,
    // and then receive the content where the appropriate
    // substitution of the template URI has been done.
    const implicitTiling = tile.implicitTiling;
    if (defined(implicitTiling)) {
      return true;
    }

    let result = true;

    // Validate the content data
    const options = context.getOptions();
    if (options.validateContentData) {
      const contentResult = await ContentDataValidator.validateContentData(
        contentPath,
        content,
        context
      );
      if (!contentResult) {
        result = false;
      }
    }
    // Validate the content bounding volume consistency
    if (
      !TileContentValidator.validateContentBoundingVolumeConsistency(
        tile,
        contentPath,
        content,
        context
      )
    ) {
      result = false;
    }
    return result;
  }

  /**
   * Validate that the content bounding volume (if present) is completely
   * contained in the tile bounding volume.
   *
   * @param tile - The containing tile
   * @param contentPath - The path for the `ValidationIssue` instances
   * @param content - The content
   * @param context - The `ValidationContext`
   * @returns Whether the bounding volumes are consistent
   */
  private static validateContentBoundingVolumeConsistency(
    tile: Tile,
    contentPath: string,
    content: Content,
    context: ValidationContext
  ): boolean {
    const contentBoundingVolume = content.boundingVolume;
    const contentBoundingVolumePath = contentPath + "/boundingVolume";
    if (!defined(contentBoundingVolume)) {
      return true;
    }
    const tileBoundingVolume = tile.boundingVolume;
    const outerTransform = tile.transform;
    const innerTransform = undefined;
    const errorMessage = BoundingVolumeChecks.checkBoundingVolume(
      contentBoundingVolume,
      tileBoundingVolume,
      innerTransform,
      outerTransform
    );
    if (defined(errorMessage)) {
      const message =
        `The content bounding volume is not contained ` +
        `in the tile bounding volume: ${errorMessage}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUMES_INCONSISTENT(
        contentBoundingVolumePath,
        message
      );
      context.addIssue(issue);
      return false;
    }
    return true;
  }
}
