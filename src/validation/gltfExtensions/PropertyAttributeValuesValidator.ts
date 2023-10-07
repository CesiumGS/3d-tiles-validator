import { ClassProperties, MetadataUtilities, defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";
import { ArrayValues } from "3d-tiles-tools";
import { ClassProperty } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";

import { GltfData } from "./GltfData";
import { Accessors } from "./Accessors";
import { PropertyAttributePropertyModel } from "./PropertyAttributePropertyModel";

import { MetadataValuesValidationMessages } from "../metadata/MetadataValueValidationMessages";

import { StructureValidationIssues } from "../../issues/StructureValidationIssues";
import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";
import { BasicValidator } from "../BasicValidator";
import { ValidationIssues } from "../../issues/ValidationIssues";

/**
 * A class for the validation of values that are stored
 * in property attributes.
 *
 * The methods in this class assume that the structural
 * validity of the input objects has already been checked
 * by a `PropertyAttributeValidator`.
 *
 * @internal
 *
 * TODO There is a lot of "structural" overlap between this and
 * other classes - see PropertyTextureValuesValidator
 */
export class PropertyAttributeValuesValidator {
  /**
   * Performs the validation to ensure that the specified property
   * attribute contains valid values.
   *
   * This is supposed to be called after the validity of the top-level
   * extension object, the schema, and the property attribute itself have
   * been checked (the latter with
   * `PropertyAttributeValidator.validatePropertyAttribute`).
   *
   * It assumes that they are structurally valid, and ONLY checks the
   * validity of the values in the context of the mesh primitive
   * that refers to the property attribute.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyAttributeIndex - The index that was found as
   * an element `propertyAttributes[i]` of the extension object
   * that was found in the extension object in the mesh primitive
   * @param meshPrimitive - The glTF mesh primitive that contained
   * the extension object
   * @param meshIndex - The index of the mesh (only for details
   * in validation messages)
   * @param pimitiveIndex - The index of the primitive (only for details
   * in validation messages)
   * @param schema - The metadata schema
   * @param gltfStructuralMetadata - The top-level glTF structural
   * metadata object
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the values in the object have been valid
   */
  static async validatePropertyAttributeValues(
    path: string,
    propertyAttributeIndex: number,
    meshPrimitive: any,
    meshIndex: number,
    primitiveIndex: number,
    schema: Schema,
    gltfStructuralMetadata: any,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    let result = true;

    // The presence of the 'propertyAttributes', the validity of
    // the 'propertyAttributeIndex', and the STRUCTURAL validity
    // of the property attribute have already been checked
    const propertyAttributes = defaultValue(
      gltfStructuralMetadata.propertyAttributes,
      []
    );
    const propertyAttribute = propertyAttributes[propertyAttributeIndex];
    const propertyAttributeProperties = defaultValue(
      propertyAttribute.properties,
      {}
    );

    const meshPrimitiveAttributes = defaultValue(meshPrimitive.attributes, {});

    // Make sure that the `attribute` values of the properties
    // refer to valid attributes of the mesh primitive
    const propertyAttributePropertyNames = Object.keys(
      propertyAttributeProperties
    );
    for (const propertyName of propertyAttributePropertyNames) {
      const propertyAttributeProperty =
        propertyAttributeProperties[propertyName];
      const propertyAttributePropertyPath =
        path + "/properties/" + propertyName;

      const attribute = propertyAttributeProperty.attribute;
      const meshPrimitiveAttribute = meshPrimitiveAttributes[attribute];
      if (!defined(meshPrimitiveAttribute)) {
        const message =
          `The property attribute property defines the attribute ` +
          `${attribute}, but this attribute was not ` +
          `found in the attributes of primitive ${primitiveIndex} ` +
          `of mesh ${meshIndex}`;
        const issue = StructureValidationIssues.IDENTIFIER_NOT_FOUND(
          propertyAttributePropertyPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // If everything appeared to be valid until now, validate
    // the values of the property attribute properties in view
    // of the glTF mesh primitive attribute that they refer to
    if (result && gltfData.gltfDocument) {
      for (const propertyName of propertyAttributePropertyNames) {
        const propertyAttributeProperty =
          propertyAttributeProperties[propertyName];
        const propertyAttributePropertyPath =
          path + "/properties/" + propertyName;
        const metadataClassName = propertyAttribute.class;

        const classes = defaultValue(schema.classes, {});
        const metadataClass = classes[metadataClassName];
        const classProperties = defaultValue(metadataClass.properties, {});
        const classProperty = classProperties[propertyName];

        const propertyValuesValid =
          await PropertyAttributeValuesValidator.validatePropertyAttributePropertyValues(
            propertyAttributePropertyPath,
            propertyName,
            propertyAttributeProperty,
            meshPrimitive,
            meshIndex,
            primitiveIndex,
            schema,
            metadataClassName,
            classProperty,
            gltfData,
            context
          );
        if (!propertyValuesValid) {
          result = false;
        }
      }
    }
    return result;
  }

  /**
   * Validate the values of a single property of a property attribute.
   *
   * This assumes that the gltfData contains a valid gltfDocument.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param propertyName - The property name
   * @param propertyAttributeProperty - The property attribute property
   * @param meshPrimitive - The mesh primitive
   * @param meshIndex - The index of the mesh (only for details
   * in validation messages)
   * @param pimitiveIndex - The index of the primitive (only for details
   * in validation messages)
   * @param schema  - The metadata schema
   * @param metadataClassName - Te class name that was given in the
   * surrounding property attribute
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext`
   * @returns Whether the property is valid
   */
  private static async validatePropertyAttributePropertyValues(
    path: string,
    propertyName: string,
    propertyAttributeProperty: any,
    meshPrimitive: any,
    meshIndex: number,
    primitiveIndex: number,
    schema: Schema,
    metadataClassName: string,
    classProperty: ClassProperty,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    let result = true;

    const meshPrimitiveAttributes = defaultValue(meshPrimitive.attributes, {});
    const attribute = propertyAttributeProperty.attribute;
    const meshPrimitiveAttribute = meshPrimitiveAttributes[attribute];

    let accessorValues;
    if (classProperty.array === true) {
      accessorValues = Accessors.readArrayAccessorValues(
        meshPrimitiveAttribute,
        gltfData
      );
    } else {
      accessorValues = Accessors.readScalarAccessorValues(
        meshPrimitiveAttribute,
        gltfData
      );
    }
    if (accessorValues === undefined) {
      // When it is not possible to obtain the accessor data, then
      // this means that the gltfDocument has been undefined
      // because it could not be read. This can be caused by
      // - the glTF structure being invalid (but this should have
      //   been caught by the glTF validator)
      // - the extension object structure being invalid (in which
      //   case an issue should already have been added to the
      //   context, and this method should not have been called)
      // In both cases, reaching this point indicates an internal error:
      const message = `Could not read accessor data from glTF document`;
      const issue = ValidationIssues.INTERNAL_ERROR(path, message);
      context.addIssue(issue);
      return false;
    }
    const propertyAttributePropertyModel = new PropertyAttributePropertyModel(
      accessorValues,
      propertyAttributeProperty,
      classProperty
    );

    // Perform the checks that only apply to ENUM types,
    if (classProperty.type === "ENUM") {
      const enums = defaultValue(schema.enums, {});
      const metadataEnum = enums[classProperty.enumType!];
      const nameValues =
        MetadataUtilities.computeMetadataEnumValueNameValues(metadataEnum);
      const validEnumValueValues = Object.values(nameValues);
      if (
        !PropertyAttributeValuesValidator.validateEnumValues(
          path,
          propertyName,
          propertyAttributePropertyModel,
          validEnumValueValues,
          context
        )
      ) {
        result = false;
      }
    }

    const propertyAttributeContextDescription = `${attribute} of primitive ${primitiveIndex} of mesh ${meshIndex}`;

    // Perform the checks that only apply to numeric types
    if (ClassProperties.hasNumericType(classProperty)) {
      // When the ClassProperty defines a minimum, then the metadata
      // values MUST not be smaller than this minimum
      if (defined(classProperty.min)) {
        if (
          !PropertyAttributeValuesValidator.validateMin(
            path,
            propertyName,
            classProperty.min,
            "class property",
            propertyAttributePropertyModel,
            propertyAttributeProperty,
            classProperty,
            propertyAttributeContextDescription,
            context
          )
        ) {
          result = false;
        }
      }

      // When the PropertyAttributeProperty defines a minimum, then the metadata
      // values MUST not be smaller than this minimum
      if (defined(propertyAttributeProperty.min)) {
        const definedMin = propertyAttributeProperty.min;
        if (
          !PropertyAttributeValuesValidator.validateMin(
            path,
            propertyName,
            definedMin,
            "property attribute property",
            propertyAttributePropertyModel,
            propertyAttributeProperty,
            classProperty,
            propertyAttributeContextDescription,
            context
          )
        ) {
          result = false;
        } else {
          // When none of the values is smaller than the minimum from
          // the PropertyAttributeProperty, make sure that this minimum
          // matches the computed minimum of all metadata values
          const computedMin = PropertyAttributeValuesValidator.computeMin(
            propertyAttributePropertyModel
          );
          if (!ArrayValues.deepEquals(computedMin, definedMin)) {
            const message =
              `For property '${propertyName}', the property attribute property ` +
              `defines a minimum of ${definedMin}, but the computed ` +
              `minimum value for attribute ${propertyAttributeContextDescription} is ${computedMin}`;
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
          !PropertyAttributeValuesValidator.validateMax(
            path,
            propertyName,
            classProperty.max,
            "class property",
            propertyAttributePropertyModel,
            propertyAttributeProperty,
            classProperty,
            propertyAttributeContextDescription,
            context
          )
        ) {
          result = false;
        }
      }

      // When the PropertyAttributeProperty defines a maximum, then the metadata
      // values MUST not be greater than this maximum
      if (defined(propertyAttributeProperty.max)) {
        const definedMax = propertyAttributeProperty.max;
        if (
          !PropertyAttributeValuesValidator.validateMax(
            path,
            propertyName,
            definedMax,
            "property attribute property",
            propertyAttributePropertyModel,
            propertyAttributeProperty,
            classProperty,
            propertyAttributeContextDescription,
            context
          )
        ) {
          result = false;
        } else {
          // When none of the values is greater than the maximum from
          // the PropertyAttributeProperty, make sure that this maximum
          // matches the computed maximum of all metadata values
          const computedMax = PropertyAttributeValuesValidator.computeMax(
            propertyAttributePropertyModel
          );
          if (!ArrayValues.deepEquals(computedMax, definedMax)) {
            const message =
              `For property '${propertyName}', the property attribute property ` +
              `defines a maximum of ${definedMax}, but the computed ` +
              `maximum value for attribute ${propertyAttributeContextDescription} is ${computedMax}`;
            const issue = MetadataValidationIssues.METADATA_VALUE_MISMATCH(
              path,
              message
            );
            context.addIssue(issue);
            result = false;
          }
        }
      }
    }

    return result;
  }

  /**
   * Validate that the values of the specified ENUM property are valid.
   *
   * This applies to properties in the given binary property attribute
   * that have the ENUM type, both for arrays and non-arrays. It
   * will ensure that each value that appears as in the binary data
   * is a value that was actually defined as one of the
   * `enum.values[i].value` values in the schema definition.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param propertyId - The property ID
   * @param propertyAttributePropertyModel - The property attribute property model
   * @param validEnumValueValues - The valid enum value values
   * @param context - The `ValidationContext`
   * @returns Whether the enum values have been valid
   */
  private static validateEnumValues(
    path: string,
    propertyId: string,
    propertyAttributePropertyModel: PropertyAttributePropertyModel,
    validEnumValueValues: number[],
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate each property value
    const size = propertyAttributePropertyModel.getSize();
    for (let index = 0; index < size; index++) {
      // The validation takes place based on the RAW (numeric)
      // values from the property model (and not on the string
      // valuses from the metadata entity model)
      const rawPropertyValue =
        propertyAttributePropertyModel.getRawPropertyValue(index);

      // For arrays, simply validate each element individually
      if (Array.isArray(rawPropertyValue)) {
        for (let i = 0; i < rawPropertyValue.length; i++) {
          const rawPropertyValueElement = rawPropertyValue[i];
          const rawPropertyValueElementPath = `${path}/${i}`;
          if (
            !BasicValidator.validateEnum(
              rawPropertyValueElementPath,
              propertyId,
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
            propertyId,
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
   * Validate the that none of the values of the specified
   * property in the given property attribute data is smaller
   * than the given defined minimum.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param propertyName - The property name
   * @param definedMin - The defined minimum
   * @param definedMinInfo - A string indicating the source of the minimum
   * definition: 'class property' or 'property attribute property'.
   * @param propertyAttributePropertyModel - The property attribute property model
   * @param propertyAttributeProperty - The property attribute property
   * @param propertyAttributeContextDescription - TODO Comment
   * @param classProperty - The class property
   * @param context - The `ValidationContext`
   * @returns Whether the values obeyed the limit
   */
  private static validateMin(
    path: string,
    propertyName: string,
    definedMin: any,
    definedMinInfo: string,
    propertyAttributePropertyModel: PropertyAttributePropertyModel,
    propertyAttributeProperty: any,
    classProperty: ClassProperty,
    propertyAttributeContextDescription: string,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate each property value
    const size = propertyAttributePropertyModel.getSize();
    for (let index = 0; index < size; index++) {
      const propertyValue =
        propertyAttributePropertyModel.getPropertyValue(index);
      const rawPropertyValue =
        propertyAttributePropertyModel.getPropertyValue(index);

      if (ArrayValues.anyDeepLessThan(propertyValue, definedMin)) {
        const valueMessagePart =
          MetadataValuesValidationMessages.createValueMessagePart(
            rawPropertyValue,
            classProperty,
            propertyAttributeProperty,
            propertyValue
          );

        const message =
          `For property '${propertyName}', the ${definedMinInfo} ` +
          `defines a minimum of ${definedMin}, but the value in the property ` +
          `attribute ${propertyAttributeContextDescription} at index ${index} is ${valueMessagePart}`;
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
   * Compute the minimum value in the given property attribute property model
   *
   * @param propertyAttributePropertyModel - The property attribute property model
   * @returns The minimum
   */
  private static computeMin(
    propertyAttributePropertyModel: PropertyAttributePropertyModel
  ): any {
    const size = propertyAttributePropertyModel.getSize();
    let computedMin = undefined;
    for (let index = 0; index < size; index++) {
      const propertyValue =
        propertyAttributePropertyModel.getPropertyValue(index);
      if (index === 0) {
        computedMin = ArrayValues.deepClone(propertyValue);
      } else {
        computedMin = ArrayValues.deepMin(computedMin, propertyValue);
      }
    }
    return computedMin;
  }

  /**
   * Validate the that none of the values of the specified
   * property in the given property attribute data is greater
   * than the given defined maximum.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param propertyName - The property name
   * @param definedMax - The defined maximum
   * @param definedMaxInfo - A string indicating the source of the maximum
   * definition: 'class property' or 'property attribute property'.
   * @param propertyAttributePropertyModel - The property attribute property model
   * @param propertyAttributeProperty - The property attribute property
   * @param classProperty - The class property
   * @param propertyAttributeContextDescription - TODO Comment
   * @param context - The `ValidationContext`
   * @returns Whether the values obeyed the limit
   */
  private static validateMax(
    path: string,
    propertyName: string,
    definedMax: any,
    definedMaxInfo: string,
    propertyAttributePropertyModel: PropertyAttributePropertyModel,
    propertyAttributeProperty: any,
    classProperty: ClassProperty,
    propertyAttributeContextDescription: string,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate each property value
    const size = propertyAttributePropertyModel.getSize();
    for (let index = 0; index < size; index++) {
      const propertyValue =
        propertyAttributePropertyModel.getPropertyValue(index);
      const rawPropertyValue =
        propertyAttributePropertyModel.getPropertyValue(index);

      if (ArrayValues.anyDeepGreaterThan(propertyValue, definedMax)) {
        const valueMessagePart =
          MetadataValuesValidationMessages.createValueMessagePart(
            rawPropertyValue,
            classProperty,
            propertyAttributeProperty,
            propertyValue
          );

        const message =
          `For property '${propertyName}', the ${definedMaxInfo} ` +
          `defines a maximum of ${definedMax}, but the value in the property ` +
          `attribute ${propertyAttributeContextDescription} at index ${index} is ${valueMessagePart}`;
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
   * Compute the maximum value in the given property attribute property model
   *
   * @param propertyAttributePropertyModel - The property attribute property model
   * @returns The maximum
   */
  private static computeMax(
    propertyAttributePropertyModel: PropertyAttributePropertyModel
  ): any {
    const size = propertyAttributePropertyModel.getSize();
    let computedMax = undefined;
    for (let index = 0; index < size; index++) {
      const propertyValue =
        propertyAttributePropertyModel.getPropertyValue(index);
      if (index === 0) {
        computedMax = ArrayValues.deepClone(propertyValue);
      } else {
        computedMax = ArrayValues.deepMax(computedMax, propertyValue);
      }
    }
    return computedMax;
  }
}
