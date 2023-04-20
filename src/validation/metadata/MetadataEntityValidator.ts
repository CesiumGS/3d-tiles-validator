import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "./../ValidationContext";
import { BasicValidator } from "./../BasicValidator";
import { RootPropertyValidator } from "./../RootPropertyValidator";
import { ExtendedObjectsValidators } from "./../ExtendedObjectsValidators";

import { MetadataStructureValidator } from "./MetadataStructureValidator";
import { MetadataValueValidator } from "./MetadataValueValidator";

import { Schema } from "3d-tiles-tools";
import { MetadataEntity } from "3d-tiles-tools";

/**
 * A class for validations related to `metadataEntity` objects.
 *
 * @internal
 */
export class MetadataEntityValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `metadataEntity` object.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param name - A name for the object
   * @param metadataEntity - The object to validate
   * @param schema - The `Schema` object. This is either the `tileset.schema`,
   * or the `Schema` object that was read from the `schemaUri`.
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the given object is a valid metadataEntity object
   */
  static validateMetadataEntity(
    path: string,
    name: string,
    metadataEntity: MetadataEntity,
    schema: Schema,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, metadataEntity, context)) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        path,
        name,
        metadataEntity,
        context
      )
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(
        path,
        metadataEntity,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(metadataEntity)) {
      return result;
    }

    // Validate that the class and properties are structurally
    // valid and comply to the metadata schema
    const className = metadataEntity.class;
    const entityProperties = metadataEntity.properties;
    if (
      !MetadataStructureValidator.validateMetadataStructure(
        path,
        name,
        className,
        entityProperties,
        schema,
        context
      )
    ) {
      result = false;
      // Bail out early if the structure is not valid!
      return result;
    }

    // Here, the basic structure of the class and properties
    // have been determined to be valid. Continue to validate
    // the values of the properties.
    const metadataClasses = defaultValue(schema.classes, {});
    const metadataClass = metadataClasses[className];
    const classProperties = defaultValue(metadataClass.properties, {});
    const validProperties = defaultValue(entityProperties, {});
    const validPropertyNames = Object.keys(validProperties);

    // Validate each property
    for (const propertyName of validPropertyNames) {
      const propertyPath = path + "/" + propertyName;
      const classProperty = classProperties[propertyName];

      // Note: The check whether 'required' properties are
      // present and have values was already done by the
      // MetadataStructureValidator
      const propertyValue = validProperties[propertyName];
      if (defined(propertyValue)) {
        // The property value MUST match the structure
        // of the property definition
        if (
          !MetadataValueValidator.validateValueStructure(
            propertyPath,
            propertyName,
            classProperty,
            propertyName,
            propertyValue,
            schema,
            context
          )
        ) {
          result = false;
        }
      }
    }
    return result;
  }
}
