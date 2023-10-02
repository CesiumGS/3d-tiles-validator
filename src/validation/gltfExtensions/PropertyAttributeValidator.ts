import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { RootPropertyValidator } from "../RootPropertyValidator";
import { ExtendedObjectsValidators } from "../ExtendedObjectsValidators";

import { MetadataStructureValidator } from "../metadata/MetadataStructureValidator";

import { PropertyAttributePropertyValidator } from "./PropertyAttributePropertyValidator";

/**
 * A class for validations related to `propertyAttribute` objects.
 *
 * This class performs the basic JSON-level validation of the
 * property attributes.
 *
 * The validation of any of the underlying binary data of
 * a property attribute has to start at the mesh primitive
 * that refers to the property attribute, because it requires
 * knowledge about the attributes that are defined in the
 * referring mesh primitive.
 *
 * @internal
 */
export class PropertyAttributeValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `propertyAttribute` object.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyAttribute - The object to validate
   * @param schema - The `Schema` object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validatePropertyAttribute(
    path: string,
    propertyAttribute: any,
    schema: Schema,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "propertyAttribute",
        propertyAttribute,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        path,
        "propertyAttribute",
        propertyAttribute,
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
        propertyAttribute,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(propertyAttribute)) {
      return result;
    }

    // Validate that the class and properties are structurally
    // valid and comply to the metadata schema
    const className = propertyAttribute.class;
    const attributeProperties = propertyAttribute.properties;
    if (
      !MetadataStructureValidator.validateMetadataStructure(
        path,
        "property attribute",
        className,
        attributeProperties,
        schema,
        context
      )
    ) {
      // Bail out early if the structure is not valid!
      return false;
    }

    // Validate the name.
    // If the name is defined, it MUST be a string.
    if (
      !BasicValidator.validateOptionalString(
        path,
        propertyAttribute,
        "name",
        context
      )
    ) {
      result = false;
    }

    // Here, the basic structure of the class and properties
    // have been determined to be valid. Continue to validate
    // the values of the properties.
    const validProperties = defaultValue(attributeProperties, {});
    const validPropertyNames = Object.keys(validProperties);
    const classes = defaultValue(schema.classes, {});
    const metadataClass = classes[className];
    const classProperties = defaultValue(metadataClass.properties, {});

    // Validate each property
    for (const propertyName of validPropertyNames) {
      const propertyPath = path + "/properties/" + propertyName;
      const classProperty = classProperties[propertyName];

      // Note: The check whether 'required' properties are
      // present and have values was already done by the
      // MetadataStructureValidator
      const propertyValue = validProperties[propertyName];
      if (defined(propertyValue)) {
        if (
          !PropertyAttributePropertyValidator.validatePropertyAttributeProperty(
            propertyPath,
            propertyName,
            propertyValue,
            classProperty,
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
