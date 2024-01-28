import { defined } from "@3d-tiles-tools/base";
import { ClassProperty } from "@3d-tiles-tools/structure";

/**
 * Utility methods related to the messages that are part of
 * validation issues in the metadata validation.
 */
export class MetadataValuesValidationMessages {
  /**
   * Creates a message that describes how a metadata value was computed.
   *
   * The intention is to insert this as `The value is ${valueMessagePart}`
   * in a message that explains how the `value` was computed from the
   * raw value, normalization, offset and scale.
   *
   * @param rawValue - The raw value (e.g. from the `PropertyModel`),
   * without normalization, offset, or scale
   * @param classProperty - The class property
   * @param property - The property, which may contain `scale` or
   * `offset` properties that override the respective value from
   * the class property
   * @param value - The final value
   * @returns The message part
   */
  static createValueMessagePart(
    rawValue: any,
    classProperty: ClassProperty,
    property: { scale?: any; offset?: any },
    value: any
  ) {
    // Determine the scale and its source (i.e whether it
    // is defined in the class property, or overridden
    // in the actual property)
    let scale = undefined;
    let scaleSource = undefined;
    if (defined(property.scale)) {
      scale = property.scale;
      scaleSource = "property.scale";
    } else if (defined(classProperty.scale)) {
      scale = classProperty.scale;
      scaleSource = "classProperty.scale";
    }

    // Determine the offset and its source (i.e whether it
    // is defined in the class property, or overridden
    // in the actual property)
    let offset = undefined;
    let offsetSource = undefined;
    if (defined(property.offset)) {
      offset = property.offset;
      offsetSource = "property.offset";
    } else if (defined(classProperty.offset)) {
      offset = classProperty.offset;
      offsetSource = "classProperty.offset";
    }

    const normalized = classProperty.normalized;
    const componentType = classProperty.componentType;

    if (defined(offset) && defined(scale)) {
      if (normalized === true) {
        const messagePart =
          `computed as normalize${componentType}(rawValue)*${scaleSource}+${offsetSource} ` +
          `= normalize${componentType}(${rawValue})*${scale}+${offset} = ${value}`;
        return messagePart;
      }
      const messagePart =
        `computed as rawValue*${scaleSource}+${offsetSource} ` +
        `= ${rawValue}*${scale}+${offset} = ${value}`;
      return messagePart;
    }
    if (defined(offset)) {
      if (normalized === true) {
        const messagePart =
          `computed as normalize${componentType}(rawValue)+${offsetSource} ` +
          `= normalize${componentType}(${rawValue})+${offset} = ${value}`;
        return messagePart;
      }
      const messagePart =
        `computed as rawValue+${offsetSource} ` +
        `= ${rawValue}+${offset} = ${value}`;
      return messagePart;
    }
    if (defined(scale)) {
      if (normalized === true) {
        const messagePart =
          `computed as normalize${componentType}(rawValue)*${scaleSource} ` +
          `= normalize${componentType}(${rawValue})*${scale} = ${value}`;
        return messagePart;
      }
      const messagePart =
        `computed as rawValue*${scaleSource} ` +
        `= ${rawValue}*${scale} = ${value}`;
      return messagePart;
    }
    if (normalized === true) {
      const messagePart =
        `computed as normalize${componentType}(rawValue) ` +
        `= normalize${componentType}(${rawValue}) = ${value}`;
      return messagePart;
    }
    const messagePart = `${value}`;
    return messagePart;
  }
}
