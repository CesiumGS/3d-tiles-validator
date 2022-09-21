import { BoundingVolume } from "./BoundingVolume";
import { Content } from "./Content";
import { MetadataEntity } from "./MetadataEntity";
import { TileImplicitTiling } from "./TileImplicitTiling";

export interface Tile {
  boundingVolume: BoundingVolume;
  viewerRequestVolume?: BoundingVolume;
  geometricError: number;
  refine?: string;
  transform?: number[];
  content?: Content;
  contents?: Content[];
  metadata?: MetadataEntity;
  implicitTiling?: TileImplicitTiling;
  children?: Tile[];
}
