import { TraversedTile } from "./TraversedTile";
import { Tile } from "../structure/Tile";
import { Content } from "../structure/Content";
import { defined } from "../base/defined";
import { ImplicitTileTraversal } from "./ImplicitTileTraversal";
import { ResourceResolver } from "../io/ResourceResolver";

/**
 * An implementation of a `TraversedTile` that reflects a tile
 * that actually appears as a JSON representation in the tileset.
 */
export class ExplicitTraversedTile implements TraversedTile {

  /**
   * The parent tile, or `undefined` if this is the root
   */
  private readonly _parent: TraversedTile | undefined;

  /**
   * The `Tile` object that this traversed tile was created for
   */
  private readonly _tile: Tile;

  /**
   * A JSON-path like path identifying this tile
   */
  private readonly _path: string;

  /**
   * The global level. This is the level starting at the
   * root of the tileset.
   */
  private readonly _level: number;

  /**
   * The `ResourceResolver` that will resolve resources
   * that may be required if this is the root of an
   * implicit tileset (e.g. the subtree files). 
   */
  private readonly _resourceResolver;

  constructor(
    tile: Tile,
    path: string,
    level: number,
    parent: TraversedTile | undefined,
    resourceResolver: ResourceResolver
  ) {
    this._tile = tile;
    this._path = path;
    this._level = level;
    this._parent = parent;
    this._resourceResolver = resourceResolver;
  }

  asTile(): Tile {
    // TODO: This should not return the internal tile.
    // It should return a tile where the properties
    // that may be affected by semantics have already
    // been substituted.
    return this._tile;
  }

  get path(): string {
    return this._path;
  }
  get level(): number {
    return this._level;
  }

  getParent(): TraversedTile | undefined {
    return this._parent;
  }

  async getChildren(): Promise<TraversedTile[]> {
    const implicitTiling = this._tile.implicitTiling;
    if (defined(implicitTiling)) {
      const children = await ImplicitTileTraversal.createTraversedChildren(
        implicitTiling!,
        this,
        this._resourceResolver
      );
      return children;
    }

    if (!defined(this._tile.children)) {
      return [];
    }
    const children = this._tile.children!;
    const childLevel = this._level + 1;
    const traversedChildren = [];
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      const childPath = this.path + "/children/" + i;
      const child = new ExplicitTraversedTile(
        c,
        childPath,
        childLevel,
        this,
        this._resourceResolver
      );
      traversedChildren.push(child);
    }
    return traversedChildren;
  }

  getContents(): Content[] {
    if (defined(this._tile.content)) {
      return [this._tile.content!];
    }
    if (defined(this._tile.contents)) {
      return this._tile.contents!;
    }
    return [];
  }

  // TODO For debugging
  toString = (): string => {
    return `ExplicitTraversedTile, level ${this.level}, path ${this.path}`;
  };
}
