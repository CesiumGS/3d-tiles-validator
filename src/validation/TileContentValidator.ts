import { defined } from "../base/defined";

import { ValidationContext } from "./ValidationContext";
import { ContentValidator } from "./ContentValidator";
import { TemplateUriValidator } from "./TemplateUriValidator";

import { BoundingVolumeChecks } from "./legacy/BoundingVolumeChecks";

import { Tile } from "../structure/Tile";
import { Content } from "../structure/Content";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A class for validating tile content.
 *
 * @private
 */
export class TileContentValidator {
  /**
   * Validates the given tile content.
   *
   * This assumes that the given content was already determined to
   * be _structurally_ valid on the JSON level, using the
   * `ContentValidator`.
   *
   * @param contentPath The path for `ValidationIssue` instances
   * @param content The `Content`
   * @param tile The tile that the content belongs to
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  static async validateContent(
    contentPath: string,
    content: Content,
    tile: Tile,
    context: ValidationContext
  ): Promise<void> {
    // Check if the tile is the root of an implicit tileset
    const implicitTiling = tile.implicitTiling;
    if (defined(implicitTiling)) {
      // Validate the content uri
      const contentUri = content.uri;
      const contentUriPath = contentPath + "/uri";
      const subdivisionScheme = implicitTiling!.subdivisionScheme;
      // The uri MUST be a template URI
      TemplateUriValidator.validateTemplateUri(
        contentUriPath,
        "uri",
        contentUri,
        subdivisionScheme,
        context
      );
    } else {
      // Validate the content data
      const options = context.getOptions();
      if (options.validateContentData) {
        await ContentValidator.validateContentData(
          contentPath,
          content,
          context
        );
      }

      // Validate the content bounding volume consistency
      TileContentValidator.validateContentBoundingVolumeConsistency(
        tile,
        contentPath,
        content,
        context
      );
    }
  }

  /**
   * Validate that the content bounding volume (if present) is completely
   * contained in the tile bounding volume.
   *
   * @param tile The containing tile
   * @param contentPath The path for the `ValidationIssue` instances
   * @param content The content
   * @param context The `ValidationContext`
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
      contentBoundingVolume!,
      tileBoundingVolume,
      innerTransform,
      outerTransform
    );
    if (defined(errorMessage)) {
      const message =
        `The content bounding volume is not contained ` +
        `in the tile bounding volume: ${errorMessage}`;
      const issue = SemanticValidationIssues.BOUNDING_VOLUME_INCONSISTENT(
        contentBoundingVolumePath,
        message
      );
      context.addIssue(issue);
      return false;
    }
    return true;
  }
}
