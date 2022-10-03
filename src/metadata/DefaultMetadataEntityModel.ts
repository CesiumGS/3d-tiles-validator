import { defined } from "../base/defined";

import { MetadataEntityModel } from "./MetadataEntityModel";
import { MetadataValues } from "./MetadataValues";
import { MetadataError } from "./MetadataError";

import { SchemaClass } from "../structure/Metadata/SchemaClass";

/**
 * Defalt implementation of a `MetadataEntityModel` that is backed
 * by the JSON representation of the metadata.
 *
 * (The JSON representation are just the `metadataEntity.properties`
 * from the input JSON)
 *
 * @private
 */
export class DefaultMetadataEntityModel implements MetadataEntityModel {
  private readonly _schemaClass: SchemaClass;
  private readonly _json: any;
  private readonly _semanticToPropertyId: { [key: string]: string };

  constructor(
    schemaClass: SchemaClass,
    semanticToPropertyId: { [key: string]: string },
    json: any
  ) {
    this._schemaClass = schemaClass;
    this._semanticToPropertyId = semanticToPropertyId;
    this._json = json;
  }

  getPropertyValue(propertyId: string): any {
    const properties = this._schemaClass.properties;
    if (!defined(properties)) {
      throw new MetadataError(`Schema class does not have any properties`);
    }
    const property = properties![propertyId];
    if (!defined(property)) {
      throw new MetadataError(
        `Schema class does not have property ${propertyId}`
      );
    }
    const value = this._json[propertyId];
    return MetadataValues.processValue(property, value);
  }

  getPropertyValueBySemantic(semantic: string): any {
    const propertyId = this._semanticToPropertyId[semantic];
    if (!defined(propertyId)) {
      return undefined;
    }
    return this.getPropertyValue(propertyId);
  }
}
