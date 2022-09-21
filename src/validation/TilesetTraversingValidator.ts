import { defined } from "../base/defined";

import { ValidationContext } from "./ValidationContext";
import { ValidationState } from "./ValidationState";
import { TileValidator } from "./TileValidator";
import { TileContentValidator } from "./TileContentValidator";

import { TilesetTraverser } from "../traversal/TilesetTraverser";
import { TraversedTile } from "../traversal/TraversedTile";

import { Tileset } from "../structure/Tileset";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A validator for a `Tileset` that traverses the tile hierarchy
 * and performs the validation of the tile instances, their contents,
 * and the consistency of the tile hierarchy.
 */
export class TilesetTraversingValidator {
  /**
   * Validates the given tileset, by traversing the tile hierarchy
   * and validating each traversed tile.
   *
   * @param tileset The `Tileset`
   * @param validationState The `ValidationState`
   * @param context The `TraversalContext`
   * @returns A promise that resolves when the validation is finished
   */
  static async validateTileset(
    tileset: Tileset,
    validationState: ValidationState,
    context: ValidationContext
  ): Promise<void> {
    const depthFirst = true;
    const resourceResolver = context.getResourceResolver();
    await TilesetTraverser.traverse(
      tileset,
      resourceResolver,
      async (traversedTile) => {
        await TilesetTraversingValidator.validateTraversedTile(
          validationState,
          traversedTile,
          context
        );
        return Promise.resolve(true);
      },
      depthFirst
    );
  }

  /**
   * Validates the given traversed tile.
   *
   * This will validate the tile that is represented with the given
   * traversed tile, its contents, and the consistency of the given
   * traversed tile and its parent (if present).
   *
   * @param validationState The `ValidationState`
   * @param traversedTile The `TraversedTile`
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateTraversedTile(
    validationState: ValidationState,
    traversedTile: TraversedTile,
    context: ValidationContext
  ): Promise<void> {
    const path = traversedTile.path;
    const tile = traversedTile.asTile();

    // Validate the tile itself
    if (TileValidator.validateTile(path, tile, validationState, context)) {
      // Validate the content
      const content = tile.content;
      const contentPath = traversedTile.path + "/content";
      if (defined(content)) {
        await TileContentValidator.validateContent(
          contentPath,
          content!,
          tile,
          context
        );
      }

      // Validate the contents
      const contents = tile.contents;
      const contentsPath = traversedTile.path + "/contents";
      if (defined(contents)) {
        for (let i = 0; i < contents!.length; i++) {
          const contentsElement = contents![i];
          const contentsElementPath = contentsPath + "/" + i;
          await TileContentValidator.validateContent(
            contentsElementPath,
            contentsElement!,
            tile,
            context
          );
        }
      }
    }

    // If the traversed tile is not the root tile, validate
    // the consistency of the hierarchy
    const parent = traversedTile.getParent();
    if (defined(parent)) {
      TilesetTraversingValidator.validateTraversedTiles(
        parent!,
        traversedTile,
        context
      );
    }
  }

  /**
   * Validate the consistency of the given traversed tile instances.
   *
   * This will check the conditions that must hold for parent/child
   * tiles, for example, the consistency of the geometric error
   *
   * @param traversedParent The parent `TraversedTile`
   * @param traversedTile The current `TraversedTile`
   * @param context The `ValidationContext`
   */
  private static validateTraversedTiles(
    traversedParent: TraversedTile,
    traversedTile: TraversedTile,
    context: ValidationContext
  ): void {
    const path = traversedTile.path;
    const tile = traversedTile.asTile();
    const parent = traversedParent.asTile();

    // Validate that the parent geometricError is not larger
    // than the tile geometricError
    const parentGeometricError = parent.geometricError;
    const tileGeometricError = tile.geometricError;
    if (
      defined(tileGeometricError) &&
      defined(parentGeometricError) &&
      tileGeometricError > parentGeometricError
    ) {
      const message =
        `Tile ${path} has a geometricError of ${tileGeometricError}, ` +
        `which is larger than the parent geometricError ` +
        `of ${parentGeometricError}`;
      const issue = SemanticValidationIssues.TILE_GEOMETRIC_ERROR_INCONSISTENT(
        path,
        message
      );
      context.addIssue(issue);
    }
  }
}
