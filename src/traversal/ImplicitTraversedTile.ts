import { defined } from "../base/defined";

import { ResourceResolver } from "../io/ResourceResolver";

import { TraversedTile } from "./TraversedTile";
import { ImplicitTileTraversal } from "./ImplicitTileTraversal";

import { TreeCoordinates } from "../implicitTiling/TreeCoordinates";
import { SubtreeInfo } from "../implicitTiling/SubtreeInfo";

import { Tile } from "../structure/Tile";
import { Content } from "../structure/Content";
import { TileImplicitTiling } from "../structure/TileImplicitTiling";

export class ImplicitTraversedTile implements TraversedTile {
  private readonly _implicitTiling: TileImplicitTiling;
  private readonly _resourceResolver: ResourceResolver;
  private readonly _root: Tile;
  private readonly _path: string;
  private readonly _subtreeInfo: SubtreeInfo;
  private readonly _globalLevel: number;
  private readonly _globalCoordinate: TreeCoordinates;
  private readonly _rootCoordinate: TreeCoordinates;
  private readonly _localCoordinate: TreeCoordinates;
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
    const boundingVolume = this._root.boundingVolume; // TODO Derive
    const viewerRequestVolume = this._root.viewerRequestVolume;
    const geometricError = this._root.geometricError; // TODO Derive
    const refine = this._root.refine;
    const transform = undefined;
    const metadata = this._root.metadata; // TODO Look up!
    const contents = this.getContents();

    return {
      boundingVolume: boundingVolume,
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
        const childSubtreeInfo = await ImplicitTileTraversal.resolveSubtreeInfo(
          this._implicitTiling,
          this._resourceResolver,
          globalChildCoordinate
        );
        const childLocalCoordinate = ImplicitTileTraversal.createRoot(
          this._implicitTiling
        );
        if (defined(childSubtreeInfo)) {
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
