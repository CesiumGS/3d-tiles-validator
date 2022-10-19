import { MetadataClass } from "../structure/Metadata/MetadataClass";
import { MetadataEntityModel } from "./MetadataEntityModel";
import { MetadataTableModel } from "./MetadataTableModel";

export class DefaultMetadataTableModel implements MetadataTableModel {
  private readonly _metadataClass: MetadataClass;
  private readonly _entities: MetadataEntityModel[];

  constructor(metadataClass: MetadataClass, entities: MetadataEntityModel[]) {
    this._metadataClass = metadataClass;
    this._entities = entities;
  }

  get class(): MetadataClass {
    return this._metadataClass;
  }

  get count(): number {
    return this._entities.length;
  }

  getEntity(index: number): MetadataEntityModel {
    const entity = this._entities[index];
    return entity;
  }
}
