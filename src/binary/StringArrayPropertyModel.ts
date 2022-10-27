import { PropertyModel } from "./PropertyModel";

import { ArrayBuffers } from "./ArrayBuffers";
import { PropertyModels } from "./PropertyModels";

/**
 * Implementation of a `PropertyModel` for string arrays
 *
 * @private
 */
export class StringArrayPropertyModel implements PropertyModel {
  // Implementation note:
  // Either the `arrayOffsetsBuffer` or the `count` may be undefined.
  // When `arrayOffsetsBuffer` is defined, then this indicates a
  // variable-length array. When the `count` is defined, then this
  // indicates a fixed-length array.

  private static readonly decoder = new TextDecoder();

  private readonly _valuesBuffer: Buffer;
  private readonly _arrayOffsetsBuffer: Buffer | undefined;
  private readonly _arrayOffsetType: string;
  private readonly _stringOffsetsBuffer: Buffer;
  private readonly _stringOffsetType: string;
  private readonly _count: number | undefined;

  constructor(
    valuesBuffer: Buffer,
    arrayOffsetsBuffer: Buffer | undefined,
    arrayOffsetType: string,
    stringOffsetsBuffer: Buffer,
    stringOffsetType: string,
    count: number | undefined
  ) {
    this._valuesBuffer = valuesBuffer;
    this._arrayOffsetsBuffer = arrayOffsetsBuffer;
    this._arrayOffsetType = arrayOffsetType;
    this._stringOffsetsBuffer = stringOffsetsBuffer;
    this._stringOffsetType = stringOffsetType;
    this._count = count;
  }

  getPropertyValue(index: number): any {
    const valuesBuffer = this._valuesBuffer;
    const arrayOffsetsBuffer = this._arrayOffsetsBuffer;
    const arrayOffsetType = this._arrayOffsetType;
    const stringOffsetsBuffer = this._stringOffsetsBuffer;
    const stringOffsetType = this._stringOffsetType;
    const count = this._count;

    const arraySlice = PropertyModels.computeSlice(
      index,
      arrayOffsetsBuffer,
      arrayOffsetType,
      count
    );
    const arrayOffset = arraySlice.offset;
    const arrayLength = arraySlice.length;

    const result = new Array(arrayLength);
    for (let i = 0; i < arrayLength; i++) {
      const n = arrayOffset + i;

      const stringSlice = PropertyModels.computeSlice(
        n,
        stringOffsetsBuffer,
        stringOffsetType,
        undefined
      );
      const stringOffset = stringSlice.offset;
      const stringLength = stringSlice.length;
      const arrayBuffer = ArrayBuffers.fromBuffer(valuesBuffer);
      const element = StringArrayPropertyModel.decoder.decode(
        arrayBuffer.slice(stringOffset, stringOffset + stringLength)
      );
      result[i] = element;
    }
    return result;
  }
}
