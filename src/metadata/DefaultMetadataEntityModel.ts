import { defined } from "../base/defined";

import { MetadataEntityModel } from "./MetadataEntityModel";
import { MetadataValues } from "./MetadataValues";
import { MetadataError } from "./MetadataError";

import { MetadataClass } from "../structure/Metadata/MetadataClass";

/**
 * Default implementation of a `MetadataEntityModel` that is backed
 * by the JSON representation of the metadata.
 *
 * (The JSON representation are just the `metadataEntity.properties`
 * from the input JSON)
 *
 * @internal
 */
export class DefaultMetadataEntityModel implements MetadataEntityModel {
  private readonly _metadataClass: MetadataClass;
  private readonly _json: any;
  private readonly _semanticToPropertyId: { [key: string]: string };

  constructor(
    metadataClass: MetadataClass,
    semanticToPropertyId: { [key: string]: string },
    json: any
  ) {
    this._metadataClass = metadataClass;
    this._semanticToPropertyId = semanticToPropertyId;
    this._json = json;
  }

  getPropertyValue(propertyId: string): any {
    const properties = this._metadataClass.properties;
    if (!defined(properties)) {
      throw new MetadataError(`Metadata class does not have any properties`);
    }
    const property = properties![propertyId];
    if (!defined(property)) {
      throw new MetadataError(
        `Metadata class does not have property ${propertyId}`
      );
    }
    const value = this._json[propertyId];
    return MetadataValues.processValue(property, undefined, undefined, value);
  }

  getPropertyValueBySemantic(semantic: string): any {
    const propertyId = this._semanticToPropertyId[semantic];
    if (!defined(propertyId)) {
      return undefined;
    }
    return this.getPropertyValue(propertyId);
  }
}
