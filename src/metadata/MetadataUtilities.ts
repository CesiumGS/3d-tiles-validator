import { defined } from "../base/defined";
import { defaultValue } from "../base/defaultValue";

import { Schema } from "../structure/Metadata/Schema";
import { ClassProperty } from "../structure/Metadata/ClassProperty";

/**
 * Internal utilities related to metadata
 *
 * @private
 */
export class MetadataUtilities {
  /**
   * Computes a mapping from enum type names to the `valueType` that
   * the respective `MetdataEnum` has (defaulting to `UINT16` if it
   * did not define one)
   *
   * @param schema The metadata `Schema`
   * @returns The mapping from enum type names to enum value types
   */
  static computeEnumValueTypes(schema: Schema): {
    [key: string]: string;
  } {
    const enumValueTypes: { [key: string]: string } = {};
    const enums = defaultValue(schema.enums, {});
    for (const enumName of Object.keys(enums)) {
      const metadataEnum = enums[enumName];
      const valueType = defaultValue(metadataEnum.valueType, "UINT16");
      enumValueTypes[enumName] = valueType;
    }
    return enumValueTypes;
  }

  /**
   * Internal method to obtain the names of enum values for the
   * given property.
   *
   * This tries to return the list of all
   * `schema.enums[classProperty.enumType].values[i].name`
   * values, returning the empty list the property does not have an
   * enum type or any element is not defined.
   *
   * @param classProperty The `ClassProperty`
   * @param schema The `Schema`
   * @returns The enum value names
   */
  static obtainEnumValueNames(
    classProperty: ClassProperty,
    schema: Schema
  ): string[] {
    const type = classProperty.type;
    if (type !== "ENUM") {
      return [];
    }
    const enumType = classProperty.enumType;
    if (!defined(enumType)) {
      return [];
    }
    const enums = defaultValue(schema.enums, {});
    const theEnum = enums[enumType!];
    if (!defined(theEnum)) {
      return [];
    }
    const enumValues = theEnum.values;
    if (!defined(enumValues)) {
      return [];
    }
    const enumValueNames = enumValues.map((e: { name: string }) => e.name);
    return enumValueNames;
  }
}
