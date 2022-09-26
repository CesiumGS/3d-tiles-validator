import { defined } from "../base/defined";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { ClassPropertyValidator } from "./ClassPropertyValidator";

import { Schema } from "../structure/Metadata/Schema";
import { SchemaClass } from "../structure/Metadata/SchemaClass";

import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

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
    const properties = schemaClass.properties as any;
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
      for (const [propertyName, property] of Object.entries(properties)) {
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
          result = false;
        }
      }

      // Validate that the 'semantic' of all properties
      // in this class are unique
      const semanticsToPropertyNames: any = {};
      for (const propertyName of Object.keys(properties)) {
        const property = properties[propertyName];
        if (defined(property)) {
          const semantic = property.semantic;
          if (defined(semantic)) {
            const otherPropertyName = semanticsToPropertyNames[semantic];
            if (defined(otherPropertyName)) {
              const issue =
                SemanticValidationIssues.CLASS_PROPERTIES_DUPLICATE_SEMANTIC(
                  schemaClassPath,
                  propertyName,
                  otherPropertyName,
                  semantic
                );
              context.addIssue(issue);
              result = false;
            }
            semanticsToPropertyNames[semantic] = propertyName;
          }
        }
      }
    }
    return result;
  }
}
