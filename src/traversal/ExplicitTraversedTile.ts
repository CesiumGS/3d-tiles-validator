import { TraversedTile } from "./TraversedTile";
import { Tile } from "../structure/Tile";
import { Content } from "../structure/Content";
import { defined } from "../base/defined";
import { ImplicitTileTraversal } from "./ImplicitTileTraversal";
import { ResourceResolver } from "../io/ResourceResolver";
import { MetadataEntityModels } from "../metadata/MetadataEntityModels";
import { Schema } from "../structure/Metadata/Schema";
import { ImplicitTilingError } from "../implicitTiling/ImplicitTilingError";

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
   * The metadata schema in the context of which this tile
   * is created. This is the schema that was obtained from
   * the `tileset.schema` or `tileset.schemaUri`. If this
   * is defined, it is assumed to be valid. If it is
   * undefined and a tile with metadata is encountered,
   * then an error will be thrown in `asTile`.
   */
  private readonly _schema: Schema | undefined;

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
    schema: Schema | undefined,
    resourceResolver: ResourceResolver
  ) {
    this._tile = tile;
    this._path = path;
    this._level = level;
    this._parent = parent;
    this._schema = schema;
    this._resourceResolver = resourceResolver;
  }

  asTile(): Tile {
    const tile = this._tile;

    const schema = this._schema;
    const metadata = tile.metadata;
    if (defined(metadata) && !defined(schema)) {
      const message =
        `Tile ${this.path} defines metadata, ` +
        `but no valid schema definition was found`;
      throw new ImplicitTilingError(message);
    }

    // TODO These can be overridden by semantics!
    const boundingVolume = tile.boundingVolume;
    const transform = undefined;
    const refine = tile.refine;

    let geometricError = tile.geometricError;
    if (defined(metadata)) {
      const metadataEntityModel = MetadataEntityModels.create(
        schema!,
        metadata!
      );
      const semanticGeometricError =
        metadataEntityModel.getPropertyValueBySemantic("TILE_GEOMETRIC_ERROR");
      if (defined(semanticGeometricError)) {
        geometricError = semanticGeometricError;
      }
    }

    const viewerRequestVolume = tile.viewerRequestVolume;
    const contents = this.getContents();
    const implicitTiling = tile.implicitTiling;

    return {
      boundingVolume: boundingVolume,
      viewerRequestVolume: viewerRequestVolume,
      geometricError: geometricError,
      refine: refine,
      transform: transform,
      contents: contents,
      metadata: metadata,
      implicitTiling: implicitTiling,
    };
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
      const child = children[i];
      const childPath = this.path + "/children/" + i;
      const traversedChild = new ExplicitTraversedTile(
        child,
        childPath,
        childLevel,
        this,
        this._schema,
        this._resourceResolver
      );
      traversedChildren.push(traversedChild);
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
