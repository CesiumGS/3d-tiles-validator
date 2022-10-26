// Temporary:
/* eslint-disable prefer-const */
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { defined } from "../../base/defined";
import { defaultValue } from "../../base/defaultValue";

import { ValidationContext } from "./../ValidationContext";
import { BasicValidator } from "./../BasicValidator";
import { RootPropertyValidator } from "./../RootPropertyValidator";
import { ExtendedObjectsValidators } from "./../ExtendedObjectsValidators";

import { MetadataStructureValidator } from "./MetadataStructureValidator";
import { PropertyTablePropertyValidator } from "./PropertyTablePropertyValidator";

import { Schema } from "../../structure/Metadata/Schema";
import { PropertyTable } from "../../structure/PropertyTable";
import { BinaryPropertyTable } from "../../binary/BinaryPropertyTable";
import { PropertyTableProperty } from "../../structure/PropertyTableProperty";
import { ClassProperty } from "../../structure/Metadata/ClassProperty";
import { MetadataComponentTypes } from "../../metadata/MetadataComponentTypes";
import { SemanticValidationIssues } from "../../issues/SemanticValidationIssues";
import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";
import { BufferView } from "../../structure/BufferView";
import { ArrayBuffers } from "../../binary/ArrayBuffers";
import { NumericBuffers } from "../../binary/NumericBuffers";

/**
 * A class for validations related to BinaryPropertyTable objects.
 *
 *
 * @private
 */
export class BinaryPropertyTableValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `BinaryPropertyTable`.
   *
   * @param path The path for the `ValidationIssue` instances
   * @param binaryPropertyTable The object to validate
   * @param context The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateBinaryPropertyTable(
    path: string,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    let result = true;

    const metadataClass = binaryPropertyTable.metadataClass;
    const propertyTable = binaryPropertyTable.propertyTable;

    const classProperties = defaultValue(metadataClass.properties, {});

    for (const propertyId of Object.keys(classProperties)) {
      const classProperty = classProperties[propertyId];
      const propertyPath = path + "/properties/" + propertyId;
      if (
        !BinaryPropertyTableValidator.validateBinaryPropertyTableProperty(
          propertyPath,
          propertyId,
          classProperty,
          binaryPropertyTable,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  private static validateBinaryPropertyTableProperty(
    path: string,
    propertyId: string,
    classProperty: ClassProperty,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    let result = true;

    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableCount = propertyTable.count;

    const binaryBufferStructure = binaryPropertyTable.binaryBufferStructure;
    const bufferViews = defaultValue(binaryBufferStructure.bufferViews, []);
    const buffers = defaultValue(binaryBufferStructure.buffers, []);
    const binaryBufferData = binaryPropertyTable.binaryBufferData;
    const bufferViewsData = defaultValue(binaryBufferData.bufferViewsData, []);
    const buffersData = defaultValue(binaryBufferData.buffersData, []);

    const propertyTableProperties = defaultValue(propertyTable.properties, {});
    const propertyTableProperty = propertyTableProperties[propertyId];

    const valuesBufferViewIndex = propertyTableProperty.values;
    const valuesBufferView = bufferViews[valuesBufferViewIndex];

    const type = classProperty.type;
    const componentType = classProperty.componentType;
    const count = classProperty.count;
    const isArray = classProperty.array === true;
    const isVariableLengthArray = isArray && !defined(count);

    // If the property is a variable-length array, validate
    // the arrayOffsets buffer view.
    if (isVariableLengthArray) {
      if (
        !BinaryPropertyTableValidator.validateArrayOffsetsBufferView(
          path,
          propertyId,
          binaryPropertyTable,
          context
        )
      ) {
        result = false;
        // Bail out early when the arrayOffsets are not valid
        return result;
      }
    }

    // If the property is a STRING property, validate
    // the stringOffsets buffer view
    if (type === "STRING") {
      if (
        !BinaryPropertyTableValidator.validateStringOffsetsBufferView(
          path,
          propertyId,
          binaryPropertyTable,
          context
        )
      ) {
        result = false;
        // Bail out early when the stringOffsets are not valid
        return result;
      }
    }

    if (isArray) {
      if (type === "STRING") {
      } else if (type === "BOOLEAN") {
      } else if (type === "ENUM") {
      } else {
      }
    } else {
      if (type === "STRING") {
      } else if (type === "BOOLEAN") {
      } else if (type === "ENUM") {
      } else {
        if (
          !BinaryPropertyTableValidator.validateValuesBufferView(
            path,
            propertyId,
            componentType!,
            binaryPropertyTable,
            context
          )
        ) {
          result = false;
        }
      }
    }

    return result;
  }

  private static validateValuesBufferView(
    path: string,
    propertyId: string,
    componentType: string,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Obtain the `PropertyTableProperty`
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = defaultValue(propertyTable.properties, {});
    const propertyTableProperty = propertyTableProperties[propertyId];

    // Obtain the `values` information
    const valuesBufferViewIndex = propertyTableProperty.values!;

    // Validate the `values` `byteOffset`
    if (
      !BinaryPropertyTableValidator.validateBufferViewByteOffset(
        path,
        propertyId,
        "values",
        valuesBufferViewIndex,
        componentType,
        binaryPropertyTable,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validates the `arrayOffsets` of the specified property.
   *
   * This assumes that the specified property is a variable-length
   * property.
   *
   * @param path The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
   * @param propertyId The property ID
   * @param binaryPropertyTable The `BinaryPropertyTable`
   * @param context The `ValidationContext`
   * @returns Whether the property was valid
   */
  private static validateArrayOffsetsBufferView(
    path: string,
    propertyId: string,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Obtain the `PropertyTableProperty`
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = defaultValue(propertyTable.properties, {});
    const propertyTableProperty = propertyTableProperties[propertyId];

    // Obtain the `arrayOffsets` information
    const arrayOffsetsBufferViewIndex = propertyTableProperty.arrayOffsets!;
    const arrayOffsetType = defaultValue(
      propertyTableProperty.arrayOffsetType,
      "UINT32"
    );

    // Validate the `arrayOffsets` `byteOffset`
    if (
      !BinaryPropertyTableValidator.validateBufferViewByteOffset(
        path,
        propertyId,
        "arrayOffsets",
        arrayOffsetsBufferViewIndex,
        arrayOffsetType,
        binaryPropertyTable,
        context
      )
    ) {
      result = false;
    }

    // Validate the `arrayOffsets` `byteLength`
    const propertyTableCount = propertyTable.count;
    const numElements = propertyTableCount + 1;
    if (
      !BinaryPropertyTableValidator.validateBufferViewByteLength(
        path,
        propertyId,
        "arrayOffsets",
        arrayOffsetsBufferViewIndex,
        arrayOffsetType,
        binaryPropertyTable,
        numElements,
        context
      )
    ) {
      result = false;
    }

    // Only if the basic properties have been valid,
    // Validate that the offsets are ascending
    if (result) {
      if (
        !BinaryPropertyTableValidator.validateOffsets(
          path,
          propertyId,
          "arrayOffsets",
          arrayOffsetsBufferViewIndex,
          arrayOffsetType,
          binaryPropertyTable,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validates the `stringOffsets` of the specified property.
   *
   * This assumes that the specified property is a STRING property
   *
   * @param path The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
   * @param propertyId The property ID
   * @param binaryPropertyTable The `BinaryPropertyTable`
   * @param context The `ValidationContext`
   * @returns Whether the property was valid
   */
  private static validateStringOffsetsBufferView(
    path: string,
    propertyId: string,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Obtain the `PropertyTableProperty`
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = defaultValue(propertyTable.properties, {});
    const propertyTableProperty = propertyTableProperties[propertyId];

    // Obtain the `stringOffsets` information
    const stringOffsetsBufferViewIndex = propertyTableProperty.stringOffsets!;
    const stringOffsetType = defaultValue(
      propertyTableProperty.stringOffsetType,
      "UINT32"
    );

    // Validate the `stringOffsets` `byteOffset`
    if (
      !BinaryPropertyTableValidator.validateBufferViewByteOffset(
        path,
        propertyId,
        "stringOffsets",
        stringOffsetsBufferViewIndex,
        stringOffsetType,
        binaryPropertyTable,
        context
      )
    ) {
      result = false;
    }

    // Validate the `stringOffsets` `byteLength`
    const propertyTableCount = propertyTable.count;
    const numElements = propertyTableCount + 1;
    if (
      !BinaryPropertyTableValidator.validateBufferViewByteLength(
        path,
        propertyId,
        "stringOffsets",
        stringOffsetsBufferViewIndex,
        stringOffsetType,
        binaryPropertyTable,
        numElements,
        context
      )
    ) {
      result = false;
    }

    // Only if the basic properties have been valid,
    // Validate that the offsets are ascending
    if (result) {
      if (
        !BinaryPropertyTableValidator.validateOffsets(
          path,
          propertyId,
          "stringOffsets",
          stringOffsetsBufferViewIndex,
          stringOffsetType,
          binaryPropertyTable,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validate that the offsets in the specified buffer view are ascending.
   *
   * This is used for `arrayOffsets` or `stringOffsets`, which are supposed
   * to contain ascending numbers (not necessarily strictly ascending).
   *
   * @param propertyPath The base path for `ValidationIssue` instances
   * @param propertyId The property ID
   * @param bufferViewName The name of the buffer view ('arrayOffsets',
   * or 'stringOffsets')
   * @param bufferViewIndex The index of the buffer view (i.e. the
   * actual value of 'arrayOffsets', or 'stringOffsets')
   * @param componentType The component type. This is either the
   * `arrayOffsetsType` or `stringOffsetsType`
   * @param binaryPropertyTable The `BinaryPropertyTable`
   * @param context The `ValidationContext`
   * @returns Whether the offsets are valid
   */
  private static validateOffsets(
    propertyPath: string,
    propertyId: string,
    bufferViewName: string,
    bufferViewIndex: number,
    componentType: string,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    const path = propertyPath + "/" + bufferViewName;
    let result = true;

    const binaryBufferData = binaryPropertyTable.binaryBufferData;
    const bufferViewsData = defaultValue(binaryBufferData.bufferViewsData, []);
    const bufferVieData = bufferViewsData[bufferViewIndex];

    const array = NumericBuffers.getNumericBufferAsArray(
      bufferVieData,
      componentType
    );

    for (let i = 0; i < array.length - 1; i++) {
      const value0 = array[i];
      const value1 = array[i + 1];
      if (value0 > value1) {
        const message =
          `The '${bufferViewName}' buffer view of property '${propertyId}' ` +
          `must contain ascending values, but for the buffer view with ` +
          `index ${bufferViewIndex} the value at index ${i} is ${value0} ` +
          `and the value at index ${i + 1} is ${value1}`;
        const issue = MetadataValidationIssues.METADATA_INVALID_OFFSETS(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the byte offset of the specified buffer view.
   *
   * The byte offset must be aligned to a multiple of the
   * size of the component type.
   *
   * @param propertyPath The base path for `ValidationIssue` instances
   * @param propertyId The property ID
   * @param bufferViewName The name of the buffer view ('values',
   * 'arrayOffsets', or 'stringOffsets')
   * @param bufferViewIndex The index of the buffer view (i.e. the
   * actual value of 'values', 'arrayOffsets', or 'stringOffsets')
   * @param componentType The component type. This is either the
   * component type of the property, or the `arrayOffsetsType`
   * or `stringOffsetsType`
   * @param binaryPropertyTable The `BinaryPropertyTable`
   * @param context The `ValidationContext`
   * @returns Whether the byte offset was valid
   */
  private static validateBufferViewByteOffset(
    propertyPath: string,
    propertyId: string,
    bufferViewName: string,
    bufferViewIndex: number,
    componentType: string,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    const path = propertyPath + "/" + bufferViewName;
    let result = true;

    const binaryBufferStructure = binaryPropertyTable.binaryBufferStructure;
    const bufferViews = defaultValue(binaryBufferStructure.bufferViews, []);

    const bufferView = bufferViews[bufferViewIndex];

    const componentTypeByteSize =
      MetadataComponentTypes.byteSizeForComponentType(componentType);

    const byteOffset = bufferView.byteOffset;
    const misalignment = byteOffset % componentTypeByteSize;
    if (misalignment !== 0) {
      const message =
        `The '${bufferViewName}' buffer view of property '${propertyId}' ` +
        `has component type '${componentType}', which requires the ` +
        `buffer view to be aligned to ${componentTypeByteSize} bytes, ` +
        `but the buffer view with index ${bufferViewIndex} has a ` +
        `byteOffset of ${byteOffset}, causing a misalignment ` +
        `of ${misalignment} bytes`;
      const issue = MetadataValidationIssues.METADATA_INVALID_ALIGNMENT(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }
    return result;
  }

  /**
   * Validate the byte length of the specified buffer view.
   *
   * The byte length must be `numElements*sizeof(componentType)`.
   *
   * @param propertyPath The path for `ValidationIssue` instances
   * @param propertyId The property ID
   * @param bufferViewName The name of the buffer view ('values',
   * 'arrayOffsets', or 'stringOffsets')
   * @param bufferViewIndex The index of the buffer view (i.e. the
   * actual value of 'values', 'arrayOffsets', or 'stringOffsets')
   * @param componentType The component type. This is either the
   * component type of the property, or the `arrayOffsetsType`
   * or `stringOffsetsType`
   * @param binaryPropertyTable The `BinaryPropertyTable`
   * @param numElements The number of elements in the buffer view.
   * @param context The `ValidationContext`
   * @returns Whether the byte length was valid
   */
  private static validateBufferViewByteLength(
    propertyPath: string,
    propertyId: string,
    bufferViewName: string,
    bufferViewIndex: number,
    componentType: string,
    binaryPropertyTable: BinaryPropertyTable,
    numElements: number,
    context: ValidationContext
  ): boolean {
    const path = propertyPath + "/" + bufferViewName;
    let result = true;

    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableCount = propertyTable.count;

    const binaryBufferStructure = binaryPropertyTable.binaryBufferStructure;
    const bufferViews = defaultValue(binaryBufferStructure.bufferViews, []);

    const bufferView = bufferViews[bufferViewIndex!];

    const componentTypeByteSize =
      MetadataComponentTypes.byteSizeForComponentType(componentType);
    const expectedByteLength = numElements * componentTypeByteSize;
    const actualByteLength = bufferView.byteLength;
    if (actualByteLength !== expectedByteLength) {
      const message =
        `The '${bufferViewName}' buffer view of property '${propertyId}' ` +
        `has component type '${componentType}', and is part of a ` +
        `property table with a 'count' of ${propertyTableCount}, so it must ` +
        `have a byteLength of ${numElements}*${componentTypeByteSize} = ` +
        `${expectedByteLength}. But the buffer view with index ` +
        `${bufferViewIndex} has a byteLength of ${actualByteLength}`;
      const issue = MetadataValidationIssues.METADATA_INVALID_SIZE(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }
    return result;
  }
}
