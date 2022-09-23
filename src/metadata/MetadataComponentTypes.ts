import { defined } from "../base/defined";

/**
 * Internal utilities related to the `componentType` of the
 * `ClassProperty` instances of `MetadataClass` objects
 *
 * @private
 */
export class MetadataComponentTypes {
  /**
   * The valid values for the `class.property.componentType` property
   */
  static allComponentTypes: string[] = [
    "INT8",
    "UINT8",
    "INT16",
    "UINT16",
    "INT32",
    "UINT32",
    "INT64",
    "UINT64",
    "FLOAT32",
    "FLOAT64",
  ];

  /**
   * Integer component types.
   * These are the types for which a property can be `normalized`,
   * and the valid values for the `enum.valueType` property
   */
  static integerComponentTypes: string[] = [
    "INT8",
    "UINT8",
    "INT16",
    "UINT16",
    "INT32",
    "UINT32",
    "INT64",
    "UINT64",
  ];

  /**
   * Returns whether the given type is an integer component
   * type.
   *
   * @param type The type
   * @returns Whether the type is an integer component type
   */
  static isIntegerComponentType(componentType: string | undefined) {
    if (!defined(componentType)) {
      return false;
    }
    return MetadataComponentTypes.integerComponentTypes.includes(
      componentType!
    );
  }

  // Partially adapted from CesiumJS
  static normalize(value: number, componentType: string | undefined): number {
    if (MetadataComponentTypes.isIntegerComponentType(componentType)) {
      return Math.max(
        Number(value) /
          Number(MetadataComponentTypes.maximumValue(componentType)),
        -1.0
      );
    }
    return value;
  }

  // Partially adapted from CesiumJS
  private static maximumValue(componentType: string | undefined) {
    switch (componentType) {
      case "INT8":
        return 127;
      case "UINT8":
        return 255;
      case "INT16":
        return 32767;
      case "UINT16":
        return 65535;
      case "INT32":
        return 2147483647;
      case "UINT32":
        return 4294967295;
      case "INT64":
        return BigInt("9223372036854775807");
      case "UINT64":
        return BigInt("18446744073709551615");
      case "FLOAT32":
        return 340282346638528859811704183484516925440.0;
      case "FLOAT64":
        return Number.MAX_VALUE;
    }
    return undefined;
  }
}
