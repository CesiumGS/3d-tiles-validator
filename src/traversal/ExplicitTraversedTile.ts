import { TraversedTile } from "./TraversedTile";
import { Tile } from "../structure/Tile";
import { Content } from "../structure/Content";
import { defined } from "../base/defined";
import { ImplicitTileTraversal } from "./ImplicitTileTraversal";
import { ResourceResolver } from "../io/ResourceResolver";

export class ExplicitTraversedTile implements TraversedTile {
  private readonly _parent: TraversedTile | undefined;
  private readonly _tile: Tile;
  private readonly _path: string;
  private readonly _level: number;
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
