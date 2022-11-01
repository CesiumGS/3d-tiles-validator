import { defined } from "../../base/defined";
import { defaultValue } from "../../base/defaultValue";

import { ValidationContext } from "./../ValidationContext";

import { BinaryPropertyTable } from "../../binary/BinaryPropertyTable";

import { ClassProperty } from "../../structure/Metadata/ClassProperty";

import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";
import { PropertyTableModel } from "../../binary/PropertyTableModel";

/**
 * A class for the validation of values that are stored
 * in binary property tables.
 *
 * The methods in this class assume that the structural
 * validity of the input objects has already been checked
 * by a `PropertyTableValidator` and a
 * `BinaryPropertyTableValidator`.
 *
 * @private
 */
export class BinaryPropertyTableValuesValidator {
  /**
   * Performs the validation to ensure that the given
   * `BinaryPropertyTable` contains valid values.
   *
   * @param path The path for the `ValidationIssue` instances
   * @param binaryPropertyTable The object to validate
   * @param context The `ValidationContext` that any issues will be added to
   * @returns Whether the values in the object have been valid
   */
  static validateBinaryPropertyTableValues(
    path: string,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    let result = true;

    const metadataClass = binaryPropertyTable.metadataClass;
    const classProperties = defaultValue(metadataClass.properties, {});

    for (const propertyId of Object.keys(classProperties)) {
      const classProperty = classProperties[propertyId];
      const propertyPath = path + "/properties/" + propertyId;
      if (
        !BinaryPropertyTableValuesValidator.validateBinaryPropertyTablePropertyValues(
          propertyPath,
          propertyId,
          classProperty,
          binaryPropertyTable,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the values of a single property of a `BinaryPropertyTable`
   *
   * @param path The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
   * @param propertyId The property ID
   * @param classProperty The `ClassProperty`
   * @param binaryPropertyTable The `BinaryPropertyTable`
   * @param context The `ValidationContext`
   * @returns Whether the property is valid
   */
  private static validateBinaryPropertyTablePropertyValues(
    path: string,
    propertyId: string,
    classProperty: ClassProperty,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    let result = true;

    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableCount = propertyTable.count;

    const propertyTableProperties = defaultValue(propertyTable.properties, {});
    const propertyTablePropertry = propertyTableProperties[propertyId];

    const propertyTableModel = new PropertyTableModel(binaryPropertyTable);

    // Validate each property value
    for (let index = 0; index < propertyTableCount; index++) {
      const metadataEntityModel =
        propertyTableModel.getMetadataEntityModel(index);
      const propertyValue = metadataEntityModel.getPropertyValue(propertyId);

      if (defined(propertyTablePropertry.min)) {
        // If the property itself defines a minimum (overriding
        // the minimum from the classProperty), then validate
        // that the value is greater than or equal to that
        if (
          BinaryPropertyTableValuesValidator.genericLessThan(
            propertyValue,
            propertyTablePropertry.min!
          )
        ) {
          const message =
            `Property table property ${propertyId} defines ` +
            `a minimum of ${propertyTablePropertry.min}, but the ` +
            `value at index ${index} is ${propertyValue}`;
          const issue = MetadataValidationIssues.METADATA_VALUE_NOT_IN_RANGE(
            path,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      } else if (defined(classProperty.min)) {
        // If the classProperty defines a minimum, then validate
        // that the value is greater than or equal to that
        if (
          BinaryPropertyTableValuesValidator.genericLessThan(
            propertyValue,
            classProperty.min!
          )
        ) {
          const message =
            `For property ${propertyId}, the schema defines ` +
            `a minimum of ${classProperty.min}, but the value in the property ` +
            `table at index ${index} is ${propertyValue}`;
          const issue = MetadataValidationIssues.METADATA_VALUE_NOT_IN_RANGE(
            path,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      }

      if (defined(propertyTablePropertry.max)) {
        // If the property itself defines a maximum (overriding
        // the maximum from the classProperty), then validate
        // that the value is less than or equal to that
        if (
          BinaryPropertyTableValuesValidator.genericGreaterThan(
            propertyValue,
            propertyTablePropertry.max!
          )
        ) {
          const message =
            `Property table property ${propertyId} defines ` +
            `a maximum of ${propertyTablePropertry.max}, but the ` +
            `value at index ${index} is ${propertyValue}`;
          const issue = MetadataValidationIssues.METADATA_VALUE_NOT_IN_RANGE(
            path,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      } else if (defined(classProperty.max)) {
        // If the classProperty defines a maximum, then validate
        // that the value is less than or equal to that
        if (
          BinaryPropertyTableValuesValidator.genericGreaterThan(
            propertyValue,
            classProperty.max!
          )
        ) {
          const message =
            `For property ${propertyId}, the schema defines ` +
            `a maximum of ${classProperty.max}, but the value in the property ` +
            `table at index ${index} is ${propertyValue}`;
          const issue = MetadataValidationIssues.METADATA_VALUE_NOT_IN_RANGE(
            path,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      }
    }
    return result;
  }

  private static genericLessThan(a: any, b: any): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      for (let i = 0; i < a.length; ++i) {
        if (a[i] >= b[i]) {
          return false;
        }
      }
      return true;
    }
    if (typeof a === "number" && typeof b == "number") {
      return Number(a) < Number(b);
    }
    return false;
  }
  private static genericGreaterThan(a: any, b: any): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      for (let i = 0; i < a.length; ++i) {
        if (a[i] <= b[i]) {
          return false;
        }
      }
      return true;
    }
    if (typeof a === "number" && typeof b == "number") {
      return Number(a) > Number(b);
    }
    return false;
  }
}
