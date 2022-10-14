import { defined } from "../base/defined";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { ClassPropertyValidator } from "./ClassPropertyValidator";
import { ClassPropertySemanticsValidator } from "./ClassPropertySemanticsValidator";
import { ExtendedObjectsValidators } from "./ExtendedObjectsValidators";

import { Schema } from "../structure/Metadata/Schema";
import { SchemaClass } from "../structure/Metadata/SchemaClass";

/**
 * A class for validations related to `SchemaClass` objects.
 *
 * @private
 */
export class SchemaClassValidator {
  /**
   * Validate the given `SchemaClass` object
   *
   * @param schemaClassPath The path for `ValidationIssue` instances
   * @param name The name of the class
   * @param schemaClass The actual `SchemaClass`
   * @param schema The `Schema`
   * @param context The `ValidatonContext`
   * @returns Whether the object was valid
   */
  static validateSchemaClass(
    schemaClassPath: string,
    name: string,
    schemaClass: SchemaClass,
    schema: Schema,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        schemaClassPath,
        name,
        schemaClass,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        schemaClassPath,
        name,
        schemaClass,
        context
      )
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(
        schemaClassPath,
        schemaClass,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(schemaClass)) {
      return result;
    }

    // Validate the name.
    // If the name is defined, it MUST be a string.
    if (
      !BasicValidator.validateOptionalString(
        schemaClassPath,
        schemaClass,
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
        schemaClassPath,
        schemaClass,
        "description",
        context
      )
    ) {
      result = false;
    }

    // Validate the properties
    const properties = schemaClass.properties;
    const propertiesPath = schemaClassPath + "/properties";
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
      for (const propertyName of Object.keys(properties!)) {
        const property = properties![propertyName];
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
            schemaClassPath,
            properties!,
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
