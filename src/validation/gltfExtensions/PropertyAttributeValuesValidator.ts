import { defined } from "3d-tiles-tools";
import { ArrayValues } from "3d-tiles-tools";
import { ClassProperties } from "3d-tiles-tools";
import { ClassProperty } from "3d-tiles-tools";
import { MetadataUtilities } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";

import { GltfData } from "./GltfData";
import { ImageDataReader } from "./ImageDataReader";
import { TextureValidator } from "./TextureValidator";
import { PropertyTexturePropertyModel } from "./PropertyTexturePropertyModel";

import { MetadataValuesValidationMessages } from "../metadata/MetadataValueValidationMessages";

import { StructureValidationIssues } from "../../issues/StructureValidationIssues";
import { MetadataValidationIssues } from "../../issues/MetadataValidationIssues";

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
    if (result) {
      for (const propertyName of propertyAttributePropertyNames) {
        const propertyAttributeProperty =
          propertyAttributeProperties[propertyName];
        const propertyAttributePropertyPath =
          path + "/properties/" + propertyName;
        const metadataClassName = propertyAttribute.class;
        const propertyValuesValid =
          await PropertyAttributeValuesValidator.validatePropertyAttributePropertyValues(
            propertyAttributePropertyPath,
            propertyName,
            propertyAttributeProperty,
            schema,
            metadataClassName,
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
   * Validate the values of a single property of a property attribute
   *
   * @param path - The path for `ValidationIssue` instances
   * @param propertyName - The property name
   * @param propertyAttributeProperty - The property attribute property
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
    schema: Schema,
    metadataClassName: string,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    let result = true;
    // TODO
    return result;
  }
}
