import { SchemaClass } from "../structure/Metadata/SchemaClass";
import { MetadataEntityModel } from "./MetadataEntityModel";
import { MetadataTableModel } from "./MetadataTableModel";

export class DefaultMetadataTableModel implements MetadataTableModel {
  private readonly _schemaClass: SchemaClass;
  private readonly _entities: MetadataEntityModel[];

  constructor(schemaClass: SchemaClass, entities: MetadataEntityModel[]) {
    this._schemaClass = schemaClass;
    this._entities = entities;
  }

  get class(): SchemaClass {
    return this._schemaClass;
  }

  get count(): number {
    return this._entities.length;
  }

  getEntity(index: number): MetadataEntityModel {
    const entity = this._entities[index];
    return entity;
  }
}
