import { defined } from "@3d-tiles-tools/base";
import { ArrayValues } from "@3d-tiles-tools/metadata";
import { ClassProperty } from "@3d-tiles-tools/structure";

import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";

import { MetadataValuesValidationMessages } from "./MetadataValueValidationMessages";
import { MetadataPropertyModel } from "./MetadataPropertyModel";

import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";

/**
 * A class for the validation of values that are stored
 * as metadata properties.
 *
 * The methods in this class assume that the structural
 * validity of the input objects has already been checked.
 *
 * @internal
 */
export class MetadataPropertyValuesValidator {
  /**
   * Validate that the values of the specified ENUM property are valid.
   *
   * This will iterate over the given keys, obtain the RAW (numeric)
   * value for the respective key from the given model, and check
   * whether this value is contained in the given set of valid values.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param propertyName - The property name
   * @param keys - The iterable of the keys that will be used for
   * accessing the metadata property model
   * @param metadataPropertyModel - The `MetadataPropertyModel`
   * @param validEnumValueValues - The values that appeared as
   * `enum.values[i].value` in the enum definition
   * @param context - The `ValidationContext`
   * @returns Whether the enum values have been valid
   */
  static validateEnumValues<T>(
    path: string,
    propertyName: string,
    keys: Iterable<T>,
    metadataPropertyModel: MetadataPropertyModel<T>,
    validEnumValueValues: number[],
    context: ValidationContext
  ): boolean {
    let result = true;

    for (const key of keys) {
      // The validation happens based on the RAW property
      // values for enums, i.e. the `enum.value[i].value`
      // values (which are not translated into strings)
      const rawPropertyValue = metadataPropertyModel.getRawPropertyValue(key);

      // For arrays, simply validate each element individually
      if (Array.isArray(rawPropertyValue)) {
        for (let i = 0; i < rawPropertyValue.length; i++) {
          const rawPropertyValueElement = rawPropertyValue[i];
          if (
            !BasicValidator.validateEnum(
              path,
              propertyName + `[${key}][${i}]`,
              rawPropertyValueElement,
              validEnumValueValues,
              context
            )
          ) {
            result = false;
          }
        }
      } else {
        if (
          !BasicValidator.validateEnum(
            path,
            propertyName + `[${key}]`,
            rawPropertyValue,
            validEnumValueValues,
            context
          )
        ) {
          result = false;
        }
      }
    }
    return result;
  }

  /**
   * Validate the that the values of the given property model
   * are in the range that is defined by the `min`/`max`
   * values of the class property, or the property itself.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param propertyName - The property name
   * definition, for example, 'class property' or 'property texture property'.
   * @param keys - The iterable of the keys that will be used for
   * accessing the metadata property model
   * @param metadataPropertyModel - The `MetadataPropertyModel`
   * @param property - The property, which may contain `min` and
   * `max` properties, and `scale` or `offset` properties that
   * override the respective value from the class property
   * @param propertySourceInfo - A string indicating the source of
   * the property value, e.g. 'property table', or 'property texture'
   * @param classProperty - The class property
   * @param context - The `ValidationContext`
   * @returns Whether the values obeyed the limit
   */
  public static validateMinMax<T>(
    path: string,
    propertyName: string,
    keys: Iterable<T>,
    metadataPropertyModel: MetadataPropertyModel<T>,
    property: { max?: any; min?: any; scale?: any; offset?: any },
    propertySourceInfo: string,
    classProperty: ClassProperty,
    context: ValidationContext
  ) {
    let result = true;
    // When the ClassProperty defines a minimum, then the metadata
    // values MUST not be smaller than this minimum
    if (defined(classProperty.min)) {
      if (
        !MetadataPropertyValuesValidator.validateMin(
          path,
          propertyName,
          classProperty.min,
          "class property",
          keys,
          metadataPropertyModel,
          property,
          propertySourceInfo,
          classProperty,
          context
        )
      ) {
        result = false;
      }
    }
    // When the property defines a minimum, then the metadata
    // values MUST not be smaller than this minimum
    if (defined(property.min)) {
      const definedMin = property.min;
      if (
        !MetadataPropertyValuesValidator.validateMin(
          path,
          propertyName,
          definedMin,
          "property",
          keys,
          metadataPropertyModel,
          property,
          propertySourceInfo,
          classProperty,
          context
        )
      ) {
        result = false;
      } else {
        // When none of the values is smaller than the minimum from
        // the property, make sure that this minimum matches the
        // computed minimum of all metadata values
        const computedMin = MetadataPropertyValuesValidator.computeMin(
          keys,
          metadataPropertyModel
        );
        if (!ArrayValues.deepEquals(computedMin, definedMin)) {
          const message =
            `For property '${propertyName}', the property ` +
            `defines a minimum of ${definedMin}, but the computed ` +
            `minimum value is ${computedMin}`;
          const issue = MetadataValidationIssues.METADATA_VALUE_MISMATCH(
            path,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      }
    }

    // When the ClassProperty defines a maximum, then the metadata
    // values MUST not be greater than this maximum
    if (defined(classProperty.max)) {
      if (
        !MetadataPropertyValuesValidator.validateMax(
          path,
          propertyName,
          classProperty.max,
          "class property",
          keys,
          metadataPropertyModel,
          property,
          propertySourceInfo,
          classProperty,
          context
        )
      ) {
        result = false;
      }
    }
    // When the property defines a maximum, then the metadata
    // values MUST not be greater than this maximum
    if (defined(property.max)) {
      const definedMax = property.max;
      if (
        !MetadataPropertyValuesValidator.validateMax(
          path,
          propertyName,
          definedMax,
          "property texture property",
          keys,
          metadataPropertyModel,
          property,
          propertySourceInfo,
          classProperty,
          context
        )
      ) {
        result = false;
      } else {
        // When none of the values is greater than the maximum from
        // the property, make sure that this maximum matches the
        // computed maximum of all metadata values
        const computedMax = MetadataPropertyValuesValidator.computeMax(
          keys,
          metadataPropertyModel
        );
        if (!ArrayValues.deepEquals(computedMax, definedMax)) {
          const message =
            `For property '${propertyName}', the property ` +
            `defines a maximum of ${definedMax}, but the computed ` +
            `maximum value is ${computedMax}`;
          const issue = MetadataValidationIssues.METADATA_VALUE_MISMATCH(
            path,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      }
    }
    return result;
  }

  /**
   * Validate the that none of the values of the given
   * property model is smaller than the given defined
   * minimum.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param propertyName - The property name
   * @param definedMin - The defined minimum
   * @param definedMinInfo - A string indicating the source of the minimum
   * definition, for example, 'class property' or 'property texture property'.
   * @param keys - The iterable of the keys that will be used for
   * accessing the metadata property model
   * @param metadataPropertyModel - The `MetadataPropertyModel`
   * @param property - The property, which may contain `scale` or
   * `offset` properties that override the respective value from
   * the class property
   * @param propertySourceInfo - A string indicating the source of
   * the property value, e.g. 'property table', or 'property texture'
   * @param classProperty - The class property
   * @param context - The `ValidationContext`
   * @returns Whether the values obeyed the limit
   */
  private static validateMin<T>(
    path: string,
    propertyName: string,
    definedMin: any,
    definedMinInfo: string,
    keys: Iterable<T>,
    metadataPropertyModel: MetadataPropertyModel<T>,
    property: { scale?: any; offset?: any },
    propertySourceInfo: string,
    classProperty: ClassProperty,
    context: ValidationContext
  ): boolean {
    let result = true;

    for (const key of keys) {
      const rawPropertyValue = metadataPropertyModel.getRawPropertyValue(key);
      const propertyValue = metadataPropertyModel.getPropertyValue(key);

      if (ArrayValues.anyDeepLessThan(propertyValue, definedMin)) {
        const valueMessagePart =
          MetadataValuesValidationMessages.createValueMessagePart(
            rawPropertyValue,
            classProperty,
            property,
            propertyValue
          );

        const message =
          `For property '${propertyName}', the ${definedMinInfo} ` +
          `defines a minimum of ${definedMin}, but the value at ` +
          `${key} of the ${propertySourceInfo} is ${valueMessagePart}`;
        const issue = MetadataValidationIssues.METADATA_VALUE_NOT_IN_RANGE(
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
   * Compute the minimum value that appears in the given
   * metadata property model.
   *
   * This assumes that the property has a numeric type,
   * as indicated by `ClassProperties.hasNumericType`.
   *
   * @param keys - The iterable of the keys that will be used for
   * accessing the metadata property model
   * @param metadataPropertyModel - The `MetadataPropertyModel`
   * @returns The minimum
   */
  private static computeMin<T>(
    keys: Iterable<T>,
    metadataPropertyModel: MetadataPropertyModel<T>
  ): any {
    let computedMin = undefined;
    for (const key of keys) {
      const propertyValue = metadataPropertyModel.getPropertyValue(key);
      if (!defined(computedMin)) {
        computedMin = ArrayValues.deepClone(propertyValue);
      } else {
        computedMin = ArrayValues.deepMin(computedMin, propertyValue);
      }
    }
    return computedMin;
  }

  /**
   * Validate the that none of the values of the given
   * property model is greater than the given defined
   * maximum.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param propertyName - The property name
   * @param definedMax - The defined maximum
   * @param definedMaxInfo - A string indicating the source of the maximum
   * definition, for example, 'class property' or 'property texture property'.
   * @param keys - The iterable of the keys that will be used for
   * accessing the metadata property model
   * @param metadataPropertyModel - The `MetadataPropertyModel`
   * @param property - The property, which may contain `scale` or
   * `offset` properties that override the respective value from
   * the class property
   * @param propertySourceInfo - A string indicating the source of
   * the property value, e.g. 'property table', or 'property texture'
   * @param classProperty - The class property
   * @param context - The `ValidationContext`
   * @returns Whether the values obeyed the limit
   */
  private static validateMax<T>(
    path: string,
    propertyName: string,
    definedMax: any,
    definedMaxInfo: string,
    keys: Iterable<T>,
    metadataPropertyModel: MetadataPropertyModel<T>,
    property: { scale?: any; offset?: any },
    propertySourceInfo: string,
    classProperty: ClassProperty,
    context: ValidationContext
  ): boolean {
    let result = true;

    for (const key of keys) {
      const rawPropertyValue = metadataPropertyModel.getRawPropertyValue(key);
      const propertyValue = metadataPropertyModel.getPropertyValue(key);

      if (ArrayValues.anyDeepGreaterThan(propertyValue, definedMax)) {
        const valueMessagePart =
          MetadataValuesValidationMessages.createValueMessagePart(
            rawPropertyValue,
            classProperty,
            property,
            propertyValue
          );

        const message =
          `For property '${propertyName}', the ${definedMaxInfo} ` +
          `defines a maximum of ${definedMax}, but the value at ` +
          `${key} of the ${propertySourceInfo} is ${valueMessagePart}`;
        const issue = MetadataValidationIssues.METADATA_VALUE_NOT_IN_RANGE(
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
   * Compute the maximum value that appears in the given
   * metadata property model.
   *
   * This assumes that the property has a numeric type,
   * as indicated by `ClassProperties.hasNumericType`.
   *
   * @param keys - The iterable of the keys that will be used for
   * accessing the metadata property model
   * @param metadataPropertyModel - The `MetadataPropertyModel`
   * @returns The maximum
   */
  private static computeMax<T>(
    keys: Iterable<T>,
    metadataPropertyModel: MetadataPropertyModel<T>
  ): any {
    let computedMax = undefined;
    for (const key of keys) {
      const propertyValue = metadataPropertyModel.getPropertyValue(key);
      if (!defined(computedMax)) {
        computedMax = ArrayValues.deepClone(propertyValue);
      } else {
        computedMax = ArrayValues.deepMax(computedMax, propertyValue);
      }
    }
    return computedMax;
  }
}
