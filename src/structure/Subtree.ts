import { Availability } from "./Availability";
import { BufferObject } from "./BufferObject";
import { BufferView } from "./BufferView";
import { MetadataEntity } from "./MetadataEntity";
import { PropertyTable } from "./PropertyTable";

export interface Subtree {
  buffers?: BufferObject[];
  bufferViews?: BufferView[];
  propertyTables?: PropertyTable[];
  tileAvailability: Availability;
  contentAvailability?: Availability[];
  childSubtreeAvailability: Availability;
  tileMetadata?: number;
  contentMetadata?: number[];
  subtreeMetadata?: MetadataEntity;
}
