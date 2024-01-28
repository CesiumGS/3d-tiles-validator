import { defined } from "@3d-tiles-tools/base";
import { defaultValue } from "@3d-tiles-tools/base";
import { ClassProperties } from "@3d-tiles-tools/metadata";
import { Schema } from "@3d-tiles-tools/structure";

import { ValidationContext } from "../ValidationContext";

import { GltfData } from "./GltfData";
import { ImageDataReader } from "./ImageDataReader";
import { TextureValidator } from "./TextureValidator";
import { PropertyTextureMetadataPropertyModels } from "./PropertyTextureMetadataPropertyModels";

import { StructureValidationIssues } from "../../issues/StructureValidationIssues";

import { RangeIterables } from "../metadata/RangeIterables";
import { MetadataPropertyValuesValidator } from "../metadata/MetadataPropertyValuesValidator";
import { MetadataValidationUtilities } from "../metadata/MetadataValidationUtilities";

/**
 * A class for the validation of values that are stored
 * in property textures.
 *
 * The methods in this class assume that the structural
 * validity of the input objects has already been checked
 * by a `PropertyTextureValidator`.
 *
 * @internal
 */
export class PropertyTextureValuesValidator {
  /**
   * Performs the validation to ensure that the specified property
   * texture contains valid values.
   *
   * This is supposed to be called after the validity of the top-level
   * extension object, the schema, and the property texture itself have
   * been checked (the latter with
   * `PropertyTexturePropertyValidator.validatePropertyTextureProperty`).
   *
   * It assumes that they are structurally valid, and ONLY checks the
   * validity of the values in the context of the mesh primitive
   * that refers to the property texture, and the glTF texture
   * that the property texture refers to.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyTextureIndex - The index that was given in the
   * `propertyTextures` array of the mesh primitive extension
   * object, and that refers to the property textures array in
   * the top-level glTF structural metadata object.
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
  static async validatePropertyTextureValues(
    path: string,
    propertyTextureIndex: number,
    meshPrimitive: any,
    meshIndex: number,
    primitiveIndex: number,
    schema: Schema,
    gltfStructuralMetadata: any,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    let result = true;

    // The presence of the 'propertyTextures', the validity of
    // the 'propertyTextureIndex', and the STRUCTURAL validity
    // of the property texture have already been checked
    const propertyTextures = defaultValue(
      gltfStructuralMetadata.propertyTextures,
      []
    );
    const propertyTexture = propertyTextures[propertyTextureIndex];
    const propertyTextureProperties = defaultValue(
      propertyTexture.properties,
      {}
    );

    const meshPrimitiveAttributes = defaultValue(meshPrimitive.attributes, {});

    // Make sure that the `texCoord` values of the properties
    // refer to valid attributes of the mesh primitive
    const propertyTexturePropertyNames = Object.keys(propertyTextureProperties);
    for (const propertyName of propertyTexturePropertyNames) {
      const propertyTextureProperty = propertyTextureProperties[propertyName];
      const propertyTexturePropertyPath = path + "/properties/" + propertyName;
      const texCoord = propertyTextureProperty.texCoord;

      const texCoordAttributeName = `TEXCOORD_${texCoord}`;
      const texCoordAttribute = meshPrimitiveAttributes[texCoordAttributeName];
      if (!defined(texCoordAttribute)) {
        const message =
          `The property texture property defines the texCoord ${texCoord}, ` +
          `but the attribute ${texCoordAttributeName} was not ` +
          `found in the attributes of primitive ${primitiveIndex} ` +
          `of mesh ${meshIndex}`;
        const issue = StructureValidationIssues.IDENTIFIER_NOT_FOUND(
          propertyTexturePropertyPath,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // If everything appeared to be valid until now, validate
    // the values of the property texture properties in view
    // of the glTF texture that they refer to
    if (result) {
      for (const propertyName of propertyTexturePropertyNames) {
        const propertyTextureProperty = propertyTextureProperties[propertyName];
        const propertyTexturePropertyPath =
          path + "/properties/" + propertyName;
        const metadataClassName = propertyTexture.class;
        const propertyValuesValid =
          await PropertyTextureValuesValidator.validatePropertyTexturePropertyValues(
            propertyTexturePropertyPath,
            propertyName,
            propertyTextureProperty,
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
   * Validate the values of a single property of a property texture
   *
   * @param path - The path for `ValidationIssue` instances
   * @param propertyName - The property name
   * @param propertyTextureProperty - The property texture property
   * @param schema  - The metadata schema
   * @param metadataClassName - Te class name that was given in the
   * surrounding property texture
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext`
   * @returns Whether the property is valid
   */
  private static async validatePropertyTexturePropertyValues(
    path: string,
    propertyName: string,
    propertyTextureProperty: any,
    schema: Schema,
    metadataClassName: string,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    let result = true;

    // The glTF structure is already assumed to be valid here
    const gltf = gltfData.gltf;
    const textureIndex = propertyTextureProperty.index;
    const textures = gltf.textures || [];
    const texture = textures[textureIndex];
    const images = gltf.images || [];
    const imageIndex = texture.source;
    const image = images[imageIndex];

    // The schema structure is already assumed to be valid here
    const classProperty = MetadataValidationUtilities.computeClassProperty(
      schema,
      metadataClassName,
      propertyName
    )!;

    // TODO: This will called multiple times, once for each property.
    // This will cause the image to be read multiple times. The image
    // should somehow be cached and associated with the glTF `image`.

    // Try to read the image data from the glTF image.
    // If this fails, then the appropriate issues will
    // be added to the given context, and `undefined`
    // will be returned.
    const imageData = await ImageDataReader.readFromImage(
      path,
      image,
      gltfData.binaryBufferData,
      context
    );
    if (!defined(imageData)) {
      return false;
    }

    // Make sure that the `channels` contains only elements that
    // are smaller than the number of channels in the image
    const channelsInImage = imageData.channels;
    const channels = defaultValue(propertyTextureProperty.channels, [0]);
    const channelsValid = TextureValidator.validateChannelsForImage(
      path,
      "property texture property",
      channels,
      channelsInImage,
      context
    );
    if (!channelsValid) {
      return false;
    }

    const keys = RangeIterables.range2D(imageData.sizeX, imageData.sizeY);

    // Perform the checks that only apply to ENUM types,
    if (classProperty.type === "ENUM") {
      const enumValueType = MetadataValidationUtilities.computeEnumValueType(
        schema,
        metadataClassName,
        propertyName
      )!;
      const enumValueValueNames =
        MetadataValidationUtilities.computeEnumValueValueNames(
          schema,
          metadataClassName,
          propertyName
        )!;
      const validEnumValueValues =
        MetadataValidationUtilities.computeValidEnumValueValues(
          schema,
          metadataClassName,
          propertyName
        )!;

      const metadataPropertyModel =
        PropertyTextureMetadataPropertyModels.createEnum(
          imageData,
          propertyTextureProperty,
          classProperty,
          enumValueType,
          enumValueValueNames
        );
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

    // Perform the checks that only apply to numeric types
    if (ClassProperties.hasNumericType(classProperty)) {
      const metadataPropertyModel =
        PropertyTextureMetadataPropertyModels.createNumeric(
          imageData,
          propertyTextureProperty,
          classProperty
        );
      if (
        !MetadataPropertyValuesValidator.validateMinMax(
          path,
          propertyName,
          keys,
          metadataPropertyModel,
          propertyTextureProperty,
          "property texture",
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
