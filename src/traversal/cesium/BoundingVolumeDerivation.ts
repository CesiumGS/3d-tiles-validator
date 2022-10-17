import { Cartesian3, Math as CesiumMath, Matrix3, Rectangle } from "cesium";
import { defined } from "../../base/defined";
import { HilbertOrder } from "./HilbertOrder";
import { BoundingVolume } from "../../structure/BoundingVolume";
import { BoundingVolumeS2 } from "../../validation/extensions/BoundingVolumeS2";
import { S2Cell } from "./S2Cell";

/**
 * Methods to derive bounding volumes of implicit tiles.
 *
 * Largely ported from CesiumJS Implicit3DTileContent.js
 *
 * @private
 */
export class BoundingVolumeDerivation {
  /**
   * Given the coordinates of a tile, derive its bounding volume from the root.
   *
   * @param rootBoundingVolume The root bounding volume
   * @param implicitCoordinates The coordinates of the child tile, as an
   * array [level,x,y] for quadtrees or [level,x,y,z] for octrees.
   * @returns {Object} An object containing the JSON for a bounding volume
   */
  static deriveBoundingVolume(
    rootBoundingVolume: BoundingVolume,
    implicitCoordinates: number[]
  ): BoundingVolume | undefined {
    const level = implicitCoordinates[0];
    const x = implicitCoordinates[1];
    const y = implicitCoordinates[2];
    const z =
      implicitCoordinates.length > 3 ? implicitCoordinates[3] : undefined;

    if (
      BoundingVolumeDerivation.hasExtension(
        rootBoundingVolume,
        "3DTILES_bounding_volume_S2"
      )
    ) {
      const extensions = rootBoundingVolume.extensions!;
      const s2Object = extensions["3DTILES_bounding_volume_S2"];
      const boundingVolumeS2 = s2Object as BoundingVolumeS2;
      const childBoundingVolumeS2 =
        BoundingVolumeDerivation.deriveBoundingVolumeS2(
          boundingVolumeS2,
          level,
          x,
          y,
          z
        );
      return {
        extensions: {
          "3DTILES_bounding_volume_S2": childBoundingVolumeS2,
        },
      };
    }

    if (defined(rootBoundingVolume.region)) {
      const childRegion = BoundingVolumeDerivation.deriveBoundingRegion(
        rootBoundingVolume.region!,
        level,
        x,
        y,
        z
      );

      return {
        region: childRegion,
      };
    }
    if (defined(rootBoundingVolume.box)) {
      const childBox = BoundingVolumeDerivation.deriveBoundingBox(
        rootBoundingVolume.box!,
        level,
        x,
        y,
        z
      );

      return {
        box: childBox,
      };
    }
  }

  /**
   * Check if a specific extension is present on a JSON object. This can be used
   * for either 3D Tiles extensions or glTF extensions
   * @param {Object} json The JSON object
   * @param {String} extensionName The name of the extension, e.g. '3DTILES_implicit_tiling'
   * @returns {Boolean} True if the extension is present
   * @private
   */
  private static hasExtension(json: any, extensionName: string): boolean {
    return (
      defined(json) &&
      defined(json.extensions) &&
      defined(json.extensions[extensionName])
    );
  }

  // See https://github.com/CesiumGS/cesium/issues/10801
  private static Matrix3_multiplyByScale = function (
    matrix: Matrix3,
    scale: Cartesian3,
    result: Matrix3
  ) {
    const array = new Array(9);
    array[0] = matrix[0] * scale.x;
    array[1] = matrix[1] * scale.x;
    array[2] = matrix[2] * scale.x;
    array[3] = matrix[3] * scale.y;
    array[4] = matrix[4] * scale.y;
    array[5] = matrix[5] * scale.y;
    array[6] = matrix[6] * scale.z;
    array[7] = matrix[7] * scale.z;
    array[8] = matrix[8] * scale.z;
    Matrix3.fromArray(array, 0, result);

    return result;
  };

  static scratchScaleFactors = new Cartesian3();
  static scratchRootCenter = new Cartesian3();
  static scratchCenter = new Cartesian3();
  static scratchHalfAxes = new Matrix3();
  /**
   * Derive a bounding volume for a descendant tile (child, grandchild, etc.),
   * assuming a quadtree or octree implicit tiling scheme. The (level, x, y, [z])
   * coordinates are given to select the descendant tile and compute its position
   * and dimensions.
   * <p>
   * If z is present, octree subdivision is used. Otherwise, quadtree subdivision
   * is used. Quadtrees are always divided at the midpoint of the the horizontal
   * dimensions, i.e. (x, y), leaving the z axis unchanged.
   * </p>
   * <p>
   * This computes the child volume directly from the root bounding volume rather
   * than recursively subdividing to minimize floating point error.
   * </p>
   *
   * @param rootBox An array of 12 numbers representing the bounding box of the root tile
   * @param level The level of the descendant tile relative to the root implicit tile
   * @param x The x coordinate of the descendant tile
   * @param y The y coordinate of the descendant tile
   * @param [z] The z coordinate of the descendant tile (octree only)
   * @returns An array of 12 numbers representing the bounding box of the descendant tile.
   */
  private static deriveBoundingBox(
    rootBox: number[],
    level: number,
    x: number,
    y: number,
    z: number | undefined
  ): number[] {
    if (level === 0) {
      return rootBox;
    }

    const rootCenter = Cartesian3.unpack(
      rootBox,
      0,
      BoundingVolumeDerivation.scratchRootCenter
    );
    const rootHalfAxes = Matrix3.unpack(
      rootBox,
      3,
      BoundingVolumeDerivation.scratchHalfAxes
    );

    const tileScale = Math.pow(2, -level);
    const modelSpaceX = -1 + (2 * x + 1) * tileScale;
    const modelSpaceY = -1 + (2 * y + 1) * tileScale;

    let modelSpaceZ = 0;
    const scaleFactors = Cartesian3.fromElements(
      tileScale,
      tileScale,
      1,
      BoundingVolumeDerivation.scratchScaleFactors
    );

    if (defined(z)) {
      modelSpaceZ = -1 + (2 * z! + 1) * tileScale;
      scaleFactors.z = tileScale;
    }

    let center = Cartesian3.fromElements(
      modelSpaceX,
      modelSpaceY,
      modelSpaceZ,
      BoundingVolumeDerivation.scratchCenter
    );
    center = Matrix3.multiplyByVector(
      rootHalfAxes,
      center,
      BoundingVolumeDerivation.scratchCenter
    );
    center = Cartesian3.add(
      center,
      rootCenter,
      BoundingVolumeDerivation.scratchCenter
    );

    let halfAxes = Matrix3.clone(rootHalfAxes);
    halfAxes = BoundingVolumeDerivation.Matrix3_multiplyByScale(
      halfAxes,
      scaleFactors,
      halfAxes
    );

    const childBox = new Array(12);
    Cartesian3.pack(center, childBox);
    Matrix3.pack(halfAxes, childBox, 3);
    return childBox;
  }

  static scratchRectangle = new Rectangle();
  /**
   * Derive a bounding volume for a descendant tile (child, grandchild, etc.),
   * assuming a quadtree or octree implicit tiling scheme. The (level, x, y, [z])
   * coordinates are given to select the descendant tile and compute its position
   * and dimensions.
   * <p>
   * If z is present, octree subdivision is used. Otherwise, quadtree subdivision
   * is used. Quadtrees are always divided at the midpoint of the the horizontal
   * dimensions, i.e. (mid_longitude, mid_latitude), leaving the height values
   * unchanged.
   * </p>
   * <p>
   * This computes the child volume directly from the root bounding volume rather
   * than recursively subdividing to minimize floating point error.
   * </p>
   * @param rootRegion An array of 6 numbers representing the root implicit tile
   * @param level The level of the descendant tile relative to the root implicit tile
   * @param x The x coordinate of the descendant tile
   * @param y The x coordinate of the descendant tile
   * @param z The z coordinate of the descendant tile (octree only)
   * @returns An array of 6 numbers representing the bounding region of the descendant tile
   * @private
   */
  private static deriveBoundingRegion(
    rootRegion: number[],
    level: number,
    x: number,
    y: number,
    z: number | undefined
  ): number[] {
    if (level === 0) {
      return rootRegion.slice();
    }

    const rectangle = Rectangle.unpack(
      rootRegion,
      0,
      BoundingVolumeDerivation.scratchRectangle
    );
    const rootMinimumHeight = rootRegion[4];
    const rootMaximumHeight = rootRegion[5];
    const tileScale = Math.pow(2, -level);

    const childWidth = tileScale * rectangle.width;
    const west = CesiumMath.negativePiToPi(rectangle.west + x * childWidth);
    const east = CesiumMath.negativePiToPi(west + childWidth);

    const childHeight = tileScale * rectangle.height;
    const south = CesiumMath.negativePiToPi(rectangle.south + y * childHeight);
    const north = CesiumMath.negativePiToPi(south + childHeight);

    // Height is only subdivided for octrees; It remains constant for quadtrees.
    let minimumHeight = rootMinimumHeight;
    let maximumHeight = rootMaximumHeight;
    if (defined(z)) {
      const childThickness =
        tileScale * (rootMaximumHeight - rootMinimumHeight);
      minimumHeight += z! * childThickness;
      maximumHeight = minimumHeight + childThickness;
    }

    return [west, south, east, north, minimumHeight, maximumHeight];
  }

  /**
   * Derive a bounding volume for a descendant tile (child, grandchild, etc.),
   * assuming a quadtree or octree implicit tiling scheme. The (level, x, y, [z])
   * coordinates are given to select the descendant tile and compute its position
   * and dimensions.
   * <p>
   * If z is present, octree subdivision is used. Otherwise, quadtree subdivision
   * is used. Quadtrees are always divided at the midpoint of the the horizontal
   * dimensions, i.e. (x, y), leaving the z axis unchanged.
   * </p>
   *
   * @param level The level of the descendant tile relative to the root implicit tile
   * @param x The x coordinate of the descendant tile
   * @param y The y coordinate of the descendant tile
   * @param z The z coordinate of the descendant tile (octree only)
   * @returns The new bounding volume
   * @private
   */
  private static deriveBoundingVolumeS2(
    boundingVolumeS2: BoundingVolumeS2,
    level: number,
    x: number,
    y: number,
    z: number | undefined
  ): BoundingVolumeS2 {
    if (level === 0) {
      return boundingVolumeS2;
    }
    // Extract the first 3 face bits from the 64-bit S2 cell ID.
    // eslint-disable-next-line no-undef
    const baseCellId = S2Cell.getIdFromToken(boundingVolumeS2.token);
    const face = Number(baseCellId >> BigInt(61));
    // The Hilbert curve is rotated for the "odd" faces on the S2 Earthcube.
    // See http://s2geometry.io/devguide/img/s2cell_global.jpg
    const position =
      face % 2 === 0
        ? HilbertOrder.encode2D(level, x, y)
        : HilbertOrder.encode2D(level, y, x);
    const cellId = S2Cell.fromFacePositionLevel(face, BigInt(position), level);

    let minHeight, maxHeight;
    if (defined(z)) {
      // In CesiumJS, this information was computed from
      // the "childIndex" that was passed along, i.e. this
      // is equivalent to the condition "childIndex < 4"
      const lower = (z! & 1) === 0;

      const midpointHeight =
        (boundingVolumeS2.maximumHeight + boundingVolumeS2.minimumHeight) / 2;
      minHeight = lower ? boundingVolumeS2.minimumHeight : midpointHeight;
      maxHeight = lower ? midpointHeight : boundingVolumeS2.maximumHeight;
    } else {
      minHeight = boundingVolumeS2.minimumHeight;
      maxHeight = boundingVolumeS2.maximumHeight;
    }

    return {
      token: S2Cell.getTokenFromId(cellId),
      minimumHeight: minHeight,
      maximumHeight: maxHeight,
    };
  }
}
