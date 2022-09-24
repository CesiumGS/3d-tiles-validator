import { TileImplicitTiling } from "../structure/TileImplicitTiling";
import { OctreeCoordinates } from "./OctreeCoordinates";
import { Octrees } from "./Octrees";
import { QuadtreeCoordinates } from "./QuadtreeCoordinates";
import { Quadtrees } from "./Quadtrees";
import { TreeCoordinates } from "./TreeCoordinates";

/**
 * Utility methods related to `TileImplicitTiling` instances.
 *
 * Preliminary!
 *
 * These methods might eventually be moved into something
 * like an instantiable `ImplicitTilingInfo` class
 *
 * @private
 */
export class ImplicitTilings {
  /**
   * Returns a generator for the tile coordinates of a single subtree
   * for the given implicit tiling object.
   *
   * The result will be `undefined` if the given object does not
   * have a valid `subdivisionScheme`.
   *
   * @param implicitTiling The `TileImplicitTiling` object
   * @returns The generator
   */
  static createSubtreeCoordinatesIterator(
    implicitTiling: TileImplicitTiling
  ): IterableIterator<TreeCoordinates> | undefined {
    const r = this.createRootCoordinates(implicitTiling);
    return r?.descendants(implicitTiling.subtreeLevels - 1);
  }

  /**
   * Returns the tile coordinates of the root node for the given
   * implicit tiling object.
   *
   * The result will be `undefined` if the given object does not
   * have a valid `subdivisionScheme`.
   *
   * @param implicitTiling The `TileImplicitTiling` object
   * @returns The root coordinates
   */
  private static createRootCoordinates(implicitTiling: TileImplicitTiling) {
    if (implicitTiling.subdivisionScheme === "QUADTREE") {
      return new QuadtreeCoordinates(0, 0, 0);
    }
    if (implicitTiling.subdivisionScheme === "OCTREE") {
      return new OctreeCoordinates(0, 0, 0, 0);
    }
    return undefined;
  }

  /**
   * Returns the total number of nodes in one subtree for the given
   * implicit tiling object.
   *
   * The result will be `undefined` if the given object does not
   * have a valid `subdivisionScheme`.
   *
   * @param implicitTiling The `TileImplicitTiling` object
   * @returns The number of nodes
   */
  static computeNumberOfNodesPerSubtree(
    implicitTiling: TileImplicitTiling
  ): number | undefined {
    const levels = implicitTiling.subtreeLevels;
    if (implicitTiling.subdivisionScheme === "QUADTREE") {
      return Quadtrees.computeNumberOfNodesForLevels(levels);
    }
    if (implicitTiling.subdivisionScheme === "OCTREE") {
      return Octrees.computeNumberOfNodesForLevels(levels);
    }
    return undefined;
  }

  /**
   * Returns the number of nodes in the specified level of a
   * tree with the given implicit tiling
   *
   * The result will be `undefined` if the given object does not
   * have a valid `subdivisionScheme`.
   *
   * @param implicitTiling The `TileImplicitTiling` object
   * @param level The level
   * @returns The number of nodes
   */
  static computeNumberOfNodesInLevel(
    implicitTiling: TileImplicitTiling,
    level: number
  ): number | undefined {
    const size = 1 << level;
    if (implicitTiling.subdivisionScheme === "QUADTREE") {
      return size * size;
    }
    if (implicitTiling.subdivisionScheme === "OCTREE") {
      return size * size * size;
    }
    return undefined;
  }
}
