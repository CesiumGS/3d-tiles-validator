import { defined } from "../base/defined";

import { ValidationContext } from "./ValidationContext";
import { ValidationState } from "./ValidationState";
import { TileValidator } from "./TileValidator";
import { TileContentValidator } from "./TileContentValidator";
import { SubtreeValidator } from "./SubtreeValidator";

import { TilesetTraverser } from "../traversal/TilesetTraverser";
import { TraversedTile } from "../traversal/TraversedTile";
import { ImplicitTraversedTile } from "../traversal/ImplicitTraversedTile";
import { ExplicitTraversedTile } from "../traversal/ExplicitTraversedTile";

import { ImplicitTilingError } from "../implicitTiling/ImplicitTilingError";
import { ImplicitTilings } from "../implicitTiling/ImplicitTilings";
import { TreeCoordinates } from "../implicitTiling/TreeCoordinates";

import { Tileset } from "../structure/Tileset";
import { TileImplicitTiling } from "../structure/TileImplicitTiling";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";
import { ValidationIssues } from "../issues/ValidationIssues";

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
   * and indicates whether every traversed tile was valid.
   */
  static async validateTileset(
    tileset: Tileset,
    validationState: ValidationState,
    context: ValidationContext
  ): Promise<boolean> {
    const depthFirst = true;
    const resourceResolver = context.getResourceResolver();
    let result = true;
    try {
      await TilesetTraverser.traverse(
        tileset,
        resourceResolver,
        async (traversedTile) => {
          // Validate the tile, and only continue the traversal
          // if it was found to be valid
          const isValid =
            await TilesetTraversingValidator.validateTraversedTile(
              validationState,
              traversedTile,
              context
            );
          if (!isValid) {
            result = false;
          }
          return isValid;
        },
        depthFirst
      );
    } catch (error) {
      // There may be different kinds of errors that are thrown
      // during the traveral of the tileset and its validation.
      // An `ImplicitTilingError` indicates that an implicit
      // tileset was invalid (e.g. a missing subtree file or
      // one of its buffers). The `ImplicitTilingError` is
      // supposed to contain more detailed information.
      if (error instanceof ImplicitTilingError) {
        const message = `Could not traverse tileset: ${error.message}`;
        const issue = SemanticValidationIssues.IMPLICIT_TILING_ERROR(
          "",
          message
        );
        context.addIssue(issue);
        result = false;
      } else {
        // Other kinds of errors should not bubble up to the caller,
        // and are therefore collected here as `INTERNAL_ERROR`.
        // Whether or not this should cause the object to be
        // reported as "invalid" is up to debate. But to reduce
        // the number of follow-up errors, the object will be
        // reported as invalid here.
        const message = `Internal error while traversing tileset: ${error}`;
        const issue = ValidationIssues.INTERNAL_ERROR("", message);
        context.addIssue(issue);
        result = false;
      }
    }
    return result;
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
  ): Promise<boolean> {
    const path = traversedTile.path;
    const tile = traversedTile.asTile();

    // Validate the tile itself
    if (!TileValidator.validateTile(path, tile, validationState, context)) {
      return false;
    }

    // Check if the given traversed tile is the root of a subtree,
    // and perform the validation of the associated subtree data
    const subtreeRootValid =
      await TilesetTraversingValidator.validateSubtreeRoot(
        traversedTile,
        validationState,
        context
      );
    if (!subtreeRootValid) {
      return false;
    }

    let result = true;

    // Validate the content
    const content = tile.content;
    const contentPath = traversedTile.path + "/content";
    if (defined(content)) {
      const contentResult = await TileContentValidator.validateTileContent(
        contentPath,
        content!,
        tile,
        context
      );
      if (!contentResult) {
        result = false;
      }
    }

    // Validate the contents
    const contents = tile.contents;
    const contentsPath = traversedTile.path + "/contents";
    if (defined(contents)) {
      for (let i = 0; i < contents!.length; i++) {
        const contentsElement = contents![i];
        const contentsElementPath = contentsPath + "/" + i;
        const contentResult = await TileContentValidator.validateTileContent(
          contentsElementPath,
          contentsElement!,
          tile,
          context
        );
        if (!contentResult) {
          result = false;
        }
      }
    }

    // If the traversed tile is not the root tile, validate
    // the consistency of the hierarchy
    const parent = traversedTile.getParent();
    if (defined(parent)) {
      if (
        !TilesetTraversingValidator.validateTraversedTiles(
          parent!,
          traversedTile,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Check if the given traversed tile is the root of a subtree, and
   * if it is, perform the validation of the associated subtree data.
   *
   * @param traversedTile The `TraversedTile`
   * @param validationState The `ValidationState`
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateSubtreeRoot(
    traversedTile: TraversedTile,
    validationState: ValidationState,
    context: ValidationContext
  ): Promise<boolean> {
    // NOTE: This is somewhat ugly. It HAS to drill a hole into
    // the abstraction that is achieved with the `TraversedTile`,
    // in order to detect whether the tile is a root of a subtree,
    // (which is otherwise intentionally hidden in the interface)
    const path = traversedTile.path;

    // An `ExplicitTraversedTile` that has an `implicitTiling`
    // is the root of a subtree.
    if (traversedTile instanceof ExplicitTraversedTile) {
      const explicitTraversedTile = traversedTile as ExplicitTraversedTile;
      const tile = explicitTraversedTile.asTile();
      const implicitTiling = tile.implicitTiling;
      if (defined(implicitTiling)) {
        const rootCoordinates = ImplicitTilings.createRootCoordinates(
          implicitTiling!
        );
        const result =
          await TilesetTraversingValidator.validateSubtreeRootInternal(
            path,
            implicitTiling!,
            rootCoordinates,
            validationState,
            context
          );
        return result;
      }
    }

    // An `ImplicitTraversedTile` is the root of a subtree when
    // its local coordinates within that tree have level 0
    if (traversedTile instanceof ImplicitTraversedTile) {
      const implicitTraversedTile = traversedTile as ImplicitTraversedTile;
      const localCoordinate = implicitTraversedTile.getLocalCoordinate();
      if (localCoordinate.level === 0) {
        const rootCoordinates = implicitTraversedTile.getGlobalCoordinate();
        const implicitTiling = implicitTraversedTile.getImplicitTiling();
        const result =
          await TilesetTraversingValidator.validateSubtreeRootInternal(
            path,
            implicitTiling!,
            rootCoordinates,
            validationState,
            context
          );
        return result;
      }
    }
    return true;
  }

  /**
   * Performs the validation to make sure that the specified subtree
   * root is valid.
   *
   * This will attempt to resolve the `.subtree` (or subtree JSON)
   * data from the URI that is created by substituting the given
   * coordinates into the subtree template URI of the implicit tiling,
   * resolve the resulting data, and pass it to a `SubtreeValidator`.
   *
   * @param path The path for `ValidationIssue` instances
   * @param implicitTiling The `TileImpllicitTiling`
   * @param coordinates The coordinates of the subtree root
   * @param validationState The `ValidationState`
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateSubtreeRootInternal(
    path: string,
    implicitTiling: TileImplicitTiling,
    coordinates: TreeCoordinates,
    validationState: ValidationState,
    context: ValidationContext
  ): Promise<boolean> {
    const subtreeUri = ImplicitTilings.substituteTemplateUri(
      implicitTiling.subdivisionScheme,
      implicitTiling.subtrees.uri,
      coordinates
    );
    if (!defined(subtreeUri)) {
      const message =
        `Could not substitute coordinates ${coordinates} in ` +
        `template URI ${implicitTiling.subtrees.uri}`;
      const issue = SemanticValidationIssues.TILE_IMPLICIT_ROOT_INVALID(
        path,
        message
      );
      context.addIssue(issue);
      return false;
    }

    const resourceResolver = context.getResourceResolver();
    const subtreeData = await resourceResolver.resolve(subtreeUri!);
    if (subtreeData == null) {
      const message =
        `Could not resolve subtree URI ${subtreeUri} that was ` +
        `created from template URI ${implicitTiling.subtrees.uri} ` +
        `for coordinates ${coordinates}`;
      const issue = SemanticValidationIssues.TILE_IMPLICIT_ROOT_INVALID(
        path,
        message
      );
      context.addIssue(issue);
      return false;
    }

    const subtreeValidator = new SubtreeValidator(
      undefined,
      subtreeUri,
      validationState,
      implicitTiling,
      resourceResolver
    );
    const result = await subtreeValidator.validateObject(subtreeData, context);
    return result;
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
  ): boolean {
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
      return false;
    }

    return true;
  }
}
