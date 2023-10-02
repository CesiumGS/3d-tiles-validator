import { defined } from "3d-tiles-tools";

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
   * @param rawValue - The raw value, as obtained from the `PropertyModel`,
   * without normalization, offset, or scale
   * @param normalized - Whether the value is normalized
   * @param scale - The optional scale
   * @param offset - The optional offset
   * @param value - The final value
   * @returns The message part
   */
  static createValueMessagePart(
    rawValue: any,
    normalized: boolean | undefined,
    scale: any,
    offset: any,
    value: any
  ) {
    if (defined(offset) && defined(scale)) {
      if (normalized === true) {
        const messagePart =
          `computed as normalize(rawValue)*scale+offset ` +
          `= normalize(${rawValue})*${scale}+${offset} = ${value}`;
        return messagePart;
      }
      const messagePart =
        `computed as rawValue*scale+offset ` +
        `= ${rawValue}*${scale}+${offset} = ${value}`;
      return messagePart;
    }
    if (defined(offset)) {
      if (normalized === true) {
        const messagePart =
          `computed as normalize(rawValue)+offset ` +
          `= normalize(${rawValue})+${offset} = ${value}`;
        return messagePart;
      }
      const messagePart = `computed as rawValue+offset = ${rawValue}+${offset} = ${value}`;
      return messagePart;
    }
    if (defined(scale)) {
      if (normalized === true) {
        const messagePart =
          `computed as normalize(rawValue)*scale ` +
          `= normalize(${rawValue})*${scale} = ${value}`;
        return messagePart;
      }
      const messagePart = `computed as rawValue*scale = ${rawValue}*${scale} = ${value}`;
      return messagePart;
    }
    if (normalized === true) {
      const messagePart =
        `computed as normalize(rawValue) ` +
        `= normalize(${rawValue}) = ${value}`;
      return messagePart;
    }
    const messagePart = `${value}`;
    return messagePart;
  }
}
