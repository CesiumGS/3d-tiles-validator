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
  static createSubtreeCoordinatesIterator(
    implicitTiling: TileImplicitTiling
  ): IterableIterator<TreeCoordinates> {
    const r = this.createRootCoordinates(implicitTiling);
    return r.descendants(implicitTiling.subtreeLevels - 1);
  }

  private static createRootCoordinates(implicitTiling: TileImplicitTiling) {
    if (implicitTiling.subdivisionScheme === "QUADTREE") {
      return new QuadtreeCoordinates(0, 0, 0);
    }
    return new OctreeCoordinates(0, 0, 0, 0);
  }

  static computeNumberOfNodesPerSubtree(
    implicitTiling: TileImplicitTiling
  ): number {
    const levels = implicitTiling.subtreeLevels;
    if (implicitTiling.subdivisionScheme === "QUADTREE") {
      return Quadtrees.computeNumberOfNodesForLevels(levels);
    }
    return Octrees.computeNumberOfNodesForLevels(levels);
  }

  static computeNumberOfNodesInLevel(
    implicitTiling: TileImplicitTiling,
    level: number
  ): number {
    const size = 1 << level;
    if (implicitTiling.subdivisionScheme === "QUADTREE") {
      return size * size;
    }
    return size * size * size;
  }
}
