import { defaultValue } from "3d-tiles-tools";
import { BinaryPropertyTable } from "3d-tiles-tools";

import { ClassProperties } from "3d-tiles-tools";
import { ClassProperty } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";

import { RangeIterables } from "./RangeIterables";
import { BinaryPropertyTableEnumMetadataPropertyModel } from "./BinaryPropertyTableEnumMetadataPropertyModel";
import { MetadataPropertyValuesValidator } from "./MetadataPropertyValuesValidator";
import { BinaryPropertyTableDefaultMetadataPropertyModel } from "./BinaryPropertyTableDefaultMetadataPropertyModel";

/**
 * A class for the validation of values that are stored
 * in binary property tables.
 *
 * The methods in this class assume that the structural
 * validity of the input objects has already been checked
 * by a `PropertyTableValidator` and a
 * `BinaryPropertyTableValidator`.
 *
 * @internal
 */
export class BinaryPropertyTableValuesValidator {
  /**
   * Performs the validation to ensure that the given
   * `BinaryPropertyTable` contains valid values.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param binaryPropertyTable - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the values in the object have been valid
   */
  static validateBinaryPropertyTableValues(
    path: string,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    let result = true;

    const binaryMetadata = binaryPropertyTable.binaryMetadata;
    const metadataClass = binaryMetadata.metadataClass;
    const classProperties = defaultValue(metadataClass.properties, {});

    for (const propertyName of Object.keys(classProperties)) {
      const classProperty = classProperties[propertyName];
      const propertyPath = path + "/properties/" + propertyName;
      if (
        !BinaryPropertyTableValuesValidator.validateBinaryPropertyTablePropertyValues(
          propertyPath,
          propertyName,
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
   * @param path - The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
   * @param propertyName - The property name
   * @param classProperty - The `ClassProperty`
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @param context - The `ValidationContext`
   * @returns Whether the property is valid
   */
  private static validateBinaryPropertyTablePropertyValues(
    path: string,
    propertyName: string,
    classProperty: ClassProperty,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    let result = true;

    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = defaultValue(propertyTable.properties, {});
    const propertyTablePropertry = propertyTableProperties[propertyName];

    const keys = RangeIterables.range1D(propertyTable.count);

    // Perform the checks that only apply to ENUM types,
    if (classProperty.type === "ENUM") {
      const binaryMetadata = binaryPropertyTable.binaryMetadata;
      const binaryEnumInfo = binaryMetadata.binaryEnumInfo;
      const enumType = classProperty.enumType!;
      const enumValueValueNames = binaryEnumInfo.enumValueValueNames[enumType];
      const enumValueNameValues = binaryEnumInfo.enumValueNameValues[enumType];
      const validEnumValueValues = Object.values(enumValueNameValues);
      const metadataPropertyModel =
        new BinaryPropertyTableEnumMetadataPropertyModel(
          binaryPropertyTable,
          propertyName,
          classProperty,
          enumValueValueNames
        );

      if (
        !MetadataPropertyValuesValidator.validateEnumValues(
          path,
          propertyName,
          keys,
          metadataPropertyModel,
          validEnumValueValues,
          context
        )
      ) {
        result = false;
      }
    }

    // Perform the checks that only apply to numeric types
    if (ClassProperties.hasNumericType(classProperty)) {
      const metadataPropertyModel =
        new BinaryPropertyTableDefaultMetadataPropertyModel(
          binaryPropertyTable,
          propertyName,
          propertyTablePropertry,
          classProperty
        );

      if (
        !MetadataPropertyValuesValidator.validateMinMax(
          path,
          propertyName,
          keys,
          metadataPropertyModel,
          propertyTablePropertry,
          "property table",
          classProperty,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }
}
