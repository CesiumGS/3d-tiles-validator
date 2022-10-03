import { defined } from "../base/defined";
import { defaultValue } from "../base/defaultValue";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { MetadataStructureValidator } from "./MetadataStructureValidator";

import { Schema } from "../structure/Metadata/Schema";
import { PropertyTable } from "../structure/PropertyTable";
import { PropertyTableProperty } from "../structure/PropertyTableProperty";
import { Subtree } from "../structure/Subtree";
import { ClassProperty } from "../structure/Metadata/ClassProperty";

/**
 * A class for validations related to `propertyTable` objects.
 *
 * @private
 */
export class PropertyTableValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `propertyTable` object.
   *
   * @param path The path for the `ValidationIssue` instances
   * @param propertyTable The object to validate
   * @param subtree The `Subtree` object
   * @param schema The `Schema` object
   * @param context The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validatePropertyTable(
    path: string,
    propertyTable: PropertyTable,
    subtree: Subtree,
    schema: Schema,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "propertyTable",
        propertyTable,
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
        "propertyTable",
        propertyTable,
        context
      )
    ) {
      result = false;
    }

    // Validate that the class and properties are structurally
    // valid and comply to the metadata schema
    const className = propertyTable.class;
    const tableProperties = propertyTable.properties;
    if (
      !MetadataStructureValidator.validateMetadataStructure(
        path,
        "property table",
        className,
        tableProperties,
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
        propertyTable,
        "name",
        context
      )
    ) {
      result = false;
    }

    // Validate the count
    // The count MUST be an integer
    // The count MUST be at least 1
    const count = propertyTable.count;
    const countPath = path + "/count";
    if (
      !BasicValidator.validateIntegerRange(
        countPath,
        "count",
        count,
        0,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // Here, the basic structure of the class and properties
    // have been determined to be valid. Continue to validate
    // the values of the properties.
    const validProperties = defaultValue(tableProperties, {});
    const validPropertyNames = Object.keys(validProperties);
    const classes = defaultValue(schema.classes, {});
    const schemaClass = classes[className];
    const classProperties = defaultValue(schemaClass.properties, {});

    // Validate each property
    for (const propertyName of validPropertyNames) {
      const propertyPath = path + "/" + propertyName;
      const classProperty = classProperties[propertyName];

      // Note: The check whether 'required' properties are
      // present and have values was already done by the
      // MetadataStructureValidator
      const propertyValue = tableProperties![propertyName];
      if (defined(propertyValue)) {
        if (
          !PropertyTableValidator.validatePropertyTableProperty(
            propertyPath,
            propertyName,
            propertyValue,
            subtree,
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

  /**
   * Performs the validation to ensure that the given object is a
   * valid `propertyTable.property` object.
   *
   * @param path The path for the `ValidationIssue` instances
   * @param propertyName The name of the property
   * @param propertyTableProperty The object to validate
   * @param classProperty The `ClassProperty` definition from the schema
   * @param context The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validatePropertyTableProperty(
    path: string,
    propertyName: string,
    propertyTableProperty: PropertyTableProperty,
    subtree: Subtree,
    classProperty: ClassProperty,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        propertyName,
        propertyTableProperty,
        context
      )
    ) {
      return false;
    }
    // TODO Validate property table properties
    console.log("Property table properties are not validated yet.");
    return true;
  }
}
