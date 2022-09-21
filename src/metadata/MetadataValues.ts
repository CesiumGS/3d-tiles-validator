import { defined } from "../base/defined";
import { ClassProperty } from "../structure/Metadata/ClassProperty";
import { MetadataComponentTypes } from "./MetadataComponentTypes";

export class MetadataValues {
  static processValue(classProperty: ClassProperty, value: any): any {
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
    const offset = classProperty.offset;
    const scale = classProperty.scale;
    value = MetadataValues.transform(value, offset, scale);
    return value;
  }

  private static normalize(value: any, componentType: string | undefined): any {
    if (!Array.isArray(value)) {
      return MetadataComponentTypes.normalize(value, componentType);
    }
    for (let i = 0; i < value.length; i++) {
      value[i] = MetadataValues.normalize(value[i], componentType);
    }
    return value;
  }

  private static transform(value: any, offset: any, scale: any): any {
    value = MetadataValues.applyScale(value, scale);
    value = MetadataValues.applyOffset(value, offset);
    return value;
  }

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

  static arrayDeepEquals(left: any, right: any) {
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

  static arrayDeepClone(object: any) {
    if (!Array.isArray(object)) {
      return object;
    }
    const result = object.slice();
    for (let i = 0; i < object.length; i++) {
      result[i] = MetadataValues.arrayDeepClone(object[i]);
    }
    return result;
  }
}
