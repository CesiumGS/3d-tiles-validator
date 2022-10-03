import { SchemaClass } from "../structure/Metadata/SchemaClass";
import { MetadataEntityModel } from "./MetadataEntityModel";

export interface MetadataTableModel {
  get class(): SchemaClass;
  get count(): number;

  getEntity(index: number): MetadataEntityModel;
}
