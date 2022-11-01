import { defined } from "../base/defined";
import { ClassProperty } from "../structure/Metadata/ClassProperty";
import { MetadataComponentTypes } from "./MetadataComponentTypes";

/**
 * Internal methods related to metadata values.
 *
 * @private
 */
export class MetadataValues {
  /**
   * Processes the given "raw" value that was obtained for a metadata
   * property (e.g. from the JSON representation), and returns the
   * processed value according to the type definition that is given
   * by the given class property.
   *
   * If the type defines a `noData` value, and the given value
   * is the `noData` value, then the `default` value of the type
   * is returned.
   *
   * If the type defines the value to be `normalized`, then the
   * normalization is applied to the given values.
   *
   * If the type defines an `offset`, then the offset is added
   * to the value.
   *
   * If the type defines a `scale`, then this is multiplied
   * with the value.
   *
   * @param classProperty The `ClassProperty`
   * @param offsetOverride: An optional override for the
   * `offset` of the `ClassProperty`. If this is defined, then
   * it will be used instead of the one from the class property.
   * @param scaleOverride: An optional override for the
   * `scale` of the `ClassProperty`. If this is defined, then
   * it will be used instead of the one from the class property.
   * @param value The value
   * @returns The processed value
   */
  static processValue(
    classProperty: ClassProperty,
    offsetOverride: any,
    scaleOverride: any,
    value: any
  ): any {
    const noData = classProperty.noData;
    const defaultValue = classProperty.default;
    if (defined(noData)) {
      if (MetadataValues.arrayDeepEquals(value, noData)) {
        return MetadataValues.arrayDeepClone(defaultValue);
      }
    }
    if (!defined(value)) {
      return MetadataValues.arrayDeepClone(defaultValue);
    }
    value = MetadataValues.arrayDeepClone(value);

    if (classProperty.normalized === true) {
      const componentType = classProperty.componentType;
      value = MetadataValues.normalize(value, componentType);
    }
    const offset = defined(offsetOverride)
      ? offsetOverride
      : classProperty.offset;
    const scale = defined(scaleOverride) ? scaleOverride : classProperty.scale;
    value = MetadataValues.transform(value, offset, scale);
    return value;
  }

  /**
   * Normalize the given input value, based on the given component type.
   *
   * If example, the value of `255` for `UINT8` will be normalized to `1.0`.
   *
   * @param value The input value
   * @param componentType The component type
   * @returns The normalized value
   */
  private static normalize(value: any, componentType: string | undefined): any {
    if (!Array.isArray(value)) {
      return MetadataComponentTypes.normalize(value, componentType);
    }
    for (let i = 0; i < value.length; i++) {
      value[i] = MetadataValues.normalize(value[i], componentType);
    }
    return value;
  }

  /**
   * Applies the given offset and scale to the given input value, if they
   * are defined.
   *
   * @param value The input value
   * @param offset The optional offset
   * @param scale The optional scale
   * @returns The transformed value
   */
  private static transform(value: any, offset: any, scale: any): any {
    value = MetadataValues.applyScale(value, scale);
    value = MetadataValues.applyOffset(value, offset);
    return value;
  }

  /**
   * Applies the given scale factor to the given input value, if the
   * scale factor is defined.
   *
   * @param value The input value
   * @param scale The optional scale factor
   * @returns The resulting value
   */
  private static applyScale(value: any, scale: any): any {
    if (!defined(scale)) {
      return value;
    }
    if (!Array.isArray(value)) {
      return value * scale;
    }
    for (let i = 0; i < value.length; i++) {
      value[i] = MetadataValues.applyScale(value[i], scale[i]);
    }
    return value;
  }

  /**
   * Applies the given offset value to the given input value, if the
   * offset value is defined.
   *
   * @param value The input value
   * @param offset The optional offset value
   * @returns The resulting value
   */
  private static applyOffset(value: any, offset: any): any {
    if (!defined(offset)) {
      return value;
    }
    if (!Array.isArray(value)) {
      return value + offset;
    }
    for (let i = 0; i < value.length; i++) {
      value[i] = MetadataValues.applyOffset(value[i], offset[i]);
    }
    return value;
  }

  /**
   * Checks whether two values are equal, taking into account the
   * possibility that these values may be arrays.
   *
   * @param left The left value
   * @param right The right value
   * @returns Whether the objects are equal
   */
  private static arrayDeepEquals(left: any, right: any) {
    if (!Array.isArray(left)) {
      return left === right;
    }
    if (!Array.isArray(right)) {
      return false;
    }
    if (left.length !== right.length) {
      return false;
    }
    for (let i = 0; i < left.length; i++) {
      if (!MetadataValues.arrayDeepEquals(left[i], right[i])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns a deep clone of the given value, taking into account
   * the possibility that the value may be an array.
   *
   * Non-array values (inclding objects!) will be returned
   * directly.
   *
   * @param value The input value
   * @returns The result value
   */
  private static arrayDeepClone(value: any) {
    if (!Array.isArray(value)) {
      return value;
    }
    const result = value.slice();
    for (let i = 0; i < value.length; i++) {
      result[i] = MetadataValues.arrayDeepClone(value[i]);
    }
    return result;
  }
}
