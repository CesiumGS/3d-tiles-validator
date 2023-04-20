import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { RootPropertyValidator } from "../RootPropertyValidator";
import { ExtendedObjectsValidators } from "../ExtendedObjectsValidators";

import { ClassPropertyValidator } from "./ClassPropertyValidator";
import { ClassPropertySemanticsValidator } from "./ClassPropertySemanticsValidator";

import { Schema } from "3d-tiles-tools";
import { MetadataClass } from "3d-tiles-tools";

/**
 * A class for validations related to `MetadataClass` objects.
 *
 * @internal
 */
export class MetadataClassValidator {
  /**
   * Validate the given `MetadataClass` object
   *
   * @param metadataClassPath - The path for `ValidationIssue` instances
   * @param name - The name of the class
   * @param metadataClass - The actual `MetadataClass`
   * @param schema - The `Schema`
   * @param context - The `ValidatonContext`
   * @returns Whether the object was valid
   */
  static validateMetadataClass(
    metadataClassPath: string,
    name: string,
    metadataClass: MetadataClass,
    schema: Schema,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        metadataClassPath,
        name,
        metadataClass,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        metadataClassPath,
        name,
        metadataClass,
        context
      )
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(
        metadataClassPath,
        metadataClass,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(metadataClass)) {
      return result;
    }

    // Validate the name.
    // If the name is defined, it MUST be a string.
    if (
      !BasicValidator.validateOptionalString(
        metadataClassPath,
        metadataClass,
        "name",
        context
      )
    ) {
      result = false;
    }

    // Validate the description.
    // If the description is defined, it MUST be a string.
    if (
      !BasicValidator.validateOptionalString(
        metadataClassPath,
        metadataClass,
        "description",
        context
      )
    ) {
      result = false;
    }

    // Validate the properties
    const properties = metadataClass.properties;
    const propertiesPath = metadataClassPath + "/properties";
    if (defined(properties)) {
      // The properties MUST have at least 1 property
      if (
        !BasicValidator.validateNumberOfProperties(
          propertiesPath,
          "properties",
          properties,
          1,
          undefined,
          context
        )
      ) {
        result = false;
      }

      // Validate each property
      let allPropertiesValid = true;
      for (const propertyName of Object.keys(properties)) {
        const property = properties[propertyName];
        const propertyPath = propertiesPath + "/" + propertyName;

        // Each property name MUST match the ID regex
        if (
          !BasicValidator.validateIdentifierString(
            propertyPath,
            propertyName,
            propertyName,
            context
          )
        ) {
          allPropertiesValid = false;
          result = false;
        }

        if (
          !ClassPropertyValidator.validateClassProperty(
            schema,
            propertyPath,
            propertyName,
            property as any,
            context
          )
        ) {
          allPropertiesValid = false;
          result = false;
        }
      }

      // If all properties are valid, validate the semantics of all
      // properties, i.e. their uniqueness, and compliance to the
      // semantic definitions
      if (allPropertiesValid) {
        if (
          !ClassPropertySemanticsValidator.validateSemantics(
            metadataClassPath,
            properties,
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
