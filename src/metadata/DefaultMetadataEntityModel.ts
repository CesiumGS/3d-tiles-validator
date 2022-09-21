import { defined } from "../base/defined";
import { DeveloperError } from "../base/DeveloperError";

import { MetadataEntityModel } from "./MetadataEntityModel";
import { MetadataValues } from "./MetadataValues";

import { SchemaClass } from "../structure/Metadata/SchemaClass";

export class DefaultMetadataEntityModel implements MetadataEntityModel {
  private readonly _schemaClass: SchemaClass;
  private readonly _json: any;

  constructor(schemaClass: SchemaClass, json: any) {
    this._schemaClass = schemaClass;
    this._json = json;
  }

  getPropertyValue(propertyId: string): any {
    const properties = this._schemaClass.properties;
    if (!defined(properties)) {
      throw new DeveloperError(`Schema class does not have any properties`);
    }
    const property = properties![propertyId];
    if (!defined(property)) {
      throw new DeveloperError(
        `Schema class does not have property ${propertyId}`
      );
    }
    let value = this._json[propertyId];
    return MetadataValues.processValue(property, value);
  }
}
