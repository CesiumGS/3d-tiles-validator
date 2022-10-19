import { defined } from "../../base/defined";

import { ValidationContext } from "./../ValidationContext";
import { BasicValidator } from "./../BasicValidator";

import { ClassPropertyValueValidator } from "./ClassPropertyValueValidator";

import { PropertyTableProperty } from "../../structure/PropertyTableProperty";
import { ClassProperty } from "../../structure/Metadata/ClassProperty";

import { MetadataComponentTypes } from "../../metadata/MetadataComponentTypes";

import { StructureValidationIssues } from "../../issues/StructureValidationIssues";
import { BinaryMetadata } from "./BinaryMetadata";

/**
 * A class for validations related to `propertyTable.property` objects.
 *
 * @private
 */
export class PropertyTablePropertyValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `propertyTable.property` object.
   *
   * @param path The path for the `ValidationIssue` instances
   * @param propertyName The name of the property
   * @param propertyTableProperty The object to validate
   * @param binaryMetadata The binary metadata (buffers and buffer views)
   * @param classProperty The `ClassProperty` definition from the schema
   * @param context The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validatePropertyTableProperty(
    path: string,
    propertyName: string,
    propertyTableProperty: PropertyTableProperty,
    binaryMetadata: BinaryMetadata,
    classProperty: ClassProperty,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        propertyName,
        propertyTableProperty,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // The basic structure of the binary metdata was already
    // validated (for example, by a `SubtreeValidator` when
    // this data is part of a `Subtree`)
    const numBufferViews = binaryMetadata.bufferViews
      ? binaryMetadata.bufferViews.length
      : 0;

    // The basic structure of the class property was already
    // validated by the `MatadataStructureValidator`
    const isVariableLengthArray =
      classProperty.array && !defined(classProperty.count);
    const isString = classProperty.type === "STRING";

    // Validate the values
    // The values MUST be defined
    // The values MUST be an integer in [0, numBufferViews)
    const values = propertyTableProperty.values;
    const valuesPath = path + "/values";
    if (
      !BasicValidator.validateIntegerRange(
        valuesPath,
        "values",
        values,
        0,
        true,
        numBufferViews,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate the arrayOffsets
    const arrayOffsets = propertyTableProperty.arrayOffsets;
    const arrayOffsetsPath = path + "/arrayOffsets";
    if (isVariableLengthArray) {
      // For variable-length arrays, the arrayOffsets MUST be defined
      if (!defined(arrayOffsets)) {
        const message =
          `The property '${propertyName}' is a variable-length array, ` +
          `but the property table property does not define 'arrayOffsets'`;
        const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      } else {
        // The arrayOffsets MUST be an integer in [0, numBufferViews)
        if (
          !BasicValidator.validateIntegerRange(
            arrayOffsetsPath,
            "arrayOffsets",
            arrayOffsets!,
            0,
            true,
            numBufferViews,
            false,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate the stringOffsets
    const stringOffsets = propertyTableProperty.stringOffsets;
    const stringOffsetsPath = path + "/stringOffsets";
    if (isString) {
      // For the STRING type, the stringOffsets MUST be defined
      if (!defined(stringOffsets)) {
        const message =
          `The property '${propertyName}' has the type 'STRING', ` +
          `but the property table property does not define 'stringOffsets'`;
        const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      } else {
        // The stringOffsets MUST be an integer in [0, numBufferViews)
        if (
          !BasicValidator.validateIntegerRange(
            stringOffsetsPath,
            "stringOffsets",
            stringOffsets!,
            0,
            true,
            numBufferViews,
            false,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // TODO The arrayOffsetType and stringOffsetType should
    // probably only be allowed when the type is a dynamic
    // length array or string types

    // Validate the arrayOffsetType
    const arrayOffsetType = propertyTableProperty.arrayOffsetType;
    const arrayOffsetTypePath = path + "/arrayOffsetType";
    if (defined(arrayOffsetType)) {
      // The arrayOffsetType MUST be one of the allowed types,
      // namely UINT8, UINT16, UINT32 or UINT64
      if (
        !BasicValidator.validateEnum(
          arrayOffsetTypePath,
          "arrayOffsetType",
          arrayOffsetType,
          MetadataComponentTypes.unsignedComponentTypes,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the stringOffsetType
    const stringOffsetType = propertyTableProperty.stringOffsetType;
    const stringOffsetTypePath = path + "/stringOffsetType";
    if (defined(stringOffsetType)) {
      // The stringOffsetType MUST be one of the allowed types,
      // namely UINT8, UINT16, UINT32 or UINT64
      if (
        !BasicValidator.validateEnum(
          stringOffsetTypePath,
          "stringOffsetType",
          stringOffsetType,
          MetadataComponentTypes.unsignedComponentTypes,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the offset
    const offset = propertyTableProperty.offset;
    if (defined(offset)) {
      if (
        !ClassPropertyValueValidator.validateOffsetScale(
          path,
          propertyName,
          classProperty,
          "offset",
          offset,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the scale
    const scale = propertyTableProperty.scale;
    if (defined(scale)) {
      if (
        !ClassPropertyValueValidator.validateOffsetScale(
          path,
          propertyName,
          classProperty,
          "scale",
          scale,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the max
    const max = propertyTableProperty.max;
    if (defined(max)) {
      if (
        !ClassPropertyValueValidator.validateMaxMin(
          path,
          propertyName,
          classProperty,
          "max",
          max,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the min
    const min = propertyTableProperty.min;
    if (defined(min)) {
      if (
        !ClassPropertyValueValidator.validateMaxMin(
          path,
          propertyName,
          classProperty,
          "min",
          min,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }
}
