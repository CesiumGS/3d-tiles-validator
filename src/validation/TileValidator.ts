import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { ContentValidator } from "./ContentValidator";
import { BoundingVolumeValidator } from "./BoundingVolumeValidator";
import { BasicValidator } from "./BasicValidator";
import { ImplicitTilingValidator } from "./ImplicitTilingValidator";
import { TransformValidator } from "./TransformValidator";
import { ValidationState } from "./ValidationState";
import { TemplateUriValidator } from "./TemplateUriValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { ExtendedObjectsValidators } from "./ExtendedObjectsValidators";

import { MetadataEntityValidator } from "./metadata/MetadataEntityValidator";

import { Tile } from "3d-tiles-tools";
import { TileImplicitTiling } from "3d-tiles-tools";

import { JsonValidationIssues } from "../issues/JsonValidationIssues";
import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";
import { StructureValidationIssues } from "../issues/StructureValidationIssues";

/**
 * The valid values for the `refine` property
 */
const refineValues: string[] = ["ADD", "REPLACE"];

/**
 * A class for validations related to `tile` objects.
 *
 * The main function of this class, `validateTile`, will perform the
 * basic structural validation of the tile object.
 *
 * The function will **NOT** traverse through the children!
 * The traversal is done separately, and supposed to call
 * the `validateTile` function for each encountered tile.
 *
 * The function will **NOT** validate the tile content data.
 * This is done with the `TileContentValidator`, after it
 * has been determined that the tile is structurally valid.
 *
 * @internal
 */
export class TileValidator {
  /**
   * Validates the given tile.
   *
   * @param tilePath - The path for the `ValidationIssue`
   * @param tile - The tile
   * @param validationState - The `ValidationState`
   * @param context - The `ValidationContext`
   * @returns Whether the object was valid
   */
  static async validateTile(
    tilePath: string,
    tile: Tile,
    validationState: ValidationState,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(tilePath, "tile", tile, context)) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        tilePath,
        "tile",
        tile,
        context
      )
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(tilePath, tile, context)
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(tile)) {
      return result;
    }

    // Validate the boundingVolume
    const boundingVolume = tile.boundingVolume;
    const boundingVolumePath = tilePath + "/boundingVolume";
    // The boundingVolume MUST be defined
    const boundingVolumeValid =
      await BoundingVolumeValidator.validateBoundingVolume(
        boundingVolumePath,
        boundingVolume,
        context
      );
    if (!boundingVolumeValid) {
      result = false;
    }

    // Validate the viewerRequestVolume
    const viewerRequestVolume = tile.viewerRequestVolume;
    const viewerRequestVolumePath = tilePath + "/viewerRequestVolume";
    if (defined(viewerRequestVolume)) {
      if (
        !BoundingVolumeValidator.validateBoundingVolume(
          viewerRequestVolumePath,
          viewerRequestVolume,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the geometricError
    const geometricError = tile.geometricError;
    const geometricErrorPath = tilePath + "/geometricError";

    // The geometricError MUST be defined
    // The geometricError MUST be a number
    // The geometricError MUST be >= 0
    if (
      !BasicValidator.validateNumberRange(
        geometricErrorPath,
        "geometricError",
        geometricError,
        0.0,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate the refine
    const refine = tile.refine;
    const refinePath = tilePath + "/refine";
    if (defined(refine)) {
      // The refine MUST be a string
      if (
        !BasicValidator.validateString(refinePath, "refine", refine, context)
      ) {
        result = false;
      } else {
        // Special handling for refine values that are not
        // in uppercase: If it is a valid value, but not
        // in uppercase, then issue a warning
        const upperCaseRefine = refine.toUpperCase();
        if (
          !refineValues.includes(refine) &&
          refineValues.includes(upperCaseRefine)
        ) {
          const message =
            `The 'refine' property must be ` +
            `'ADD' or 'REPLACE', but is '${refine}'`;
          const issue = SemanticValidationIssues.TILE_REFINE_WRONG_CASE(
            refinePath,
            message
          );
          context.addIssue(issue);
        } else {
          // The refine MUST be one of the refineValues
          if (
            !BasicValidator.validateEnum(
              refinePath,
              "refine",
              refine,
              refineValues,
              context
            )
          ) {
            result = false;
          }
        }
      }
    }

    // Validate the transform
    const transform = tile.transform;
    const transformPath = tilePath + "/transform";
    if (defined(transform)) {
      if (
        !TransformValidator.validateTransform(transformPath, transform, context)
      ) {
        result = false;
      }
    }

    // Validate the metadata
    const metadata = tile.metadata;
    const metadataPath = tilePath + "/metadata";
    if (defined(metadata)) {
      if (!validationState.hasSchemaDefinition) {
        // If there is metadata, then there must be a schema definition
        const message =
          "The tile defines 'metadata' but the tileset does not have a schema";
        const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
          tilePath,
          message
        );
        context.addIssue(issue);
        result = false;
      } else if (defined(validationState.validatedSchema)) {
        if (
          !MetadataEntityValidator.validateMetadataEntity(
            metadataPath,
            "tile.metadata",
            metadata,
            validationState.validatedSchema,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // The content and contents MUST NOT be present at the same time
    const content = tile.content;
    const contents = tile.contents;
    if (defined(content) && defined(contents)) {
      const path = tilePath;
      const issue = JsonValidationIssues.ONE_OF_ERROR(
        path,
        "tile",
        "content",
        "contents"
      );
      context.addIssue(issue);
      result = false;
    }

    // Check if the tile defines an implicitTiling. There are several
    // checks that are very specific for implicit tileset roots, so
    // these validation steps are implemented as dedicated functions.
    const implicitTiling = tile.implicitTiling;
    if (defined(implicitTiling)) {
      if (
        !TileValidator.validateImplicitTilesetRoot(
          tilePath,
          tile,
          implicitTiling,
          context
        )
      ) {
        result = false;
      }
    } else {
      const simpleTileValid = await TileValidator.validateSimpleTile(
        tilePath,
        tile,
        validationState,
        context
      );
      if (!simpleTileValid) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validate the given tile, which is already determined to be
   * a tile that is **NOT** the root of an implicit tileset
   * (i.e. it does **NOT** define `implicitTiling`).
   *
   * @param tilePath - The path for the `ValidationIssue`
   * @param tile - The tile
   * @param validationState - The `ValidationState` object
   * @param context - The `ValidationContext`
   * @returns Whether the object was valid
   */
  private static async validateSimpleTile(
    tilePath: string,
    tile: Tile,
    validationState: ValidationState,
    context: ValidationContext
  ): Promise<boolean> {
    let result = true;

    // Note: The check that content and contents may not be present
    // at the same time is done in `validateTile`!

    // Validate the content
    const content = tile.content;
    const contentPath = tilePath + "/content";
    if (defined(content)) {
      const contentValid = await ContentValidator.validateContent(
        contentPath,
        content,
        validationState,
        context
      );
      if (!contentValid) {
        result = false;
      }
    }

    // Validate the contents
    const contents = tile.contents;
    const contentsPath = tilePath + "/contents";
    if (defined(contents)) {
      // The contents MUST be an array
      // Each element of the contents array MUST be an object
      if (
        !BasicValidator.validateArray(
          contentsPath,
          "contents",
          contents,
          undefined,
          undefined,
          "object",
          context
        )
      ) {
        result = false;
      } else {
        // Validate each element of the contents array
        for (let index = 0; index < contents.length; index++) {
          const contentsElementPath = contentsPath + "/" + index;
          const contentsElement = contents[index];
          const contentValid = await ContentValidator.validateContent(
            contentsElementPath,
            contentsElement,
            validationState,
            context
          );
          if (!contentValid) {
            result = false;
          }
        }
      }
    }

    // Validate the children
    // Note that this will NOT recurse through the children!
    const children = tile.children;
    const childrenPath = tilePath + "/children";
    if (defined(children)) {
      // The children MUST be an array of objects with at least 1 element
      if (
        !BasicValidator.validateArray(
          childrenPath,
          "children",
          children,
          1,
          undefined,
          "object",
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Certain properties may not be defined in an implicit tileset root:
   *
   * - tile.children
   * - tile.metadata
   * - tile.content.boundingVolume
   *
   * This method checks whether the property is indeed undefined,
   * and adds a `TILE_IMPLICIT_ROOT_INVALID` issue to the given
   * context if it was defined.
   *
   * @param tilePath - The path for the `ValidationIssue`
   * @param name - The name of the property
   * @param value - The value of the property
   * @param context - The `ValidationContext`
   * @returns Whether the values was not defined
   */
  private static validateDisallowedInImplicitTilesetRoot(
    tilePath: string,
    name: string,
    value: any,
    context: ValidationContext
  ): boolean {
    if (!defined(value)) {
      return true;
    }
    const message =
      `The tile defines 'implicitTiling' and ` +
      `may therefore not define '${name}'`;
    const issue = SemanticValidationIssues.TILE_IMPLICIT_ROOT_INVALID(
      tilePath,
      message
    );
    context.addIssue(issue);
    return false;
  }

  /**
   * Validate the given tile, given that it is the root of
   * an implicit tileset, as indicated by the presence of
   * the `implicitTiling` property.
   *
   * @param tilePath - The path for the `ValidationIssue`
   * @param tile - The tile
   * @param implicitTiling - The `TileImplicitTiling` object
   * @param context - The `ValidationContext`
   * @returns Whether the object was valid
   */
  private static validateImplicitTilesetRoot(
    tilePath: string,
    tile: Tile,
    implicitTiling: TileImplicitTiling,
    context: ValidationContext
  ): boolean {
    let result = true;
    let implicitTilingIsValid = true;

    // Validate the implicitTiling
    const implicitTilingPath = tilePath + "/implicitTiling";
    if (
      !ImplicitTilingValidator.validateImplicitTiling(
        implicitTilingPath,
        implicitTiling,
        context
      )
    ) {
      result = false;
      implicitTilingIsValid = false;
    }

    // From the specification text:
    // The tile shall omit the children property
    if (
      !TileValidator.validateDisallowedInImplicitTilesetRoot(
        tilePath,
        "children",
        tile.children,
        context
      )
    ) {
      result = false;
    }
    // From the specification text:
    // The tile shall omit the metadata property
    if (
      !TileValidator.validateDisallowedInImplicitTilesetRoot(
        tilePath,
        "metadata",
        tile.metadata,
        context
      )
    ) {
      result = false;
    }
    // From the specification text:
    // The content shall omit the boundingVolume property
    if (
      !TileValidator.validateDisallowedInImplicitTilesetRoot(
        tilePath,
        "content.boundingVolume",
        tile.content?.boundingVolume,
        context
      )
    ) {
      result = false;
    }

    // From the specification text:
    // - The content.uri shall not point to an external tileset
    // TODO This can hardly be validated here...

    // From the specification text of Implicit Tiling: Sphere bounding volumes
    // are disallowed, as these cannot be divided into a quadtree or octree.
    if (
      !TileValidator.validateDisallowedInImplicitTilesetRoot(
        tilePath,
        "boundingVolume.sphere",
        tile.boundingVolume?.sphere,
        context
      )
    ) {
      result = false;
    }

    // Note: The check that content and contents may not be present
    // at the same time is done in `validateTile`!

    // Validate the content
    const content = tile.content;
    const contentPath = tilePath + "/content";
    if (defined(content)) {
      // The content of an implicit root requires special checks:
      // The content MUST be an object
      if (
        !BasicValidator.validateObject(contentPath, "content", content, context)
      ) {
        result = false;
      } else {
        // The content uri MUST be a valid template URI.
        // This is only checked if the implicit tiling was
        // valid (i.e. contained a valid subdivisionScheme)
        if (implicitTilingIsValid) {
          const contentUri = content.uri;
          const contentUriPath = contentPath + "/uri";
          const subdivisionScheme = implicitTiling.subdivisionScheme;
          if (
            !TemplateUriValidator.validateTemplateUri(
              contentUriPath,
              "uri",
              contentUri,
              subdivisionScheme,
              context
            )
          ) {
            result = false;
          }
        }
      }
    }

    // Validate the contents
    const contents = tile.contents;
    const contentsPath = tilePath + "/contents";
    if (defined(contents)) {
      // The content of an implicit root requires special checks:
      // The contents MUST be an array
      // Each element of the contents array MUST be an object
      if (
        !BasicValidator.validateArray(
          contentsPath,
          "contents",
          contents,
          undefined,
          undefined,
          "object",
          context
        )
      ) {
        result = false;
      } else {
        // Validate each element of the contents array
        for (let index = 0; index < contents.length; index++) {
          const contentsElementPath = contentsPath + "/" + index;
          const contentsElement = contents[index];
          // The content uri MUST be a valid template URI.
          // This is only checked if the implicit tiling was
          // valid (i.e. contained a valid subdivisionScheme)
          if (implicitTilingIsValid) {
            const contentsElementUri = contentsElement.uri;
            const contentsElementUriPath = contentsElementPath + "/uri";
            const subdivisionScheme = implicitTiling.subdivisionScheme;
            if (
              !TemplateUriValidator.validateTemplateUri(
                contentsElementUriPath,
                "uri",
                contentsElementUri,
                subdivisionScheme,
                context
              )
            ) {
              result = false;
            }
          }
        }
      }
    }

    return result;
  }
}
