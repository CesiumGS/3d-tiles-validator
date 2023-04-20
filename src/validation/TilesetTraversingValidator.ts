import path from "path";
import { defined } from "3d-tiles-tools";
import { ExplicitTraversedTile } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { ValidationState } from "./ValidationState";
import { TileValidator } from "./TileValidator";
import { TileContentValidator } from "./TileContentValidator";
import { SubtreeValidator } from "./SubtreeValidator";
import { ImplicitTilingValidator } from "./ImplicitTilingValidator";

import { TilesetTraverser } from "3d-tiles-tools";
import { TraversedTile } from "3d-tiles-tools";

import { MetadataEntityValidator } from "./metadata/MetadataEntityValidator";

import { ImplicitTilingError } from "3d-tiles-tools";

import { Tileset } from "3d-tiles-tools";
import { TileImplicitTiling } from "3d-tiles-tools";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";
import { ValidationIssues } from "../issues/ValidationIssues";
import { StructureValidationIssues } from "../issues/StructureValidationIssues";

/**
 * A validator for a `Tileset` that traverses the tile hierarchy
 * and performs the validation of the tile instances, their contents,
 * and the consistency of the tile hierarchy.
 *
 * @internal
 */
export class TilesetTraversingValidator {
  /**
   * Validates the given tileset, by traversing the tile hierarchy
   * and validating each traversed tile.
   *
   * @param tileset - The `Tileset`
   * @param validationState - The `ValidationState`
   * @param context - The `TraversalContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether every traversed tile was valid.
   */
  static async validateTileset(
    tileset: Tileset,
    validationState: ValidationState,
    context: ValidationContext
  ): Promise<boolean> {
    const resourceResolver = context.getResourceResolver();
    let result = true;
    const tilesetTraverser = new TilesetTraverser(".", resourceResolver, {
      depthFirst: true,
    });
    try {
      await tilesetTraverser.traverseWithSchema(
        tileset,
        validationState.validatedSchema,
        async (traversedTile: TraversedTile) => {
          // Validate the tile, and only continue the traversal
          // if it was found to be valid
          const isValid =
            await TilesetTraversingValidator.validateTraversedTile(
              traversedTile,
              validationState,
              context
            );
          if (!isValid) {
            result = false;
          }
          if (isValid) {
            // If the traversed tile is generally valid, then
            // validate its content
            const contentValid =
              await TilesetTraversingValidator.validateTraversedTileContent(
                traversedTile,
                context
              );
            if (!contentValid) {
              result = false;
            }
            // If the traversed tile is not the root tile, validate
            // the consistency of the hierarchy
            const parent = traversedTile.getParent();
            if (defined(parent)) {
              const hierarchyValid =
                TilesetTraversingValidator.validateTraversedTiles(
                  parent,
                  traversedTile,
                  context
                );
              if (!hierarchyValid) {
                result = false;
              }
            }
          }
          return isValid;
        }
      );
    } catch (error) {
      // There may be different kinds of errors that are thrown
      // during the traveral of the tileset and its validation.
      // An `ImplicitTilingError` indicates that an implicit
      // tileset was invalid (e.g. a missing subtree file or
      // one of its buffers). The `ImplicitTilingError` is
      // supposed to contain more detailed information.
      if (error instanceof ImplicitTilingError) {
        const message = `Could not traverse tileset: ${error}`;
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
   * traversed tile, so far that it ensures that it is a valid
   * tile object and can be traversed further.
   *
   * It will not validate the tile content. This is done with
   * `validateTraversedTileContent`
   *
   * @param traversedTile - The `TraversedTile`
   * @param validationState - The `ValidationState`
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateTraversedTile(
    traversedTile: TraversedTile,
    validationState: ValidationState,
    context: ValidationContext
  ): Promise<boolean> {
    const path = traversedTile.path;

    // TODO The validation of the implicit tiling and the
    // metadata that are done here are redundant. They
    // are also done in `TileValidator#validateTile`.
    // It is not entirely clear which types of inconsistencies
    // should cause the validation to fail with which message.
    // Maybe some of these validation steps should be pulled
    // out of "validateTile", or enabled/disabled via flags.

    if (traversedTile instanceof ExplicitTraversedTile) {
      const explicitPartIsValid =
        await TilesetTraversingValidator.validateExplicitTraversedTile(
          traversedTile,
          validationState,
          context
        );
      if (!explicitPartIsValid) {
        return false;
      }
    }

    const tile = traversedTile.asRawTile();

    // Validate the tile itself
    const tileValid = await TileValidator.validateTile(
      path,
      tile,
      validationState,
      context
    );
    if (!tileValid) {
      return false;
    }
    return true;
  }

  /**
   * Validates the given explicit traversed tile.
   *
   * This will ONLY validate the elements that are specific for
   * an `ExplicitTraversedTile` (compared to a `TraversedTile`) ,
   * namely the `implicitTiling` and `metadata` of the tile.
   *
   * @param traversedTile - The `ExplicitTraversedTile`
   * @param validationState - The `ValidationState`
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateExplicitTraversedTile(
    traversedTile: ExplicitTraversedTile,
    validationState: ValidationState,
    context: ValidationContext
  ): Promise<boolean> {
    const path = traversedTile.path;

    // If the tile defines implicit tiling, validate this
    // first. All subsequent checks depend on the validity
    // of the implicit tiling information.
    const implicitTiling = traversedTile.getImplicitTiling();
    const implicitTilingPath = path + "/implicitTiling";
    if (defined(implicitTiling)) {
      if (
        !ImplicitTilingValidator.validateImplicitTiling(
          implicitTilingPath,
          implicitTiling,
          context
        )
      ) {
        return false;
      }

      // If the tile is the root of a subtree, then
      // validate the subtree data
      const subtreeUri = traversedTile.getSubtreeUri();
      if (defined(subtreeUri)) {
        const subtreeRootValid =
          await TilesetTraversingValidator.validateSubtreeRoot(
            path,
            implicitTiling,
            subtreeUri,
            validationState,
            context
          );
        if (!subtreeRootValid) {
          return false;
        }
      }
    }

    // Validate the metadata.
    // This is also done in `TileValidator#validateTile`, but
    // the following steps require the metadata to already be
    // valid.
    const metadata = traversedTile.getMetadata();
    const metadataPath = path + "/metadata";
    if (defined(metadata)) {
      if (!validationState.hasSchemaDefinition) {
        // If there is metadata, then there must be a schema definition
        const message =
          "The tile defines 'metadata' but the tileset does not have a schema";
        const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        return false;
      }
      if (defined(validationState.validatedSchema)) {
        if (
          !MetadataEntityValidator.validateMetadataEntity(
            metadataPath,
            "tile.metadata",
            metadata,
            validationState.validatedSchema,
            context
          )
        ) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Validates the content in given traversed tile.
   *
   * This assumes that the given tile already has been determined to
   * be basically valid, as of `validateTraversedTile`.
   *
   * @param traversedTile - The `TraversedTile`
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateTraversedTileContent(
    traversedTile: TraversedTile,
    context: ValidationContext
  ): Promise<boolean> {
    const tile = traversedTile.asRawTile();

    let result = true;

    // Validate the content
    const content = tile.content;
    const contentPath = traversedTile.path + "/content";
    if (defined(content)) {
      const contentResult = await TileContentValidator.validateTileContent(
        contentPath,
        content,
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
      for (let i = 0; i < contents.length; i++) {
        const contentsElement = contents[i];
        const contentsElementPath = contentsPath + "/" + i;
        const contentResult = await TileContentValidator.validateTileContent(
          contentsElementPath,
          contentsElement,
          tile,
          context
        );
        if (!contentResult) {
          result = false;
        }
      }
    }
    return result;
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
   * @param tilePath - The path for `ValidationIssue` instances
   * @param implicitTiling - The `TileImpllicitTiling`
   * @param subtreeUri - The subtree URI
   * @param validationState - The `ValidationState`
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateSubtreeRoot(
    tilePath: string,
    implicitTiling: TileImplicitTiling,
    subtreeUri: string,
    validationState: ValidationState,
    context: ValidationContext
  ): Promise<boolean> {
    // Resolve resources (like buffers) relative to the
    // directory of the subtree file
    const resourceResolver = context.getResourceResolver();
    const subtreeDirectory = path.dirname(subtreeUri);
    const subtreeResourceResolver = resourceResolver.derive(subtreeDirectory);

    // Obtain the raw subtree data (binary subtree file or JSON)
    const subtreeData = await resourceResolver.resolveData(subtreeUri);
    if (subtreeData == null) {
      const message =
        `Could not resolve subtree URI ${subtreeUri} that was ` +
        `created from template URI ${implicitTiling.subtrees.uri} `;
      const issue = SemanticValidationIssues.TILE_IMPLICIT_ROOT_INVALID(
        tilePath,
        message
      );
      context.addIssue(issue);
      return false;
    }

    // Validate the subtree data with a `SubtreeValidator`
    const subtreeValidator = new SubtreeValidator(
      validationState,
      implicitTiling,
      subtreeResourceResolver
    );
    const result = await subtreeValidator.validateObject(
      subtreeUri,
      subtreeData,
      context
    );
    return result;
  }

  /**
   * Validate the consistency of the given traversed tile instances.
   *
   * This will check the conditions that must hold for parent/child
   * tiles, for example, the consistency of the geometric error
   *
   * @param traversedParent - The parent `TraversedTile`
   * @param traversedTile - The current `TraversedTile`
   * @param context - The `ValidationContext`
   */
  private static validateTraversedTiles(
    traversedParent: TraversedTile,
    traversedTile: TraversedTile,
    context: ValidationContext
  ): boolean {
    const path = traversedTile.path;
    const tile = traversedTile.asRawTile();
    const parent = traversedParent.asRawTile();

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
      const issue = SemanticValidationIssues.TILE_GEOMETRIC_ERRORS_INCONSISTENT(
        path,
        message
      );
      context.addIssue(issue);
      return false;
    }

    return true;
  }
}
