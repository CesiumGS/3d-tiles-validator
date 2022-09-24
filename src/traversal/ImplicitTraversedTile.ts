import { defined } from "../base/defined";

import { ResourceResolver } from "../io/ResourceResolver";

import { TraversedTile } from "./TraversedTile";
import { ImplicitTileTraversal } from "./ImplicitTileTraversal";

import { TreeCoordinates } from "../implicitTiling/TreeCoordinates";
import { SubtreeInfo } from "../implicitTiling/SubtreeInfo";

import { Tile } from "../structure/Tile";
import { Content } from "../structure/Content";
import { TileImplicitTiling } from "../structure/TileImplicitTiling";
import { BoundingVolumeDerivation } from "./cesium/BoundingVolumeDerivation";
import { ImplicitTilingError } from "../implicitTiling/ImplicitTilingError";

/**
 * An implementation of a `TraversedTile` that represents a tile
 * within an implicit tileset during its traversal.
 */
export class ImplicitTraversedTile implements TraversedTile {
  /**
   * The `TileImplicitTiling` that this tile belongs to
   */
  private readonly _implicitTiling: TileImplicitTiling;

  /**
   * The `ResourceResolver` that will be used for loading
   * subtree files.
   */
  private readonly _resourceResolver: ResourceResolver;

  /**
   * The `Tile` object from the tileset JSON that is the
   * root of the implicit tile hierarchy (i.e. the one
   * that contained the `TileImplicitTiling` object)
   */
  private readonly _root: Tile;

  /**
   * A JSON-path like path identifying this tile
   */
  private readonly _path: string;

  /**
   * The `SubtreeInfo` object that will be used for accessing
   * the availability information for the subtree that this
   * tile belongs to.
   */
  private readonly _subtreeInfo: SubtreeInfo;

  /**
   * The global level of this tile. This refers to the
   * root of the tileset.
   */
  private readonly _globalLevel: number;

  /**
   * The global coordinate of this tile within the implicit tileset.
   */
  private readonly _globalCoordinate: TreeCoordinates;

  /**
   * The root coordinate of the subtree that this tile belongs
   * to, within the whole implicit tileset.
   */
  private readonly _rootCoordinate: TreeCoordinates;

  /**
   * The local coordinate of this tile within the subtree that
   * starts at the `_rootCoordinate`
   */
  private readonly _localCoordinate: TreeCoordinates;

  /**
   * The parent tile
   */
  private readonly _parent: TraversedTile;

  constructor(
    implicitTiling: TileImplicitTiling,
    resourceResolver: ResourceResolver,
    root: Tile,
    path: string,
    subtreeInfo: SubtreeInfo,
    globalLevel: number,
    globalCoordinate: TreeCoordinates,
    rootCoordinate: TreeCoordinates,
    localCoordinate: TreeCoordinates,
    parent: TraversedTile
  ) {
    this._implicitTiling = implicitTiling;
    this._resourceResolver = resourceResolver;
    this._root = root;
    this._path = path;
    this._subtreeInfo = subtreeInfo;
    this._globalLevel = globalLevel;
    this._globalCoordinate = globalCoordinate;
    this._rootCoordinate = rootCoordinate;
    this._localCoordinate = localCoordinate;
    this._parent = parent;
  }

  asTile(): Tile {
    // TODO The bounding volume and geometric error
    // may be overridden via semantics!

    const boundingVolume = BoundingVolumeDerivation.deriveBoundingVolume(
      this._root.boundingVolume,
      this._globalCoordinate.toArray()
    );
    if (!defined(boundingVolume)) {
      // The bounding volume neither contained a region nor a box.
      // This should have been detected by previous validation.
      throw new ImplicitTilingError("Could not subdivide bounding volume");
    }
    const level = this._globalCoordinate.level;
    const geometricError = this._root.geometricError / Math.pow(2, level);

    const viewerRequestVolume = this._root.viewerRequestVolume;
    const refine = this._root.refine;
    const transform = undefined;
    const metadata = this._root.metadata; // TODO Look up!
    const contents = this.getContents();

    return {
      boundingVolume: boundingVolume!,
      viewerRequestVolume: viewerRequestVolume,
      geometricError: geometricError,
      refine: refine,
      transform: transform,
      metadata: metadata,
      contents: contents,
    };
  }

  get path(): string {
    return this._path;
  }
  get level(): number {
    return this._globalLevel;
  }

  getParent(): TraversedTile | undefined {
    return this._parent;
  }

  async getChildren(): Promise<TraversedTile[]> {
    const localLevel = this._localCoordinate.level;
    if (localLevel === this._implicitTiling.subtreeLevels - 1) {
      const children = [];
      const localChildCoordinates = this._localCoordinate.children();
      for (const localChildCoordinate of localChildCoordinates) {
        const globalChildCoordinate =
          ImplicitTileTraversal.globalizeCoordinates(
            this._implicitTiling,
            this._rootCoordinate,
            localChildCoordinate
          );
        const childSubtreeAvailability =
          this._subtreeInfo.getChildSubtreeAvailabilityInfo();
        const childSubtreeAvailable = childSubtreeAvailability.isAvailable(
          localChildCoordinate.toIndexInLevel()
        );
        if (childSubtreeAvailable) {
          const childSubtreeInfo =
            await ImplicitTileTraversal.resolveSubtreeInfo(
              this._implicitTiling,
              this._resourceResolver,
              globalChildCoordinate
            );
          const childLocalCoordinate = ImplicitTileTraversal.createRoot(
            this._implicitTiling
          );
          // TODO Assuming certain toString here!!!
          const childPath = this._path + `/${globalChildCoordinate}`;
          const child = new ImplicitTraversedTile(
            this._implicitTiling,
            this._resourceResolver,
            this._root,
            childPath,
            childSubtreeInfo!,
            this._globalLevel + 1,
            globalChildCoordinate,
            globalChildCoordinate,
            childLocalCoordinate,
            this
          );
          children.push(child);
        }
      }
      return children;
    }

    const tileAvailabilityInfo = this._subtreeInfo.getTileAvailabilityInfo();
    const localChildCoordinates = this._localCoordinate.children();
    const children = [];
    for (const localChildCoordinate of localChildCoordinates) {
      const available = tileAvailabilityInfo.isAvailable(
        localChildCoordinate.toIndex()
      );
      if (available) {
        const globalChildCoordinate =
          ImplicitTileTraversal.globalizeCoordinates(
            this._implicitTiling,
            this._rootCoordinate,
            localChildCoordinate
          );

        // TODO Assuming certain toString here!!!
        const childPath = this._path + `/${globalChildCoordinate}`;

        const child = new ImplicitTraversedTile(
          this._implicitTiling,
          this._resourceResolver,
          this._root,
          childPath,
          this._subtreeInfo,
          this._globalLevel + 1,
          globalChildCoordinate,
          this._rootCoordinate,
          localChildCoordinate,
          this
        );
        children.push(child);
      }
    }
    return children;
  }

  getContents(): Content[] {
    const contents = [];
    const contentAvailabilityInfos =
      this._subtreeInfo.getContentAvailabilityInfos();
    for (const contentAvailabilityInfo of contentAvailabilityInfos) {
      const available = contentAvailabilityInfo.isAvailable(
        this._localCoordinate.toIndex()
      );
      if (available) {
        const templateUri = this._root.content!.uri; // TODO More checks!
        const contentUri = ImplicitTileTraversal.substituteTemplateUri(
          this._implicitTiling.subdivisionScheme,
          templateUri,
          this._globalCoordinate
        );
        // TODO Check semantics!
        const content: Content = {
          boundingVolume: undefined,
          uri: contentUri,
          metadata: undefined,
          group: undefined,
        };
        contents.push(content);
      }
    }
    return contents;
  }

  // TODO For debugging
  toString = (): string => {
    return (
      `ImplicitTraversedTile, ` +
      `level ${this._globalLevel}, ` +
      `global: ${this._globalCoordinate}, ` +
      `root: ${this._rootCoordinate}, ` +
      `local: ${this._localCoordinate}`
      //`path ${this.path}`
    );
  };
}
