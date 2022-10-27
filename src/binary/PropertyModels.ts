import { defined } from "../base/defined";

import { NumericBuffers } from "./NumericBuffers";

/**
 * Internal methods related to `PropertyModel` instances
 *
 * @private
 */
export class PropertyModels {
  /**
   * Returns the 'slice' information that is given by an offsets
   * buffer or a fixed number.
   *
   * This returns `{ offset, length }` for the `arrayOffsets` or
   * `stringOffsets` of a property, for a given index.
   *
   * When the given `count` is defined, then the result will
   * just be `{ index * count, count }`.
   *
   * Otherwise, the result will be `{ offset, length }`, where `offset`
   * is the offset that is read from the given buffer at index `index`,
   * and `length` is `offset[index+1] - offset[index]`.
   *
   * @param index The index
   * @param offsetsBuffer The offsets
   * @param offsetType The `componentType` for the offsets
   * @param count The count
   * @returns The slice information
   */
  static computeSlice(
    index: number,
    offsetsBuffer: Buffer | undefined,
    offsetType: string,
    count: number | undefined
  ): { offset: number; length: number } {
    if (defined(count)) {
      return {
        offset: index * count!,
        length: count!,
      };
    }
    const offset = NumericBuffers.getNumericFromBuffer(
      offsetsBuffer!,
      index,
      offsetType
    );
    const nextOffset = NumericBuffers.getNumericFromBuffer(
      offsetsBuffer!,
      index + 1,
      offsetType
    );
    const length = nextOffset - offset;
    return {
      offset: offset,
      length: length,
    };
  }
}
