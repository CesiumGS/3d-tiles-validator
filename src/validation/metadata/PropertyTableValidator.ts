import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "./../ValidationContext";
import { BasicValidator } from "./../BasicValidator";
import { RootPropertyValidator } from "./../RootPropertyValidator";
import { ExtendedObjectsValidators } from "./../ExtendedObjectsValidators";

import { MetadataStructureValidator } from "./MetadataStructureValidator";
import { PropertyTablePropertyValidator } from "./PropertyTablePropertyValidator";

import { Schema } from "3d-tiles-tools";
import { PropertyTable } from "3d-tiles-tools";

/**
 * A class for validations related to `propertyTable` objects.
 *
 * This class performs the basic JSON-level validation of the
 * property table. The validation of binary data is done with
 * the BinaryPropertyTableValidator.
 *
 * @internal
 */
export class PropertyTableValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `propertyTable` object.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyTable - The object to validate
   * @param numBufferViews - The number of buffer views that are available
   * @param schema - The `Schema` object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validatePropertyTable(
    path: string,
    propertyTable: PropertyTable,
    numBufferViews: number,
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

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(
        path,
        propertyTable,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(propertyTable)) {
      return result;
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
          !PropertyTablePropertyValidator.validatePropertyTableProperty(
            propertyPath,
            propertyName,
            propertyValue,
            numBufferViews,
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
