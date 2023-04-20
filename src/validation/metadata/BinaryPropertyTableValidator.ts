import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "./../ValidationContext";

import { BinaryPropertyTable } from "3d-tiles-tools";
import { NumericBuffers } from "3d-tiles-tools";

import { MetadataComponentTypes } from "3d-tiles-tools";
import { MetadataTypes } from "3d-tiles-tools";

import { ClassProperty } from "3d-tiles-tools";

import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";
import { BinaryPropertyTableValuesValidator } from "./BinaryPropertyTableValuesValidator";

/**
 * A class for validations related to BinaryPropertyTable objects.
 *
 * @internal
 */
export class BinaryPropertyTableValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `BinaryPropertyTable`.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param binaryPropertyTable - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
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

    // Only if the basic validity checks passed, perform
    // the validation of the metadata VALUES
    if (result) {
      if (
        !BinaryPropertyTableValuesValidator.validateBinaryPropertyTableValues(
          path,
          binaryPropertyTable,
          context
        )
      ) {
        result = true;
      }
    }

    return result;
  }

  /**
   * Validate a single property of a `BinaryPropertyTable`
   *
   * @param path - The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
   * @param propertyId - The property ID
   * @param classProperty - The `ClassProperty`
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @param context - The `ValidationContext`
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

    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableCount = propertyTable.count;

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
      let numStrings = propertyTableCount;
      if (isVariableLengthArray) {
        numStrings = BinaryPropertyTableValidator.getValidatedArrayOffset(
          propertyId,
          propertyTableCount,
          binaryPropertyTable
        );
      } else if (isArray) {
        numStrings = propertyTableCount * count!;
      }

      if (
        !BinaryPropertyTableValidator.validateStringOffsetsBufferView(
          path,
          propertyId,
          binaryPropertyTable,
          numStrings,
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
   * @param path - The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
   * @param propertyId - The property ID
   * @param classProperty - The `ClassProperty`
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @param context - The `ValidationContext`
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
      const binaryEnumInfo = binaryPropertyTable.binaryEnumInfo;
      const enumValueTypes = binaryEnumInfo.enumValueTypes;
      componentType = enumValueTypes[enumType];
    } else if (!defined(componentType)) {
      componentType = "UINT8";
    }

    // Obtain the `PropertyTableProperty`
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableProperties = defaultValue(propertyTable.properties, {});
    const propertyTableProperty = propertyTableProperties[propertyId];

    // Obtain the `values` information
    const valuesBufferViewIndex = propertyTableProperty.values;

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
          componentType,
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
      binaryPropertyTable
    );
    const componentTypeByteSize =
      MetadataComponentTypes.byteSizeForComponentType(componentType);
    let expectedByteLength = numValues * componentTypeByteSize;
    if (type === "BOOLEAN") {
      expectedByteLength = Math.ceil(numValues / 8) * componentTypeByteSize;
    }

    // Validate that the length of the 'values' buffer
    // view is sufficient for storing the values.
    if (
      !BinaryPropertyTableValidator.validateValuesBufferViewByteLength(
        path,
        propertyId,
        valuesBufferViewIndex,
        componentType,
        binaryPropertyTable,
        numValues,
        expectedByteLength,
        context
      )
    ) {
      result = false;
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
   * @param path - The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
   * @param propertyId - The property ID
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @param context - The `ValidationContext`
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
      !BinaryPropertyTableValidator.validateOffsetBufferViewByteLength(
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
   * @param path - The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
   * @param propertyId - The property ID
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @param numStrings - The number of strings. For non-array properties,
   * this is just the `propertyTable.count`. For fixed-length array
   * properties, this is `propertyTable.count * classProperty.count`.
   * For variable-length array properties, this is the last value
   * in the `arrayOffsets`.
   * @param context - The `ValidationContext`
   * @returns Whether the property was valid
   */
  private static validateStringOffsetsBufferView(
    path: string,
    propertyId: string,
    binaryPropertyTable: BinaryPropertyTable,
    numStrings: number,
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
    const numStringOffsetValues = numStrings + 1;
    if (
      !BinaryPropertyTableValidator.validateOffsetBufferViewByteLength(
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
   * @param propertyPath - The base path for `ValidationIssue` instances
   * @param propertyId - The property ID
   * @param bufferViewName - The name of the buffer view ('arrayOffsets',
   * or 'stringOffsets')
   * @param bufferViewIndex - The index of the buffer view (i.e. the
   * actual value of 'arrayOffsets', or 'stringOffsets')
   * @param componentType - The component type. This is either the
   * `arrayOffsetsType` or `stringOffsetsType`
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @param context - The `ValidationContext`
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
   * @param propertyPath - The base path for `ValidationIssue` instances
   * @param propertyId - The property ID
   * @param bufferViewName - The name of the buffer view ('values',
   * 'arrayOffsets', or 'stringOffsets')
   * @param bufferViewIndex - The index of the buffer view (i.e. the
   * actual value of 'values', 'arrayOffsets', or 'stringOffsets')
   * @param componentType - The component type. This is either the
   * component type of the property, or the `arrayOffsetsType`
   * or `stringOffsetsType`
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @param context - The `ValidationContext`
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
   * This is intended for buffer views that are `arrayOffsets`
   * or `stringOffsets`.
   *
   * @param propertyPath - The path for `ValidationIssue` instances
   * @param propertyId - The property ID
   * @param bufferViewName - The name of the buffer view
   * ('arrayOffsets', or 'stringOffsets')
   * @param bufferViewIndex - The index of the buffer view (i.e. the
   * actual value of 'values', 'arrayOffsets', or 'stringOffsets')
   * @param componentType - The component type. This is either the
   * `arrayOffsetsType` or `stringOffsetsType`
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @param numValues - The number of values in the buffer view.
   * @param context - The `ValidationContext`
   * @returns Whether the byte length was valid
   */
  private static validateOffsetBufferViewByteLength(
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

    const bufferView = bufferViews[bufferViewIndex];

    // Compute the expected number of bytes.
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
      const issue = MetadataValidationIssues.METADATA_INVALID_LENGTH(
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
   * @param propertyPath - The path for `ValidationIssue` instances
   * @param propertyId - The property ID
   * @param bufferViewIndex - The index of the buffer view (i.e. the
   * actual value of the 'values')
   * @param componentType - The resolved component type (this is
   * assumed to already have possible default values, like
   * UINT8 for BOOLEAN and STRING types)
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @param numValues - The number of values in the buffer view.
   * @param context - The `ValidationContext`
   * @returns Whether the byte length was valid
   */
  private static validateValuesBufferViewByteLength(
    propertyPath: string,
    propertyId: string,
    bufferViewIndex: number,
    componentType: string,
    binaryPropertyTable: BinaryPropertyTable,
    numValues: number,
    expectedByteLength: number,
    context: ValidationContext
  ): boolean {
    const path = propertyPath + "/values";
    let result = true;

    const binaryBufferStructure = binaryPropertyTable.binaryBufferStructure;
    const bufferViews = defaultValue(binaryBufferStructure.bufferViews, []);

    const bufferView = bufferViews[bufferViewIndex];
    const actualByteLength = bufferView.byteLength;
    if (actualByteLength !== expectedByteLength) {
      const message = BinaryPropertyTableValidator.createByteLengthMessage(
        propertyId,
        binaryPropertyTable,
        componentType,
        numValues,
        expectedByteLength
      );
      const issue = MetadataValidationIssues.METADATA_INVALID_LENGTH(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }
    return result;
  }

  /**
   * Creates an elaborate error message explaining why a certain
   * buffer view byte length was expected, when the actual byte
   * length did not match the expected one.
   *
   * @param propertyId - The property ID
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @param componentType - The component type. This is assumed
   * to already have default values (e.g. UINT8 for BOOLEAN)
   * @param numValues - The number of values, as computed with
   * `computeNumberOfValues`
   * @param expectedByteLength - The expected byte length
   * @returns The error message
   */
  private static createByteLengthMessage(
    propertyId: string,
    binaryPropertyTable: BinaryPropertyTable,
    componentType: string,
    numValues: number,
    expectedByteLength: number
  ): string {
    const propertyTable = binaryPropertyTable.propertyTable;
    const propertyTableCount = propertyTable.count;

    const metadataClass = binaryPropertyTable.metadataClass;
    const classProperties = defaultValue(metadataClass.properties, {});
    const classProperty = classProperties[propertyId];

    const propertyTableProperties = defaultValue(propertyTable.properties, {});
    const propertyTableProperty = propertyTableProperties[propertyId];
    const valuesBufferViewIndex = propertyTableProperty.values;

    const binaryBufferStructure = binaryPropertyTable.binaryBufferStructure;
    const bufferViews = defaultValue(binaryBufferStructure.bufferViews, []);
    const valuesBufferView = bufferViews[valuesBufferViewIndex];

    const type = classProperty.type;
    const count = classProperty.count;
    const isArray = classProperty.array === true;
    const isVariableLengthArray = isArray && !defined(count);
    const componentCount = MetadataTypes.componentCountForType(type);

    const componentTypeByteSize =
      MetadataComponentTypes.byteSizeForComponentType(componentType);

    const actualByteLength = valuesBufferView.byteLength;
    if (isVariableLengthArray) {
      // For variable-length string arrays, the number of bytes
      // is just the number of values (as obtained from the
      // last string offset)
      if (type === "STRING") {
        const message =
          `The 'values' buffer view of property '${propertyId}' ` +
          `stores the values of variable-length string arrays. ` +
          `The last 'stringOffsets' value indicates that there ` +
          `should be ${numValues} bytes in these strings. ` +
          `But the buffer view with index ${valuesBufferViewIndex} ` +
          `has a byteLength of ${actualByteLength}.`;
        return message;
      }

      // For variable-length boolean arrays, the number of values
      // is given by the last array offset, and the number of
      // bytes is ceil(numValues/8).
      if (type === "BOOLEAN") {
        const message =
          `The 'values' buffer view of property '${propertyId}' ` +
          `stores the values of variable-length boolean arrays. ` +
          `The last 'arrayOffsets' value indicates that there ` +
          `should be ${numValues} values. ` +
          `The buffer view should have a byteLength of ` +
          `ceil(${numValues}/8) = ${expectedByteLength}. ` +
          `But the buffer view with index ${valuesBufferViewIndex} ` +
          `has a byteLength of ${actualByteLength}.`;
        return message;
      }

      // For non-STRING, non-BOOLEAN variable length arrays, the
      // number of values is given by the last array offset.
      // The number of bytes is the number of values, multiplied
      // the the component size.
      const message =
        `The 'values' buffer view of property '${propertyId}' ` +
        `stores the values of variable-length arrays with ` +
        `type ${type} and component type ${componentType}. ` +
        `The last 'arrayOffsets' value indicates that there ` +
        `should be ${numValues} values, so the buffer view should have ` +
        `a byteLength of ${numValues}*${componentTypeByteSize} = ` +
        `${expectedByteLength}. ` +
        `But the buffer view with index ${valuesBufferViewIndex} ` +
        `has a byteLength of ${actualByteLength}.`;
      return message;
    }

    // Handling fixed-length arrays
    if (isArray) {
      // For fixed-length STRING arrays, the number of
      // bytes is just the number of values, as obtained
      // from the last string offset
      if (type === "STRING") {
        const message =
          `The 'values' buffer view of property '${propertyId}' ` +
          `stores the values of fixed-length string arrays ` +
          `with length ${count}. ` +
          `The last 'stringOffsets' value indicates that there ` +
          `should be ${numValues} bytes in these strings. ` +
          `But the buffer view with index ${valuesBufferViewIndex} ` +
          `has a byteLength of ${actualByteLength}.`;
        return message;
      }

      // For fixed-length boolean arrays, the number of bytes
      // is given by ceil(numValues/8).
      if (type === "BOOLEAN") {
        const message =
          `The 'values' buffer view of property '${propertyId}' ` +
          `stores the values of fixed-length boolean arrays ` +
          `with length ${count}. ` +
          `It is part of a property table with a 'count' of ` +
          `${propertyTableCount}. ` +
          `So there are ${count}*${propertyTableCount} = ${numValues} ` +
          `values, and the buffer view should have a byteLength ` +
          `of ceil(${numValues}/8) = ${expectedByteLength}. ` +
          `But the buffer view with index ${valuesBufferViewIndex} ` +
          `has a byteLength of ${actualByteLength}.`;
        return message;
      }

      // For non-STRING, non-BOOLEAN fixed length arrays, the
      // number of bytes is given by the number of values,
      // multiplied by the component size.
      const message =
        `The 'values' buffer view of property '${propertyId}' ` +
        `stores the values of fixed-length arrays with ` +
        `type ${type}, component type ${componentType}, and  ` +
        `array length ${count}. ` +
        `It is part of a property table with a 'count' of ` +
        `${propertyTableCount}. ` +
        `So there are ${count}*${propertyTableCount} = ${numValues} ` +
        `values, and the buffer view should have a byteLength ` +
        `of ${numValues}*${componentTypeByteSize} = ` +
        `${expectedByteLength}. ` +
        `But the buffer view with index ${valuesBufferViewIndex} ` +
        `has a byteLength of ${actualByteLength}.`;
      return message;
    }

    // Handling non-arrays

    // For STRING properties, the number of bytes is the
    // same as the number of values (given by the last
    // string offset)
    if (type === "STRING") {
      const message =
        `The 'values' buffer view of property '${propertyId}' ` +
        `stores the values of strings. ` +
        `The last 'stringOffsets' value indicates that there ` +
        `should be ${numValues} bytes in these strings. ` +
        `But the buffer view with index ${valuesBufferViewIndex} ` +
        `has a byteLength of ${actualByteLength}.`;
      return message;
    }

    // For BOOLEAN properties, the number of bytes is given
    // by ceil(numValues/8).
    if (type === "BOOLEAN") {
      const message =
        `The 'values' buffer view of property '${propertyId}' ` +
        `stores boolean values. ` +
        `It is part of a property table with a 'count' of ` +
        `${propertyTableCount}. ` +
        `So the buffer view should have a byteLength ` +
        `of ceil(${numValues}/8) = ${expectedByteLength}. ` +
        `But the buffer view with index ${valuesBufferViewIndex} ` +
        `has a byteLength of ${actualByteLength}.`;
      return message;
    }

    // For non-STRING, non-BOOLEAN properties, the number of bytes
    // is given by the nunber of values, multiplied with the
    // component size
    const message =
      `The 'values' buffer view of property '${propertyId}' ` +
      `stores values with type ${type} and component type ` +
      `${componentType}.` +
      `It is part of a property table with a 'count' of ` +
      `${propertyTableCount}. ` +
      `So there are ${propertyTableCount}*${componentCount} ` +
      `= ${numValues} values, and the buffer view should ` +
      `have a byteLength of ${numValues}*${componentTypeByteSize} = ` +
      `${expectedByteLength}. ` +
      `But the buffer view with index ${valuesBufferViewIndex} ` +
      `has a byteLength of ${actualByteLength}.`;
    return message;
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
   * @param propertyId - The property ID
   * @param binaryPropertyTable - The `BinaryPropertyTable`
   * @returns The number of values
   */
  private static computeNumberOfValues(
    propertyId: string,
    binaryPropertyTable: BinaryPropertyTable
  ): number {
    const metadataClass = binaryPropertyTable.metadataClass;
    const classProperties = defaultValue(metadataClass.properties, {});
    const classProperty = classProperties[propertyId];

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
            propertyTableCount * count!,
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
   * @param propertyId - The property ID
   * @param index - The index
   * @param binaryPropertyTable - The `BinaryPropertyTable`
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
      arrayOffsetsBufferView,
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
   * @param propertyId - The property ID
   * @param index - The index
   * @param binaryPropertyTable - The `BinaryPropertyTable`
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
      stringOffsetsBufferView,
      index,
      stringOffsetType
    );
    return stringOffset;
  }
}
