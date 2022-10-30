import { defined } from "../../base/defined";
import { defaultValue } from "../../base/defaultValue";

import { ValidationContext } from "./../ValidationContext";

import { BinaryPropertyTable } from "../../binary/BinaryPropertyTable";
import { NumericBuffers } from "../../binary/NumericBuffers";

import { MetadataComponentTypes } from "../../metadata/MetadataComponentTypes";
import { MetadataTypes } from "../../metadata/MetadataTypes";

import { ClassProperty } from "../../structure/Metadata/ClassProperty";

import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";

/**
 * A class for validations related to BinaryPropertyTable objects.
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

  /**
   * Validate a single property of a `BinaryPropertyTable`
   *
   * @param path The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
   * @param propertyId The property ID
   * @param classProperty The `ClassProperty`
   * @param binaryPropertyTable The `BinaryPropertyTable`
   * @param context The `ValidationContext`
   * @returns Whether the property is valid
   */
  private static validateBinaryPropertyTableProperty(
    path: string,
    propertyId: string,
    classProperty: ClassProperty,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    let result = true;

    const type = classProperty.type;
    const count = classProperty.count;
    const isArray = classProperty.array === true;
    const isVariableLengthArray = isArray && !defined(count);

    // If the property is a variable-length array, validate
    // the 'arrayOffsets' buffer view.
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
    // the 'stringOffsets' buffer view
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

    // Validate the 'values' buffer view
    if (
      !BinaryPropertyTableValidator.validateValuesBufferView(
        path,
        propertyId,
        classProperty,
        binaryPropertyTable,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validates the 'values' buffer view of the specified property,
   * to see whether it has the right byteOffset and byteLength.
   *
   * This is assumed to be called after the 'arrayOffsets' and
   * 'stringOffsets' have been validated for types that require
   * them.
   *
   * @param path The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
   * @param propertyId The property ID
   * @param classProperty The `ClassProperty`
   * @param binaryPropertyTable The `BinaryPropertyTable`
   * @param context The `ValidationContext`
   * @returns Whether the values are valid
   */
  private static validateValuesBufferView(
    path: string,
    propertyId: string,
    classProperty: ClassProperty,
    binaryPropertyTable: BinaryPropertyTable,
    context: ValidationContext
  ): boolean {
    let result = true;

    const type = classProperty.type;

    // Determine the component type: By default, it is given by
    // the class property. For enum types, it is looked up in
    // the enumValueTypes dictionary. For other types (STRING
    // and BOOLEAN), it defaults to UINT8 (bytes)
    let componentType = classProperty.componentType;
    if (type === "ENUM") {
      const enumType = classProperty.enumType!;
      const enumValueTypes = binaryPropertyTable.enumValueTypes;
      componentType = enumValueTypes[enumType];
    } else if (!defined(componentType)) {
      componentType = "UINT8";
    }

    // Obtain the `PropertyTableProperty`
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = defaultValue(propertyTable.properties, {});
    const propertyTableProperty = propertyTableProperties[propertyId];

    // Obtain the `values` information
    const valuesBufferViewIndex = propertyTableProperty.values!;

    // Validate the byte offset of the component type requires
    // a specific alignment
    const requiresAlignment =
      componentType != "UINT8" && componentType != "INT8";
    if (requiresAlignment) {
      // Validate the `values` `byteOffset`
      if (
        !BinaryPropertyTableValidator.validateBufferViewByteOffset(
          path,
          propertyId,
          "values",
          valuesBufferViewIndex,
          componentType!,
          binaryPropertyTable,
          context
        )
      ) {
        result = false;
      }
    }

    // Compute the number of values that are stored in
    // the 'values' buffer view, depending on the type
    // of the property and the property table count
    const numValues = BinaryPropertyTableValidator.computeNumberOfValues(
      propertyId,
      classProperty,
      binaryPropertyTable
    );

    // For BOOLEAN, 8 values are stored in 1 byte
    let effectiveNumValues = numValues;
    if (type === "BOOLEAN") {
      effectiveNumValues = Math.ceil(numValues / 8);
    }

    // Validate that the length of the 'values' buffer
    // view is sufficient for storing the effective
    // number of values.
    //
    // NOTE: The difference between
    // - validateStringValuesBufferViewByteLength
    // - validateVariableLengthArrayValuesBufferViewByteLength
    // - validatePlainBufferViewByteLength
    // is ONLY the error message: It should explain WHY a certain
    // number of elements was expected.
    const isString = type === "STRING";
    const isVariableLengthArray =
      classProperty.array === true && !defined(classProperty.count);
    if (isString) {
      if (
        !BinaryPropertyTableValidator.validateStringValuesBufferViewByteLength(
          path,
          propertyId,
          "values",
          valuesBufferViewIndex,
          componentType!,
          binaryPropertyTable,
          effectiveNumValues,
          context
        )
      ) {
        result = false;
      }
    } else if (isVariableLengthArray) {
      if (
        !BinaryPropertyTableValidator.validateVariableLengthArrayValuesBufferViewByteLength(
          path,
          propertyId,
          "values",
          valuesBufferViewIndex,
          componentType!,
          binaryPropertyTable,
          effectiveNumValues,
          context
        )
      ) {
        result = false;
      }
    } else {
      if (
        !BinaryPropertyTableValidator.validatePlainBufferViewByteLength(
          path,
          propertyId,
          "values",
          valuesBufferViewIndex,
          componentType!,
          binaryPropertyTable,
          effectiveNumValues,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validates the `arrayOffsets` of the specified property,
   * to see whether it has the right byteOffset, byteLength,
   * and contains ascending values.
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
    const numArrayOffsetValues = propertyTableCount + 1;
    if (
      !BinaryPropertyTableValidator.validatePlainBufferViewByteLength(
        path,
        propertyId,
        "arrayOffsets",
        arrayOffsetsBufferViewIndex,
        arrayOffsetType,
        binaryPropertyTable,
        numArrayOffsetValues,
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
   * Validates the `stringOffsets` of the specified property,
   * to see whether it has the right byteOffset, byteLength,
   * and contains ascending values.
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
    const numStringOffsetValues = propertyTableCount + 1;
    if (
      !BinaryPropertyTableValidator.validatePlainBufferViewByteLength(
        path,
        propertyId,
        "stringOffsets",
        stringOffsetsBufferViewIndex,
        stringOffsetType,
        binaryPropertyTable,
        numStringOffsetValues,
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
   * The byte length must be `numValues*sizeof(componentType)`.
   *
   * This is intended for "plain" buffer views, i.e. for buffer
   * views that are
   * - `arrayOffsets`
   * - `stringOffsets`
   * - `values` that are NOT variable-length arrays or STRING-typed
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
   * @param numValues The number of values in the buffer view.
   * @param context The `ValidationContext`
   * @returns Whether the byte length was valid
   */
  private static validatePlainBufferViewByteLength(
    propertyPath: string,
    propertyId: string,
    bufferViewName: string,
    bufferViewIndex: number,
    componentType: string,
    binaryPropertyTable: BinaryPropertyTable,
    numValues: number,
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
    const expectedByteLength = numValues * componentTypeByteSize;
    const actualByteLength = bufferView.byteLength;
    if (actualByteLength !== expectedByteLength) {
      const message =
        `The '${bufferViewName}' buffer view of property '${propertyId}' ` +
        `has component type '${componentType}', and is part of a ` +
        `property table with a 'count' of ${propertyTableCount}, so it must ` +
        `have a byteLength of ${numValues}*${componentTypeByteSize} = ` +
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

  /**
   * Validate the byte length of the specified buffer view.
   *
   * The byte length must be `numValues*sizeof(componentType)`.
   *
   * This is intended for buffer views that contain the values
   * of STRING typed properties.
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
   * @param numValues The number of values in the buffer view.
   * @param context The `ValidationContext`
   * @returns Whether the byte length was valid
   */
  private static validateStringValuesBufferViewByteLength(
    propertyPath: string,
    propertyId: string,
    bufferViewName: string,
    bufferViewIndex: number,
    componentType: string,
    binaryPropertyTable: BinaryPropertyTable,
    numValues: number,
    context: ValidationContext
  ): boolean {
    const path = propertyPath + "/" + bufferViewName;
    let result = true;

    const binaryBufferStructure = binaryPropertyTable.binaryBufferStructure;
    const bufferViews = defaultValue(binaryBufferStructure.bufferViews, []);

    const bufferView = bufferViews[bufferViewIndex!];

    const componentTypeByteSize =
      MetadataComponentTypes.byteSizeForComponentType(componentType);
    const expectedByteLength = numValues * componentTypeByteSize;
    const actualByteLength = bufferView.byteLength;
    if (actualByteLength !== expectedByteLength) {
      const message =
        `The '${bufferViewName}' buffer view of property '${propertyId}' ` +
        `stores the bytes of strings, with the last value of the ` +
        `'stringOffsets' buffer view indicating that there should be ` +
        `${numValues} bytes. But the buffer view with index ` +
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

  /**
   * Validate the byte length of the specified buffer view.
   *
   * The byte length must be `numValues*sizeof(componentType)`.
   *
   * This is intended for buffer views that contain the values
   * of variable-length array properties.
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
   * @param numValues The number of values in the buffer view.
   * @param context The `ValidationContext`
   * @returns Whether the byte length was valid
   */
  private static validateVariableLengthArrayValuesBufferViewByteLength(
    propertyPath: string,
    propertyId: string,
    bufferViewName: string,
    bufferViewIndex: number,
    componentType: string,
    binaryPropertyTable: BinaryPropertyTable,
    numValues: number,
    context: ValidationContext
  ): boolean {
    const path = propertyPath + "/" + bufferViewName;
    let result = true;

    const binaryBufferStructure = binaryPropertyTable.binaryBufferStructure;
    const bufferViews = defaultValue(binaryBufferStructure.bufferViews, []);

    const bufferView = bufferViews[bufferViewIndex!];

    const componentTypeByteSize =
      MetadataComponentTypes.byteSizeForComponentType(componentType);
    const expectedByteLength = numValues * componentTypeByteSize;
    const actualByteLength = bufferView.byteLength;
    if (actualByteLength !== expectedByteLength) {
      const message =
        `The '${bufferViewName}' buffer view of property '${propertyId}' ` +
        `has component type '${componentType}', and stores the values ` +
        `of variable-length arrays. The last 'arrayOffsets' value ` +
        `indicates that there should be ${numValues} values, so the ` +
        `buffer view should have a byteLength of ` +
        `${numValues}*${componentTypeByteSize} = ${expectedByteLength}. ` +
        `But the buffer view with index ${bufferViewIndex} has a ` +
        `byteLength of ${actualByteLength}.`;
      const issue = MetadataValidationIssues.METADATA_INVALID_SIZE(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }
    return result;
  }

  /**
   * Computes the number of 'values' for the specified property.
   *
   * This computes the number of values that should be in the
   * 'values' buffer view, depending on the type of the property
   * and the `count` (number of rows) of the property table.
   *
   * This refers to the components of the property type, i.e.
   * - it will be 3 for a single VEC3 property
   * - it will be the string length (in bytes) for a single STRING
   * - it will be the number of bits for a BOOLEAN property
   *
   * @param propertyId The property ID
   * @param classProperty The `ClassProperty`
   * @param binaryPropertyTable The `BinaryPropertyTable`
   * @returns The number of values
   */
  private static computeNumberOfValues(
    propertyId: string,
    classProperty: ClassProperty,
    binaryPropertyTable: BinaryPropertyTable
  ): number {
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableCount = propertyTable.count;

    const type = classProperty.type;
    const count = classProperty.count;
    const isArray = classProperty.array === true;
    const isVariableLengthArray = isArray && !defined(count);
    const componentCount = MetadataTypes.componentCountForType(type);

    if (isVariableLengthArray) {
      // For variable-length string arrays, the number of values
      // is given by the last string offset, which is found
      // at the index of the last array offset
      if (type === "STRING") {
        const lastArrayOffset =
          BinaryPropertyTableValidator.getValidatedArrayOffset(
            propertyId,
            propertyTableCount,
            binaryPropertyTable
          );
        const lastStringOffset =
          BinaryPropertyTableValidator.getValidatedStringOffset(
            propertyId,
            lastArrayOffset,
            binaryPropertyTable
          );
        return lastStringOffset;
      }

      // For non-STRING variable length arrays, the number
      // of values is given by the last array offset, times
      // the component count
      const lastArrayOffset =
        BinaryPropertyTableValidator.getValidatedArrayOffset(
          propertyId,
          propertyTableCount,
          binaryPropertyTable
        );
      return lastArrayOffset * componentCount;
    }

    // Handling fixed-length arrays
    if (isArray) {
      // For fixed-length STRING arrays, the number of
      // values is given by the last string offset
      if (type === "STRING") {
        const lastStringOffset =
          BinaryPropertyTableValidator.getValidatedStringOffset(
            propertyId,
            propertyTableCount,
            binaryPropertyTable
          );
        return lastStringOffset;
      }

      // For non-STRING fixed length arrays, the number of values
      // is given by the property table count (number of rows)
      // times the property count (array length), times the
      // component count
      return propertyTableCount * count! * componentCount;
    }

    // Handling non-arrays

    // For STRING properties, the number of values is given
    // by the last string offset
    if (type === "STRING") {
      const lastStringOffset =
        BinaryPropertyTableValidator.getValidatedStringOffset(
          propertyId,
          propertyTableCount,
          binaryPropertyTable
        );
      return lastStringOffset;
    }

    // For non-STRING properties, the number of values
    // is given by the property table count (number of rows)
    // times the component count
    return propertyTableCount * componentCount;
  }

  // Note: The getValidatedArrayOffset and getValidatedStringOffset methods
  // are not very elegant (or efficient). They are only used to dive into
  // the part of the binary data that contains the desired value, without
  // introducing additional validation- or abstraction layers.

  /**
   * Returns the array offset of the given property at the specified
   * index.
   *
   * This assumes that the property is a variable-length array property
   * and the requried structures for accessing that data have already
   * been validated.
   *
   * @param propertyId The property ID
   * @param index The index
   * @param binaryPropertyTable The `BinaryPropertyTable`
   * @returns The array offset
   */
  private static getValidatedArrayOffset(
    propertyId: string,
    index: number,
    binaryPropertyTable: BinaryPropertyTable
  ): number {
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = defaultValue(propertyTable.properties, {});
    const propertyTableProperty = propertyTableProperties[propertyId];
    const arrayOffsetsBufferViewIndex = propertyTableProperty.arrayOffsets!;
    const arrayOffsetType = defaultValue(
      propertyTableProperty.arrayOffsetType,
      "UINT32"
    );
    const binaryBufferData = binaryPropertyTable.binaryBufferData;
    const bufferViewsData = defaultValue(binaryBufferData.bufferViewsData, []);
    const arrayOffsetsBufferView = bufferViewsData[arrayOffsetsBufferViewIndex];
    const arrayOffset = NumericBuffers.getNumericFromBuffer(
      arrayOffsetsBufferView!,
      index,
      arrayOffsetType
    );
    return arrayOffset;
  }
  /**
   * Returns the string offset of the given property at the specified
   * index.
   *
   * This assumes that the property is a STRING property and the
   * requried structures for accessing that data have already
   * been validated.
   *
   * @param propertyId The property ID
   * @param index The index
   * @param binaryPropertyTable The `BinaryPropertyTable`
   * @returns The string offset
   */
  private static getValidatedStringOffset(
    propertyId: string,
    index: number,
    binaryPropertyTable: BinaryPropertyTable
  ): number {
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = defaultValue(propertyTable.properties, {});
    const propertyTableProperty = propertyTableProperties[propertyId];
    const stringOffsetsBufferViewIndex = propertyTableProperty.stringOffsets!;
    const stringOffsetType = defaultValue(
      propertyTableProperty.stringOffsetType,
      "UINT32"
    );
    const binaryBufferData = binaryPropertyTable.binaryBufferData;
    const bufferViewsData = defaultValue(binaryBufferData.bufferViewsData, []);
    const stringOffsetsBufferView =
      bufferViewsData[stringOffsetsBufferViewIndex];
    const stringOffset = NumericBuffers.getNumericFromBuffer(
      stringOffsetsBufferView!,
      index,
      stringOffsetType
    );
    return stringOffset;
  }
}
