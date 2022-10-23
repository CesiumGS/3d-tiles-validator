import { defined } from "../base/defined";
import { defaultValue } from "../base/defaultValue";

import { DefaultMetadataEntityModel } from "./DefaultMetadataEntityModel";
import { MetadataEntityModel } from "./MetadataEntityModel";
import { MetadataError } from "./MetadataError";

import { Schema } from "../structure/Metadata/Schema";
import { MetadataEntity } from "../structure/MetadataEntity";
import { MetadataClass } from "../structure/Metadata/MetadataClass";

/**
 * A minimalistic interface for a model that describes a
 * metadata entity, in the context of the 3D Metadata
 * specification.
 *
 * @private
 */
export class MetadataEntityModels {
  /**
   * Creates a new `MetadataEntityModel` from the given schema and
   * metadata entity.
   *
   * This receives the raw `Schema`, and the `MetadataEntity` that
   * may, for example, have been found in the JSON input as the
   * `tileset.metadata`. It will create an instance of the model
   * class that can be used to access the property values.
   *
   * This assumes that the schema and entity have already been
   * ensured to be structurally valid. This means that the class
   * of the entity must appear in the schema, and the values
   * that are stored in the entity have a structure that matches
   * the required structure according to the type of the respective
   * metadata class properties.
   *
   * (Note: This is ensured by the `MetadataEntityValidator` and
   * `MetadataValueValidator`)
   *
   * @param schema The `Schema`
   * @param entity The `MetadataEntity`
   * @returns The `MetadataEntityModel`
   * @throws MetadataError If the metadata entity refers to a class
   * that is not found in the given schema.
   */
  static create(schema: Schema, entity: MetadataEntity): MetadataEntityModel {
    const classes = defaultValue(schema.classes, {});
    const metadataClass = classes[entity.class];
    if (!defined(metadataClass)) {
      throw new MetadataError(`Schema does not contain class ${entity.class}`);
    }
    const entityProperties = defaultValue(entity.properties, {});
    return this.createFromClass(metadataClass, entityProperties);
  }

  /**
   * Creates a new `MetadataEntityModel` from the given schema class and
   * metadata entity properties.
   *
   * See the `create` method for details.
   *
   * @param metadataClass The `MetadataClass`
   * @param entityProperties The properties of the `MetadataEntity`
   * @returns The `MetadataEntityModel`
   */
  static createFromClass(
    metadataClass: MetadataClass,
    entityProperties: { [key: string]: any }
  ) {
    // TODO This should not be done for each entity. The lookup
    // should be computed once, and associated with the class.
    const semanticToPropertyId =
      MetadataEntityModels.computeSemanticToPropertyIdMapping(metadataClass);
    const metadataEntityModel = new DefaultMetadataEntityModel(
      metadataClass,
      semanticToPropertyId,
      entityProperties
    );
    return metadataEntityModel;
  }

  /**
   * Compute the mapping from 'semantic' strings to property IDs
   * that have the respective semantic in the given metadata class.
   *
   * @param metadataClass The `MetadataClass`
   * @returns The mapping
   */
  static computeSemanticToPropertyIdMapping(metadataClass: MetadataClass): {
    [key: string]: string;
  } {
    const semanticToPropertyId: { [key: string]: string } = {};
    const classProperties = defaultValue(metadataClass.properties, {});
    for (const classPropertyId of Object.keys(classProperties)) {
      const property = classProperties[classPropertyId];
      if (defined(property.semantic)) {
        semanticToPropertyId[property.semantic!] = classPropertyId;
      }
    }
    return semanticToPropertyId;
  }
}
