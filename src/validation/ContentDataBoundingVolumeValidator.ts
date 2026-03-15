import { BoundingVolume } from "3d-tiles-tools";
import { BoundingVolumesContainment } from "3d-tiles-tools";
import { ResourceResolver } from "3d-tiles-tools";
import { Tiles } from "3d-tiles-tools";
import { Tileset } from "3d-tiles-tools";
import { TilesetTraverser } from "3d-tiles-tools";
import { TraversedTile } from "3d-tiles-tools";
import { VertexProcessing } from "3d-tiles-tools";

import { BoundingSphere } from "cesium";
import { Matrix3 } from "cesium";
import { Matrix4 } from "cesium";
import { OrientedBoundingBox } from "cesium";

import { ValidationContext } from "./ValidationContext";
import { ValidationState } from "./ValidationState";

import { IoValidationIssues } from "../issues/IoValidationIssue";
import { ValidationIssues } from "../issues/ValidationIssues";
import { ContentDataValidationIssues } from "../issues/ContentDataValidationIssues";

/**
 * A class for validating that content data is fully enclosed in the
 * tile bounding volumes.
 *
 * @internal
 */
export class ContentDataBoundingVolumeValidator {
  /**
   * An epsilon for containment checks
   */
  private static readonly CONTAINMENT_EPSILON = 1e-5;

  /**
   * Validates the the bounding volume containment for the given tileset.
   *
   * This will traverse the tileset, and check, for each content, whether
   * all vertices of that content are fully contained in the bounding
   * volume of the containing tile and the bounding volumes of all
   * ancestors of that tile.
   *
   * @param tilesetPath - The path for validation issues
   * @param tileset - The `Tileset`
   * @param validationState - The `ValidationState`
   * @param context - The `TraversalContext`
   * @returns A promise that resolves when the validation is finished
   */
  static async validateBoundingVolumeContainment(
    tilesetPath: string,
    tileset: Tileset,
    validationState: ValidationState,
    context: ValidationContext
  ): Promise<boolean> {
    let allTraversedTilesValid = true;

    // Traverse the tileset, and validate each traversed tile
    // (i.e. its content against the bounding volumes of the
    // tile and all its ancestors)

    // Note: This will re-compute some elements repeatedly,
    // for example, the global transforms and the transformed
    // bounding volumes of the tiles: For each traversed tile,
    // it will go UP to the root, and gather the transformed
    // bounding volumes for each ancestor. This could be
    // optimized by doing a manual traversal here, and
    // maintaining the "stack" of bounding volumes alongside
    // the stack of traversed tiles. Given that the majority
    // of the time is spent in the geometry/vertex processing,
    // the relative performance gains should be low.
    const resourceResolver = context.getResourceResolver();
    const tilesetTraverser = new TilesetTraverser(".", resourceResolver, {
      depthFirst: true,
      traverseExternalTilesets: true,
    });
    try {
      const schema = validationState.schemaState.validatedElement;
      await tilesetTraverser.traverseWithSchema(
        tileset,
        schema,
        async (traversedTile: TraversedTile) => {
          if (traversedTile.isImplicitTilesetRoot()) {
            return true;
          }
          const valid =
            await ContentDataBoundingVolumeValidator.validateTraversedTile(
              traversedTile,
              resourceResolver,
              context
            );
          allTraversedTilesValid = allTraversedTilesValid && valid;
          return true;
        }
      );
    } catch (error) {
      const message = `Internal error while traversing tileset: ${error}`;
      const issue = ValidationIssues.INTERNAL_ERROR(tilesetPath, message);
      context.addIssue(issue);
      return false;
    }
    return allTraversedTilesValid;
  }

  /**
   * Validate the given traversed tile.
   *
   * This will check whether the vertices of the contents of the given
   * tile are all contained in the bounding volume of the tile and
   * the bounding volumes of all its ancestors.
   *
   * @param traversedTile - The traversed tile
   * @param resourceResolver - The resource resolver for resolving the
   * tile content from the content URI
   * @param context - The context for validation issues
   * @returns Whether the tile was valid
   */
  private static async validateTraversedTile(
    traversedTile: TraversedTile,
    resourceResolver: ResourceResolver,
    context: ValidationContext
  ): Promise<boolean> {
    //console.log("Have to validate " + traversedTile);

    // Compute the mapping from 'traversedTile.path' strings
    // to the bounding volume of the respective tile, each
    // transformed using the global transform of the tile
    const transformedTileBoundingVolumes =
      ContentDataBoundingVolumeValidator.computeTransformedTileBoundingVolumes(
        traversedTile
      );
    const globalTileTransform =
      ContentDataBoundingVolumeValidator.computeGlobalTransform(traversedTile);

    // Validate all contents against all bounding volumes
    const result =
      await ContentDataBoundingVolumeValidator.validateAllContentsAllBoundingVolumes(
        traversedTile,
        transformedTileBoundingVolumes,
        globalTileTransform,
        resourceResolver,
        context
      );
    return result;
  }

  /**
   * Validate the contents of the given traversed tile against the given
   * bounding volumes.
   *
   * This will read each content, transform its vertices with the given
   * transform, and check that the resulting vertex is contained in
   * each of the given bounding volumes (and in the content bounding
   * volume of that content, if it is defined).
   *
   * @param contentUris - The content URIs
   * @param transformedTileBoundingVolumes - The transformed bounding volumes
   * @param globalTileTransform - The global transform of the containing
   * tile, used to transform the vertices of the content
   * @param resourceResolver - The resolver for resolving the content data
   * based on the URIs
   * @param context - The context for validation issues
   * @returns Whether the contents have been valid
   */
  private static async validateAllContentsAllBoundingVolumes(
    traversedTile: TraversedTile,
    transformedTileBoundingVolumes: Map<string, BoundingVolume>,
    globalTileTransform: number[],
    resourceResolver: ResourceResolver,
    context: ValidationContext
  ): Promise<boolean> {
    let allValid = true;

    const finalTile = traversedTile.asFinalTile();
    const contents = Tiles.getContents(finalTile);
    for (const content of contents) {
      // Obtain the optional content bounding volume, and transform
      // it with the global tile transform
      let transformedContentBoundingVolume = undefined;
      const contentBoundingVolume = content.boundingVolume;
      if (contentBoundingVolume) {
        transformedContentBoundingVolume =
          ContentDataBoundingVolumeValidator.computeTransformedBoundingVolume(
            contentBoundingVolume,
            globalTileTransform
          );
      }

      // Validate the data from the content URI against all transformed
      // tile bounding volumes and the transformed content bounding volume
      const contentUri = content.uri;
      const valid =
        await ContentDataBoundingVolumeValidator.validateSingleContentAllBoundingVolumes(
          contentUri,
          transformedTileBoundingVolumes,
          transformedContentBoundingVolume,
          globalTileTransform,
          resourceResolver,
          context
        );
      allValid = allValid && valid;
    }
    return allValid;
  }

  /**
   * Validate the specified content against the given bounding volumes.
   *
   * This will read the content, transform its vertices with the given
   * transform, and check that the resulting vertex is contained in
   * each of the given bounding volumes.
   *
   * @param contentUri - The content URI
   * @param transformedTileBoundingVolumes - The transformed bounding volumes
   * @param transformedContentBoundingVolume  - The optional transformed
   * bounding volume of the content
   * @param globalTileTransform - The global transform of the containing
   * tile, used to transform the vertices of the content
   * @param resourceResolver - The resolver for resolving the content data
   * based on the URI
   * @param context - The context for validation issues
   * @returns Whether the content was valid
   */
  private static async validateSingleContentAllBoundingVolumes(
    contentUri: string,
    transformedTileBoundingVolumes: Map<string, BoundingVolume>,
    transformedContentBoundingVolume: BoundingVolume | undefined,
    globalTileTransform: number[],
    resourceResolver: ResourceResolver,
    context: ValidationContext
  ): Promise<boolean> {
    const data = await resourceResolver.resolveData(contentUri);
    if (!data) {
      const message = `Could not resolve content data from ${contentUri}`;
      const issue = IoValidationIssues.IO_ERROR(contentUri, message);
      context.addIssue(issue);
      return false;
    }

    const externalGlbResolver = (uri: string) => {
      return resourceResolver.resolveData(uri);
    };
    const result =
      await ContentDataBoundingVolumeValidator.validateSingleContentDataAllBoundingVolumes(
        contentUri,
        data,
        externalGlbResolver,
        transformedTileBoundingVolumes,
        transformedContentBoundingVolume,
        globalTileTransform,
        context
      );
    return result;
  }

  /**
   * Validate the given content data against the given bounding volumes.
   *
   * This will transform the vertices of the given content with the given
   * transform, and check that the resulting vertex is contained in
   * each of the given bounding volumes.
   *
   * @param contentUri - The content URI
   * @param data - The content data
   * @param externalGlbResolver - The function for resolving external GLB
   * files from I3DM content
   * @param transformedTileBoundingVolumes - The transformed bounding volumes
   * @param transformedContentBoundingVolume  - The optional transformed
   * bounding volume of the content
   * @param globalTileTransform - The global transform of the containing
   * tile, used to transform the vertices of the content
   * @param context - The context for validation issues
   * @returns Whether the content was valid
   */
  private static async validateSingleContentDataAllBoundingVolumes(
    contentUri: string,
    data: Buffer,
    externalGlbResolver: (glbUri: string) => Promise<Buffer | undefined>,
    transformedTileBoundingVolumes: Map<string, BoundingVolume>,
    transformedContentBoundingVolume: BoundingVolume | undefined,
    globalTileTransform: number[],
    context: ValidationContext
  ): Promise<boolean> {
    const transformedPoint = Array<number>(3);

    // The counter for the total number of vertices
    let vertexCounter = 0;

    // The counters that map the keys of the transformed bounding
    // volumes (which are the 'traversedTile.path' strings) to
    // the number of vertices that have NOT been contained in
    // the bounding volume of the respective tile
    const nonContainedInTileBvVertexCounters = new Map<string, number>();
    let nonContainedInContentBvVertexCounter = 0;

    // The consumer that will receive all vertices of the content
    const consumer = (p: number[]) => {
      // Transform the point with the global tile transform
      ContentDataBoundingVolumeValidator.transformPoint3D(
        globalTileTransform,
        p,
        transformedPoint
      );

      // Check each transformed bounding volume to see whether it contains
      // the transformed point, and count the number of points that are
      // not contained for each of them
      for (const [
        tilePath,
        transformedTileBoundingVolume,
      ] of transformedTileBoundingVolumes.entries()) {
        const containedInTileBv = BoundingVolumesContainment.contains(
          transformedTileBoundingVolume,
          transformedPoint,
          ContentDataBoundingVolumeValidator.CONTAINMENT_EPSILON
        );

        //console.log("check if vertex   ", p);
        //console.log("      transformed ", transformedPoint);
        //console.log("  is contained in ", transformedTileBoundingVolume);
        //console.log("       results in ", containedInTileBv);

        if (!containedInTileBv) {
          const nonContainedVertexCounter =
            nonContainedInTileBvVertexCounters.get(tilePath) ?? 0;
          nonContainedInTileBvVertexCounters.set(
            tilePath,
            nonContainedVertexCounter + 1
          );
        }
      }

      // If a content bounding volume was defined, check for containment
      // in the content bounding volume
      if (transformedContentBoundingVolume) {
        const containedInContentBv = BoundingVolumesContainment.contains(
          transformedContentBoundingVolume,
          transformedPoint,
          ContentDataBoundingVolumeValidator.CONTAINMENT_EPSILON
        );
        if (!containedInContentBv) {
          nonContainedInContentBvVertexCounter++;
        }
      }

      vertexCounter++;
    };

    // Process the vertices, passing each vertex to the consumer
    const processInstancePoints = true;
    await VertexProcessing.fromContent(
      contentUri,
      data,
      externalGlbResolver,
      processInstancePoints,
      consumer
    );

    // Generate validation issues for each tile bounding volume that
    // did not contain all vertices
    let allValid = true;
    for (const [
      tilePath,
      nonContainedCounter,
    ] of nonContainedInTileBvVertexCounters.entries()) {
      if (nonContainedCounter > 0) {
        const message =
          `The bounding volume of tile '${tilePath}' does not contain ${nonContainedCounter} ` +
          `of the ${vertexCounter} vertices of content '${contentUri}'`;
        const issue =
          ContentDataValidationIssues.CONTENT_NOT_ENCLOSED_BY_BOUNDING_VOLUME(
            contentUri,
            message
          );
        context.addIssue(issue);
        allValid = false;
      }
    }

    // Generate a validation issue if there was a content bounding
    // volume that did not contain all vertices
    if (
      transformedContentBoundingVolume &&
      nonContainedInContentBvVertexCounter > 0
    ) {
      const message =
        `The content bounding volume for content '${contentUri}' does not contain ` +
        `${nonContainedInContentBvVertexCounter} of the ${vertexCounter} vertices`;
      const issue =
        ContentDataValidationIssues.CONTENT_NOT_ENCLOSED_BY_BOUNDING_VOLUME(
          contentUri,
          message
        );
      context.addIssue(issue);
      allValid = false;
    }

    return allValid;
  }

  /**
   * Transform the given point with the given matrix.
   *
   * If the given result is undefined, then a new array will be
   * created and returned.
   *
   * @param point3D - The point as a 3-element array
   * @param matrix - The 4x4 matrix as a 16-element array, column-major
   * @param result - The optional result.
   * @returns The result
   */
  private static transformPoint3D(
    matrix: number[],
    point3D: number[],
    result: undefined | number[]
  ): number[] {
    const px = point3D[0];
    const py = point3D[1];
    const pz = point3D[2];
    const x = matrix[0] * px + matrix[4] * py + matrix[8] * pz + matrix[12];
    const y = matrix[1] * px + matrix[5] * py + matrix[9] * pz + matrix[13];
    const z = matrix[2] * px + matrix[6] * py + matrix[10] * pz + matrix[14];
    if (!result) {
      return [x, y, z];
    }
    result[0] = x;
    result[1] = y;
    result[2] = z;
    return result;
  }

  /**
   * Transform the given bounding volume with the given matrix, and
   * return the result.
   *
   * The transform is given as a 16-element array representing the
   * 4x4 matrix in column-major order.
   *
   * If the given bounding volume is a "region" bounding volume, then
   * it will be returned directly.
   *
   * If the bounding volume is a "box" or "sphere" bounding volume,
   * then it will be transformed with the given matrix, and the
   * result will be returned.
   *
   * @param boundingVolume - The bounding volume
   * @param transform - The transform
   * @returns The resulting bounding volume
   */
  private static computeTransformedBoundingVolume(
    boundingVolume: BoundingVolume,
    transform: number[]
  ) {
    // Regions are not transformed
    const region = boundingVolume.region;
    if (region) {
      return {
        region: region,
      };
    }

    // Boxes are transformed by converting them into a CesiumJS
    // OrientedBoundingBox and transforming that
    const box = boundingVolume.box;
    if (box) {
      const obb = OrientedBoundingBox.unpack(box, 0, new OrientedBoundingBox());
      const matrix = Matrix4.fromArray(transform, 0, new Matrix4());
      ContentDataBoundingVolumeValidator.transformOrientedBoundingBox(
        obb,
        matrix,
        obb
      );
      const resultBox = Array<number>(12);
      OrientedBoundingBox.pack(obb, resultBox, 0);
      return {
        box: resultBox,
      };
    }

    // Spheres are transformed by converting them into a CesiumJS
    // BoundingSphere and transforming that
    const sphere = boundingVolume.sphere;
    if (sphere) {
      const bs = BoundingSphere.unpack(sphere, 0, new BoundingSphere());
      const matrix = Matrix4.fromArray(transform, 0, new Matrix4());
      BoundingSphere.transform(bs, matrix, bs);
      const resultSphere = Array<number>(4);
      BoundingSphere.pack(bs, resultSphere, 0);
      return {
        sphere: resultSphere,
      };
    }

    console.warn("Unknown bounding volume type", boundingVolume);
    return boundingVolume;
  }

  /**
   * Transforms the given oriented bounding box with the given matrix,
   * stores the result in the given result parameter, and returns it.
   *
   * If the given result is `undefined`, then a new oriented bounding box
   * will be created, filled, and returned.
   *
   * @param orientedBoundingBox - The oriented bounding box
   * @param transform - The transform matrix
   * @param result - The result
   * @returns The result
   */
  private static transformOrientedBoundingBox(
    orientedBoundingBox: OrientedBoundingBox,
    transform: Matrix4,
    result: undefined | OrientedBoundingBox
  ) {
    if (!result) {
      result = new OrientedBoundingBox();
    }
    Matrix4.multiplyByPoint(
      transform,
      orientedBoundingBox.center,
      result.center
    );
    const rotationScaleTransform = new Matrix3();
    Matrix4.getMatrix3(transform, rotationScaleTransform);
    Matrix3.multiply(
      rotationScaleTransform,
      orientedBoundingBox.halfAxes,
      result.halfAxes
    );
    return result;
  }

  /**
   * Computes the bounding volumes of the given tile and all its ancestors.
   *
   * The result will be a mapping from the `traversedTile.path` string to
   * the bounding volume that results from transforming the bounding
   * volumes of the respective tiles with their global transforms.
   *
   * @param traversedTile - The traversed tile
   * @returns The transformed bounding volumes
   */
  private static computeTransformedTileBoundingVolumes(
    traversedTile: TraversedTile
  ): Map<string, BoundingVolume> {
    const transformedTileBoundingVolumes = new Map<string, BoundingVolume>();
    let currentTile: TraversedTile | undefined = traversedTile;
    while (currentTile) {
      const tilePath = currentTile.path;
      const finalCurrentTile = currentTile.asFinalTile();
      const boundingVolume = finalCurrentTile.boundingVolume;
      const transform =
        ContentDataBoundingVolumeValidator.computeGlobalTransform(currentTile);
      const transformedTileBoundingVolume =
        ContentDataBoundingVolumeValidator.computeTransformedBoundingVolume(
          boundingVolume,
          transform
        );
      transformedTileBoundingVolumes.set(
        tilePath,
        transformedTileBoundingVolume
      );
      currentTile = currentTile.getParent();
    }
    return transformedTileBoundingVolumes;
  }

  /**
   * Returns the global transform of the given tile.
   *
   * The result will be the transform of the tile, multiplied with all
   * transforms of its ancestors, up to the root, returned as a 16-element
   * array representing the 4x4 matrix in column-major order.
   *
   * @param traversedTile - The traversed tile
   * @returns The global transform
   */
  private static computeGlobalTransform(
    traversedTile: TraversedTile
  ): number[] {
    const globalTransform = Matrix4.clone(Matrix4.IDENTITY);
    const currentTransform = Matrix4.clone(Matrix4.IDENTITY);
    let currentTile: TraversedTile | undefined = traversedTile;
    while (currentTile) {
      const finalTile = currentTile.asFinalTile();
      const transform = finalTile.transform;
      if (transform) {
        Matrix4.fromArray(transform, 0, currentTransform);
        Matrix4.multiply(currentTransform, globalTransform, globalTransform);
      }
      currentTile = currentTile.getParent();
    }
    const result = Matrix4.toArray(globalTransform);
    return result;
  }
}
