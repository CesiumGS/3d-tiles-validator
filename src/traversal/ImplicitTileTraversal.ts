import path from "path";

import { DeveloperError } from "../base/DeveloperError";

import { ResourceResolver } from "../io/ResourceResolver";

import { TraversedTile } from "./TraversedTile";
import { ExplicitTraversedTile } from "./ExplicitTraversedTile";
import { ImplicitTraversedTile } from "./ImplicitTraversedTile";

import { TileImplicitTiling } from "../structure/TileImplicitTiling";

import { SubtreeInfos } from "../implicitTiling/SubtreeInfos";
import { TemplateUris } from "../implicitTiling/TemplateUris";
import { QuadtreeCoordinates } from "../implicitTiling/QuadtreeCoordinates";
import { TreeCoordinates } from "../implicitTiling/TreeCoordinates";
import { OctreeCoordinates } from "../implicitTiling/OctreeCoordinates";
import { SubtreeInfo } from "../implicitTiling/SubtreeInfo";
import { ImplicitTilingError } from "../implicitTiling/ImplicitTilingError";
import { ResourceTypes } from "../io/ResourceTypes";
import { Subtree } from "../structure/Subtree";
import { bufferToJson } from "../base/bufferToJson";

/**
 * Methods related to the traversal of implicit tilesets.
 *
 * @private
 */
export class ImplicitTileTraversal {
  static async createTraversedChildren(
    implicitTiling: TileImplicitTiling,
    parent: ExplicitTraversedTile,
    resourceResolver: ResourceResolver
  ): Promise<TraversedTile[]> {
    const subdivisionScheme = implicitTiling.subdivisionScheme;
    if (subdivisionScheme === "QUADTREE") {
      const rootCoordinates = new QuadtreeCoordinates(0, 0, 0);
      const subtreeInfo = await ImplicitTileTraversal.resolveSubtreeInfo(
        implicitTiling,
        resourceResolver,
        rootCoordinates
      );
      // TODO Assuming certain toString here:
      const childPath = parent.path + `/${rootCoordinates}`;
      const child = new ImplicitTraversedTile(
        implicitTiling,
        resourceResolver,
        parent.asTile(),
        childPath,
        subtreeInfo!,
        parent.level + 1,
        rootCoordinates,
        rootCoordinates,
        rootCoordinates,
        parent
      );
      return [child];
    }
    if (subdivisionScheme === "OCTREE") {
      const rootCoordinates = new OctreeCoordinates(0, 0, 0, 0);
      const subtreeInfo = await ImplicitTileTraversal.resolveSubtreeInfo(
        implicitTiling,
        resourceResolver,
        rootCoordinates
      );
      // TODO Assuming certain toString here:
      const childPath = parent.path + `/${rootCoordinates}`;
      const child = new ImplicitTraversedTile(
        implicitTiling,
        resourceResolver,
        parent.asTile(),
        childPath,
        subtreeInfo!,
        parent.level + 1,
        rootCoordinates,
        rootCoordinates,
        rootCoordinates,
        parent
      );
      return [child];
    }
    throw new DeveloperError("Invalid subdivisionScheme: " + subdivisionScheme);
  }

  static substituteTemplateUri(
    subdivisionScheme: string,
    templateUri: string,
    coordinates: TreeCoordinates
  ) {
    if (subdivisionScheme === "QUADTREE") {
      const quadtreeCoordinates = coordinates as QuadtreeCoordinates;
      return TemplateUris.substituteQuadtree(templateUri, quadtreeCoordinates);
    }
    if (subdivisionScheme === "OCTREE") {
      const octreeCoordinates = coordinates as OctreeCoordinates;
      return TemplateUris.substituteOctree(templateUri, octreeCoordinates);
    }
    throw new DeveloperError("Invalid subdivisionScheme: " + subdivisionScheme);
  }

  static async resolveSubtreeInfo(
    implicitTiling: TileImplicitTiling,
    resourceResolver: ResourceResolver,
    coordinates: TreeCoordinates
  ): Promise<SubtreeInfo> {
    const subtreeUri = ImplicitTileTraversal.substituteTemplateUri(
      implicitTiling.subdivisionScheme,
      implicitTiling.subtrees.uri,
      coordinates
    );
    const subtreeData = await resourceResolver.resolve(subtreeUri);
    if (subtreeData == null) {
      const message =
        `Could not resolve subtree URI ${subtreeUri} that was ` +
        `created from template URI ${implicitTiling.subtrees.uri} ` +
        `for coordinates ${coordinates}`;
      throw new ImplicitTilingError(message);
    }

    const subtreeDirectory = path.dirname(subtreeUri);
    const subtreeResourceResolver = resourceResolver.derive(subtreeDirectory);

    // If the subtree data was JSON, just parse it and
    // create a SubtreeInfo without an internal buffer
    const isJson = ResourceTypes.isProbablyJson(subtreeData);
    if (isJson) {
      let subtreeJson: any;
      let subtree: Subtree;
      try {
        subtreeJson = bufferToJson(subtreeData);
        subtree = subtreeJson;
      } catch (error) {
        const message =
          `Could not parse subtree JSON from URI ${subtreeUri} that was ` +
          `created from template URI ${implicitTiling.subtrees.uri} ` +
          `for coordinates ${coordinates}`;
        throw new ImplicitTilingError(message);
      }
      return SubtreeInfos.create(
        subtree,
        undefined,
        implicitTiling,
        subtreeResourceResolver
      );
    }

    // For SUBT (binary subtree data), create the SubtreeInfo
    // from the whole buffer
    const isSubt = ResourceTypes.isSubt(subtreeData);
    if (isSubt) {
      const subtreeInfo = await SubtreeInfos.createFromBuffer(
        subtreeData!,
        implicitTiling,
        subtreeResourceResolver
      );
      return subtreeInfo;
    }

    const message =
      `Subtree data from URI ${subtreeUri} that was created from ` +
      `template URI ${implicitTiling.subtrees.uri} for coordinates ` +
      `${coordinates} did neither contain JSON nor binary subtree data`;
    throw new ImplicitTilingError(message);
  }

  // TODO: The remaining functions are quickly ported from j3dtiles
  // (Let's say "there's room for improvement"...)

  static globalizeCoordinates(
    implicitTiling: TileImplicitTiling,
    rootCoordinates: TreeCoordinates,
    coordinates: TreeCoordinates
  ): TreeCoordinates {
    const subdivisionScheme = implicitTiling.subdivisionScheme;
    if (subdivisionScheme === "QUADTREE") {
      const quadtreeRootCoordinates = rootCoordinates as QuadtreeCoordinates;
      const quadtreeCoordinates = coordinates as QuadtreeCoordinates;
      return ImplicitTileTraversal.globalizeQuadtreeCoords(
        quadtreeRootCoordinates,
        quadtreeCoordinates
      );
    }
    if (subdivisionScheme === "OCTREE") {
      const octreeRootCoordinates = rootCoordinates as OctreeCoordinates;
      const octreeCoordinates = coordinates as OctreeCoordinates;
      return ImplicitTileTraversal.globalizeOctreeCoords(
        octreeRootCoordinates,
        octreeCoordinates
      );
    }
    throw new DeveloperError("Invalid subdivisionScheme: " + subdivisionScheme);
  }

  static createRoot(implicitTiling: TileImplicitTiling): TreeCoordinates {
    const subdivisionScheme = implicitTiling.subdivisionScheme;
    if (subdivisionScheme === "QUADTREE") {
      return new QuadtreeCoordinates(0, 0, 0);
    }
    if (subdivisionScheme === "OCTREE") {
      return new OctreeCoordinates(0, 0, 0, 0);
    }
    throw new DeveloperError("Invalid subdivisionScheme: " + subdivisionScheme);
  }

  /**
   * Compute the global quadtree coordinates for the given coordinates.
   *
   * @param rootCoords The (global) root coordinates of the subtree
   * @param localCoords The local coordinates inside the subtree
   * @return The global coordinates
   */
  private static globalizeQuadtreeCoords(
    rootCoords: QuadtreeCoordinates,
    localCoords: QuadtreeCoordinates
  ): QuadtreeCoordinates {
    const rootLevel = rootCoords.level;
    const rootX = rootCoords.x;
    const rootY = rootCoords.y;

    const localLevel = localCoords.level;
    const localX = localCoords.x;
    const localY = localCoords.y;

    const globalLevel = rootLevel + localLevel;
    const globalX = (rootX << localLevel) + localX;
    const globalY = (rootY << localLevel) + localY;

    const globalCoords = new QuadtreeCoordinates(globalLevel, globalX, globalY);
    return globalCoords;
  }

  /**
   * Compute the global octree coordinates for the given coordinates.
   *
   * @param rootCoords The (global) root coordinates of the subtree
   * @param localCoords The local coordinates inside the subtree
   * @return The global coordinates
   */
  private static globalizeOctreeCoords(
    rootCoords: OctreeCoordinates,
    localCoords: OctreeCoordinates
  ): OctreeCoordinates {
    const rootLevel = rootCoords.level;
    const rootX = rootCoords.x;
    const rootY = rootCoords.y;
    const rootZ = rootCoords.z;

    const localLevel = localCoords.level;
    const localX = localCoords.x;
    const localY = localCoords.y;
    const localZ = localCoords.z;

    const globalLevel = rootLevel + localLevel;
    const globalX = (rootX << localLevel) + localX;
    const globalY = (rootY << localLevel) + localY;
    const globalZ = (rootZ << localLevel) + localZ;

    const globalCoords = new OctreeCoordinates(
      globalLevel,
      globalX,
      globalY,
      globalZ
    );
    return globalCoords;
  }
}
