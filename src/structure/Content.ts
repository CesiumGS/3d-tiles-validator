import { BoundingVolume } from "./BoundingVolume";
import { MetadataEntity } from "./MetadataEntity";

export interface Content {
  boundingVolume?: BoundingVolume;
  uri: string;
  metadata?: MetadataEntity;
  group?: number;
}
