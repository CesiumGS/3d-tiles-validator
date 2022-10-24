import { defined } from "../base/defined";
import { defaultValue } from "../base/defaultValue";

import { BinaryMetadataEntityModel } from "./BinaryMetadataEntityModel";
import { BinaryPropertyTable } from "./BinaryPropertyTable";
import { PropertyModel } from "./PropertyModel";
import { NumericPropertyModel } from "./NumericPropertyModel";
import { NumericArrayPropertyModel } from "./NumericArrayPropertyModel";
import { BooleanPropertyModel } from "./BooleanPropertyModel";
import { BooleanArrayPropertyModel } from "./BooleanArrayPropertyModel";
import { StringPropertyModel } from "./StringPropertyModel";
import { StringArrayPropertyModel } from "./StringArrayPropertyModel";

import { MetadataEntityModels } from "../metadata/MetadataEntityModels";
import { MetadataError } from "../metadata/MetadataError";

import { ClassProperty } from "../../src/structure/Metadata/ClassProperty";
import { MetadataEntityModel } from "../metadata/MetadataEntityModel";

/**
 * Implementation of a model for a property table that is backed
 * by binary data.
 *
 * @private
 */
export class PropertyTableModel {
  /**
   * The structure containing the raw data of the binary
   * property table
   */
  private readonly _binaryPropertyTable: BinaryPropertyTable;

  /**
   * A mapping from property IDs to the `PropertyModel`
   * instances that provide the property values. These
   * are the "columns" of the table
   */
  private readonly _propertyIdToModel: { [key: string]: PropertyModel } = {};

  /**
   * A mapping from 'semantic' strings to the 'propertyId'
   * strings of the properties that have the respective
   * semantic
   */
  private readonly _semanticToPropertyId: { [key: string]: string };

  constructor(binaryPropertyTable: BinaryPropertyTable) {
    this._binaryPropertyTable = binaryPropertyTable;

    // Initialize the `PropertyModel` instances for
    // the property table properties
    const propertyTable = this._binaryPropertyTable.propertyTable;
    const propertyTableProperties = defaultValue(propertyTable.properties, {});
    for (const propertyId of Object.keys(propertyTableProperties)) {
      const propertyModel = this.createModel(propertyId);
      this._propertyIdToModel[propertyId] = propertyModel;
    }

    const metadataClass = binaryPropertyTable.metadataClass;
    this._semanticToPropertyId =
      MetadataEntityModels.computeSemanticToPropertyIdMapping(metadataClass);
  }

  /**
   * Returns the `MetadataEntityModel` that corresponds to the
   * row of the table with the given index.
   *
   * @param index The index (i.e. the table row)
   * @returns The `MetdataEntityModel`
   * @throws MetadataError If the index is out of range
   */
  getMetadataEntityModel(index: number): MetadataEntityModel {
    const propertyTable = this._binaryPropertyTable.propertyTable;
    const count = propertyTable.count;
    if (index < 0 || index >= count) {
      const message = `The index must be in [0,${count}), but is ${index}`;
      throw new MetadataError(message);
    }
    const semanticToPropertyId = this._semanticToPropertyId;
    const metadataEntityModel = new BinaryMetadataEntityModel(
      this,
      index,
      semanticToPropertyId
    );
    return metadataEntityModel;
  }

  /**
   * Returns the `ClassProperty` that defines the structure of the
   * property with the given ID, or `undefined` if this table was
   * created for a `MetadataClass` that does not define this property.
   *
   * @param propertyId The property ID
   * @returns The `ClassProperty`
   */
  getClassProperty(propertyId: string): ClassProperty | undefined {
    const binaryPropertyTable = this._binaryPropertyTable;
    const metadataClass = binaryPropertyTable.metadataClass;
    const classProperties = defaultValue(metadataClass.properties, {});
    return classProperties[propertyId];
  }

  /**
   * Returns the `PropertyModel` for the property with the given ID.
   * This is the "column" of the table that contains the property
   * data. Returns `undefined` if this table was created for
   * a `MetadataClass` that does not define this property.
   *
   * @param propertyId The property ID
   * @returns The `PropertyModel`
   */
  getPropertyModel(propertyId: string): PropertyModel | undefined {
    return this._propertyIdToModel[propertyId];
  }

  private createModel(propertyId: string): PropertyModel {
    // Check that the `MetadataClass` defines the
    // matching `ClassProperty`
    const metadataClass = this._binaryPropertyTable.metadataClass;
    const classProperties = metadataClass.properties;
    if (!defined(classProperties)) {
      const message = `Metadata class does not have any properties`;
      throw new MetadataError(message);
    }
    const classProperty = classProperties![propertyId];
    if (!defined(classProperty)) {
      const message = `Metadata class does not have property ${propertyId}`;
      throw new MetadataError(message);
    }

    // Check that the `PropertyTable` defines the
    // matching `PropertyTableProperty`
    const propertyTable = this._binaryPropertyTable.propertyTable;
    const propertyTableProperties = propertyTable.properties;
    if (!defined(propertyTableProperties)) {
      const message = `Property table does not have any properties`;
      throw new MetadataError(message);
    }
    const propertyTableProperty = propertyTableProperties![propertyId];
    if (!defined(propertyTableProperty)) {
      const message = `Property table does not have property ${propertyId}`;
      throw new MetadataError(message);
    }

    // Obtain the required buffers from the binary data:
    const binaryBufferData = this._binaryPropertyTable.binaryBufferData;
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
      const enumValueTypes = this._binaryPropertyTable.enumValueTypes;
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
}
