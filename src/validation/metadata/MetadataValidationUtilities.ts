import { ClassProperty } from "3d-tiles-tools";
import { MetadataEnum } from "3d-tiles-tools";
import { MetadataUtilities } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";

/**
 * Internal utilities related to the validation of ENUM values.
 *
 * These methods assume that the structural validity of their
 * inputs has already been checked. They are only utility
 * methods for the subsequent validation steps.
 *
 * @internal
 */
export class MetadataValidationUtilities {
  /**
   * Computes the enum 'valueType' of the specified ENUM property.
   *
   * If any required element of the input is `undefined`, then
   * `undefined` is returned.
   *
   * @param schema - The schema
   * @param className - The class name
   * @param propertyName - The property name
   * @returns The value type
   */
  static computeEnumValueType(
    schema: Schema,
    className: string,
    propertyName: string
  ) {
    const classProperty = MetadataValidationUtilities.computeClassProperty(
      schema,
      className,
      propertyName
    );
    if (!classProperty) {
      return undefined;
    }
    const enumValueType = MetadataUtilities.computeEnumValueType(
      schema,
      classProperty
    );
    return enumValueType;
  }

  /**
   * Computes the mapping from enum value values to enum value
   * names for the specified property.
   *
   * If any required element of the input is `undefined`, then
   * `undefined` is returned.
   *
   * @param schema - The schema
   * @param className - The class name
   * @param propertyName - The property name
   * @returns The value value names
   */
  static computeEnumValueValueNames(
    schema: Schema,
    className: string,
    propertyName: string
  ): { [key: number]: string } | undefined {
    const classProperty = MetadataValidationUtilities.computeClassProperty(
      schema,
      className,
      propertyName
    );
    if (!classProperty) {
      return undefined;
    }
    const metadataEnum = MetadataValidationUtilities.computeMetadataEnum(
      schema,
      classProperty.enumType
    );
    if (!metadataEnum) {
      return undefined;
    }
    const enumValueValueNames =
      MetadataUtilities.computeMetadataEnumValueValueNames(metadataEnum);
    return enumValueValueNames;
  }
  /**
   * Computes the `ClassProperty` that describes the specified
   * property.
   *
   * This will find the `class` for `schema.classes[className]`,
   * and the `property` for `class[propertyName]`.
   *
   * This assumes that the given structures are valid. If any
   * element in this process is `undefined`, then `undefined`
   * is returned.
   *
   * @param schema - The metadata schema
   * @param className - The class name
   * @param propertyName - The property name
   * @returns The valid enum value values
   */
  static computeClassProperty(
    schema: Schema,
    className: string,
    propertyName: string
  ): ClassProperty | undefined {
    const classes = schema.classes;
    if (!classes) {
      return undefined;
    }
    const metadataClass = classes[className];
    if (!metadataClass) {
      return undefined;
    }
    const classProperties = metadataClass.properties;
    if (!classProperties) {
      return undefined;
    }
    const classProperty = classProperties[propertyName];
    return classProperty;
  }

  /**
   * Computes the set of (numeric) enum values that are valid
   * for the specified property.
   *
   * This will find...
   * - the `class` for `schema.classes[className]`
   * - the `property` for `class[propertyName]`
   * - the `enum` for `schema.enums[property.enumType]`
   * - all values that appear as `enum.values[i].value`
   *
   * This assumes that the given structures are valid. If any
   * element in this process is `undefined`, then `undefined`
   * is returned.
   *
   * @param schema - The metadata schema
   * @param className - The class name
   * @param propertyName - The property name
   * @returns The valid enum value values
   */
  static computeValidEnumValueValues(
    schema: Schema,
    className: string,
    propertyName: string
  ): number[] | undefined {
    const classProperty = MetadataValidationUtilities.computeClassProperty(
      schema,
      className,
      propertyName
    );
    if (!classProperty) {
      return undefined;
    }
    const metadataEnum = MetadataValidationUtilities.computeMetadataEnum(
      schema,
      classProperty.enumType
    );
    if (!metadataEnum) {
      return undefined;
    }
    const enumValues = metadataEnum.values;
    if (!enumValues) {
      return undefined;
    }
    const enumValueValues = [];
    for (let i = 0; i < enumValues.length; i++) {
      const enumValue = enumValues[i];
      if (!enumValue) {
        return undefined;
      }
      const value = enumValue.value;
      if (value === undefined) {
        return undefined;
      }
      enumValueValues.push(value);
    }
    return enumValueValues;
  }

  /**
   * Returns the metadata enum with the given name from the
   * given schema, or `undefined` if any required element
   * is `undefined`
   *
   * @param schema - The schema
   * @param enumType - The enum type
   * @returns The metadata enum
   */
  private static computeMetadataEnum(
    schema: Schema,
    enumType: string | undefined
  ): MetadataEnum | undefined {
    if (enumType === undefined) {
      return undefined;
    }
    const enums = schema.enums;
    if (!enums) {
      return undefined;
    }
    const metadataEnum = enums[enumType];
    return metadataEnum;
  }
}
