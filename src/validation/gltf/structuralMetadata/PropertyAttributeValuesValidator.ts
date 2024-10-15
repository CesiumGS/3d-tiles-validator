import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";
import { ClassProperties } from "3d-tiles-tools";
import { ClassProperty } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";

import { GltfData } from "../GltfData";
import { Accessors } from "../Accessors";
import { PropertyAttributePropertyModel } from "./PropertyAttributePropertyModel";

import { StructureValidationIssues } from "../../../issues/StructureValidationIssues";
import { ValidationIssues } from "../../../issues/ValidationIssues";

import { MetadataValidationUtilities } from "../../metadata/MetadataValidationUtilities";
import { MetadataPropertyValuesValidator } from "../../metadata/MetadataPropertyValuesValidator";
import { RangeIterables } from "../../metadata/RangeIterables";

/**
 * A class for the validation of values that are stored
 * in property attributes.
 *
 * The methods in this class assume that the structural
 * validity of the input objects has already been checked
 * by a `PropertyAttributeValidator`.
 *
 * @internal
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

        // Assuming structural validity for the classProperty
        const classProperty = MetadataValidationUtilities.computeClassProperty(
          schema,
          metadataClassName,
          propertyName
        )!;
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

    const keys = RangeIterables.range1D(accessorValues.length);
    const metadataPropertyModel = new PropertyAttributePropertyModel(
      accessorValues,
      propertyAttributeProperty,
      classProperty
    );

    // Perform the checks that only apply to ENUM types,
    if (classProperty.type === "ENUM") {
      // Assuming structural validity for the validEnumValueValues
      const validEnumValueValues =
        MetadataValidationUtilities.computeValidEnumValueValues(
          schema,
          metadataClassName,
          propertyName
        )!;
      if (
        !MetadataPropertyValuesValidator.validateEnumValues(
          path,
          propertyName,
          keys,
          metadataPropertyModel,
          validEnumValueValues,
          context
        )
      ) {
        result = false;
      }
    }

    const propertyAttributeContextDescription = `attribute ${attribute} of primitive ${primitiveIndex} of mesh ${meshIndex}`;

    // Perform the checks that only apply to numeric types
    if (ClassProperties.hasNumericType(classProperty)) {
      if (
        !MetadataPropertyValuesValidator.validateMinMax(
          path,
          propertyName,
          keys,
          metadataPropertyModel,
          propertyAttributeProperty,
          propertyAttributeContextDescription,
          classProperty,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }
}
