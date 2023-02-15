import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { BinaryPropertyTable } from "./BinaryPropertyTable";
import { PropertyModel } from "./PropertyModel";
import { StringPropertyModel } from "./StringPropertyModel";
import { BooleanPropertyModel } from "./BooleanPropertyModel";
import { NumericPropertyModel } from "./NumericPropertyModel";
import { NumericArrayPropertyModel } from "./NumericArrayPropertyModel";
import { StringArrayPropertyModel } from "./StringArrayPropertyModel";
import { BooleanArrayPropertyModel } from "./BooleanArrayPropertyModel";
import { NumericBuffers } from "./NumericBuffers";

/**
 * Methods related to `PropertyModel` instances
 *
 * @internal
 */
export class PropertyModels {
  /**
   * Creates a `PropertyModel` for the specified property in
   * the given `BinaryPropertyTable`.
   *
   * This assumes that the input is structurally valid, as
   * determined with the `BinaryPropertyTableValidator`.
   *
   * This will determine the type of the property and access its
   * associated data (i.e. the required buffer views data) from
   * the given `BinaryPropertyTable`. For each type of property,
   * this will return a matching implementation of the
   * `PropertyModel` interface.
   *
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @param propertyId - The property ID
   * @returns The `PropertyModel`
   */
  static createPropertyModel(
    binaryPropertyTable: BinaryPropertyTable,
    propertyId: string
  ): PropertyModel {
    // Obtain the `ClassProperty`
    const metadataClass = binaryPropertyTable.metadataClass;
    const classProperties = metadataClass.properties;
    const classProperty = classProperties![propertyId];

    // Obtain the `PropertyTableProperty`
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = propertyTable.properties;
    const propertyTableProperty = propertyTableProperties![propertyId];

    // Obtain the required buffers from the binary data:
    const binaryBufferData = binaryPropertyTable.binaryBufferData;
    const bufferViewsData = binaryBufferData.bufferViewsData;

    // Obtain the `values` buffer view data
    const valuesBufferViewIndex = propertyTableProperty.values;
    const valuesBufferViewData = bufferViewsData[valuesBufferViewIndex];

    // Obtain the `arrayOffsets` buffer view data
    const arrayOffsetsBufferViewIndex = propertyTableProperty.arrayOffsets;
    let arrayOffsetsBufferViewData = undefined;
    if (defined(arrayOffsetsBufferViewIndex)) {
      arrayOffsetsBufferViewData =
        bufferViewsData[arrayOffsetsBufferViewIndex!];
    }
    const arrayOffsetType = defaultValue(
      propertyTableProperty.arrayOffsetType,
      "UINT32"
    );

    // Obtain the `stringOffsets` buffer view data
    const stringOffsetsBufferViewIndex = propertyTableProperty.stringOffsets;
    let stringOffsetsBufferViewData = undefined;
    if (defined(stringOffsetsBufferViewIndex)) {
      stringOffsetsBufferViewData =
        bufferViewsData[stringOffsetsBufferViewIndex!];
    }
    const stringOffsetType = defaultValue(
      propertyTableProperty.stringOffsetType,
      "UINT32"
    );

    // Determine the `enumValueType` of the property
    const enumType = classProperty.enumType;
    let enumValueType = undefined;
    if (defined(enumType)) {
      const binaryEnumInfo = binaryPropertyTable.binaryEnumInfo;
      const enumValueTypes = binaryEnumInfo.enumValueTypes;
      enumValueType = defaultValue(enumValueTypes[enumType!], "UINT16");
    }

    // Create the `PropertyModel` implementation that matches
    // the type of the property
    const type = classProperty.type;
    const componentType = classProperty.componentType;
    const count = classProperty.count;
    const isArray = classProperty.array === true;
    if (isArray) {
      if (type === "STRING") {
        const propertyModel = new StringArrayPropertyModel(
          valuesBufferViewData,
          arrayOffsetsBufferViewData,
          arrayOffsetType,
          stringOffsetsBufferViewData!,
          stringOffsetType,
          count
        );
        return propertyModel;
      }
      if (type === "BOOLEAN") {
        const propertyModel = new BooleanArrayPropertyModel(
          valuesBufferViewData,
          arrayOffsetsBufferViewData,
          arrayOffsetType,
          count
        );
        return propertyModel;
      }
      if (type === "ENUM") {
        const propertyModel = new NumericArrayPropertyModel(
          type,
          valuesBufferViewData,
          enumValueType!,
          arrayOffsetsBufferViewData,
          arrayOffsetType,
          count
        );
        return propertyModel;
      }
      // The 'type' must be a numeric (array) type here
      const propertyModel = new NumericArrayPropertyModel(
        type,
        valuesBufferViewData,
        componentType!,
        arrayOffsetsBufferViewData,
        arrayOffsetType,
        count
      );
      return propertyModel;
    }

    // The property must be a non-array property here:
    if (type === "STRING") {
      const propertyModel = new StringPropertyModel(
        valuesBufferViewData,
        stringOffsetsBufferViewData!,
        stringOffsetType
      );
      return propertyModel;
    }
    if (type === "BOOLEAN") {
      const propertyModel = new BooleanPropertyModel(valuesBufferViewData);
      return propertyModel;
    }
    if (type === "ENUM") {
      const propertyModel = new NumericPropertyModel(
        type,
        valuesBufferViewData,
        enumValueType!
      );
      return propertyModel;
    }

    // The property must be a (non-array) numeric property here
    const propertyModel = new NumericPropertyModel(
      type,
      valuesBufferViewData,
      componentType!
    );
    return propertyModel;
  }

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
   * @param index - The index
   * @param offsetsBuffer - The offsets
   * @param offsetType - The `componentType` for the offsets
   * @param count - The count
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
