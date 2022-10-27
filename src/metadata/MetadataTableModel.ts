import { MetadataClass } from "../structure/Metadata/MetadataClass";
import { MetadataEntityModel } from "./MetadataEntityModel";

export interface MetadataTableModel {
  get class(): MetadataClass;
  get count(): number;

  getEntity(index: number): MetadataEntityModel;
}
