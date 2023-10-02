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
 * in property textures.
 *
 * The methods in this class assume that the structural
 * validity of the input objects has already been checked
 * by a `PropertyTextureValidator`.
 *
 * @internal
 *
 * TODO There is a lot of "structural" overlap between this and
 * the BinaryPropertyTableValuesValidator: They both check the
 * enum values, min/max, and the main difference is that the
 * values are once fetched from a "BinaryPropertyTable", and
 * once from a "PropertyTexturePropertyModel". Wheter or not
 * it is worthwhile to try and extract the common parts
 * (considering that they are once accessed with indices, and
 * once with pixel coordinates) has to be decided.
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
   * that refers to the property texture.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyTextureIndex - The index that was given in the
   * `propertyTextures` array of the mesh primitive extension
   * object, and that refers to the property textures array in
   * the top-level glTF structural metadata object.
   * @param meshPrimitive - The glTF mesh primitive that contained
   * the extension object
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

    // Make sure that the `texCoord` values of the properties
    // refer to valid attributes of the mesh primitive
    const propertyTexturePropertyNames = Object.keys(propertyTextureProperties);
    for (const propertyName of propertyTexturePropertyNames) {
      const propertyTextureProperty = propertyTextureProperties[propertyName];
      const propertyTexturePropertyPath = path + "/properties/" + propertyName;
      const texCoord = propertyTextureProperty.texCoord;

      const texCoordAttributeName = `TEXCOORD_${texCoord}`;
      const meshPrimitiveAttributes = defaultValue(
        meshPrimitive.attributes,
        {}
      );
      const texCoordAttribute = meshPrimitiveAttributes[texCoordAttributeName];
      if (!defined(texCoordAttribute)) {
        const message =
          `The property texture property defines the texCoord ${texCoord}, ` +
          `but the attribute ${texCoordAttributeName} was not ` +
          `found in the mesh primitive attributes`;
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
   * Validate the values of a single property of property texture
   *
   * @param path - The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
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
    const classes = schema.classes || {};
    const metadataClass = classes[metadataClassName];
    const classProperties = metadataClass.properties || {};
    const classProperty = classProperties[propertyName];
    const enumValueType = MetadataUtilities.computeEnumValueType(
      schema,
      classProperty
    );
    let enumValueValueNames = {};
    let enumValueNameValues: { [key: string]: number } = {};
    const enumType = classProperty.enumType;
    if (enumType !== undefined) {
      const enums = schema.enums || {};
      const metadataEnum = enums[enumType];
      enumValueValueNames =
        MetadataUtilities.computeMetadataEnumValueValueNames(metadataEnum);
      enumValueNameValues =
        MetadataUtilities.computeMetadataEnumValueNameValues(metadataEnum);
    }

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

    const propertyTexturePropertyModel = new PropertyTexturePropertyModel(
      imageData,
      propertyTextureProperty,
      classProperty,
      enumValueType,
      enumValueValueNames
    );

    // Perform the checks that only apply to ENUM types,
    if (classProperty.type === "ENUM") {
      // Obtain the validEnumValueValues, which are all values that
      // appear as `enum.values[i].value` in the schema.
      const validEnumValueValues = Object.values(enumValueNameValues);
      if (
        !PropertyTextureValuesValidator.validateEnumValues(
          path,
          propertyName,
          propertyTexturePropertyModel,
          classProperty,
          validEnumValueValues,
          schema,
          context
        )
      ) {
        result = false;
      }
    }

    // Perform the checks that only apply to numeric types
    if (ClassProperties.hasNumericType(classProperty)) {
      // When the ClassProperty defines a minimum, then the metadata
      // values MUST not be smaller than this minimum
      if (defined(classProperty.min)) {
        if (
          !PropertyTextureValuesValidator.validateMin(
            path,
            propertyName,
            classProperty.min,
            "class property",
            propertyTexturePropertyModel,
            propertyTextureProperty,
            classProperty,
            context
          )
        ) {
          result = false;
        }
      }
      // When the PropertyTextureProperty defines a minimum, then the metadata
      // values MUST not be smaller than this minimum
      if (defined(propertyTextureProperty.min)) {
        const definedMin = propertyTextureProperty.min;
        if (
          !PropertyTextureValuesValidator.validateMin(
            path,
            propertyName,
            definedMin,
            "property texture property",
            propertyTexturePropertyModel,
            propertyTextureProperty,
            classProperty,
            context
          )
        ) {
          result = false;
        } else {
          // When none of the values is smaller than the minimum from
          // the PropertyTextureProperty, make sure that this minimum
          // matches the computed minimum of all metadata values
          const computedMin = PropertyTextureValuesValidator.computeMin(
            propertyTexturePropertyModel
          );
          if (!ArrayValues.deepEquals(computedMin, definedMin)) {
            const message =
              `For property ${propertyName}, the property texture property ` +
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
          !PropertyTextureValuesValidator.validateMax(
            path,
            propertyName,
            classProperty.max,
            "class property",
            propertyTexturePropertyModel,
            propertyTextureProperty,
            classProperty,
            context
          )
        ) {
          result = false;
        }
      }
      // When the PropertyTextureProperty defines a maximum, then the metadata
      // values MUST not be graeter than this maximum
      if (defined(propertyTextureProperty.max)) {
        const definedMax = propertyTextureProperty.max;
        if (
          !PropertyTextureValuesValidator.validateMax(
            path,
            propertyName,
            definedMax,
            "property texture property",
            propertyTexturePropertyModel,
            propertyTextureProperty,
            classProperty,
            context
          )
        ) {
          result = false;
        } else {
          // When none of the values is greater than the maximum from
          // the PropertyTextureProperty, make sure that this maximum
          // matches the computed maximum of all metadata values
          const computedMax = PropertyTextureValuesValidator.computeMax(
            propertyTexturePropertyModel
          );
          if (!ArrayValues.deepEquals(computedMax, definedMax)) {
            const message =
              `For property ${propertyName}, the property texture property ` +
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
    }
    return result;
  }

  /**
   * Validate that the values of the specified ENUM property are valid.
   *
   * This applies to properties that are given in a property texture and
   * that have the ENUM type.
   *
   * , both for arrays and non-arrays. It
   * will ensure that each value that appears as in the binary data
   * is a value that was actually defined as one of the
   * `enum.values[i].value` values in the schema definition.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param propertyName - The property name
   * @param propertyTexturePropertyModel - The `PropertyTexturePropertyModel`
   * @param context - The `ValidationContext`
   * @returns Whether the enum values have been valid
   */
  private static validateEnumValues(
    path: string,
    propertyName: string,
    propertyTexturePropertyModel: PropertyTexturePropertyModel,
    classProperty: ClassProperty,
    validEnumValueValues: number[],
    schema: Schema,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate each property value
    const sizeX = propertyTexturePropertyModel.getSizeX();
    const sizeY = propertyTexturePropertyModel.getSizeY();
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        // The validation happens based on the RAW property
        // values for enums, i.e. the `enum.value[i].value`
        // values (which are not translated into strings)
        const rawPropertyValue =
          propertyTexturePropertyModel.getRawPropertyValue(x, y);

        // XXX DEBUG LOG:
        {
          const propertyValue = propertyTexturePropertyModel.getPropertyValue(
            x,
            y
          );
          console.log(
            "At " +
              x +
              " " +
              y +
              " value is " +
              propertyValue +
              " raw is " +
              rawPropertyValue
          );
        }

        // For arrays, simply validate each element individually
        if (Array.isArray(rawPropertyValue)) {
          for (let i = 0; i < rawPropertyValue.length; i++) {
            const rawPropertyValueElement = rawPropertyValue[i];
            if (
              !BasicValidator.validateEnum(
                path,
                propertyName + `[${x},${y}][${i}]`,
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
              propertyName + `[${x},${y}]`,
              rawPropertyValue,
              validEnumValueValues,
              context
            )
          ) {
            result = false;
          }
        }
      }
    }
    return result;
  }

  /**
   * Validate the that none of the values of the specified
   * property in the given property texture is smaller than
   * the given defined minimum.
   *
   * @param path - The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
   * @param propertyName - The property name
   * @param definedMin - The defined minimum
   * @param definedMinInfo - A string indicating the source of the minimum
   * definition: 'class property' or 'property texture property'.
   * @param propertyTexturePropertyModel - The property texture
   * property model
   * @param context - The `ValidationContext`
   * @returns Whether the values obeyed the limit
   */
  private static validateMin(
    path: string,
    propertyName: string,
    definedMin: any,
    definedMinInfo: string,
    propertyTexturePropertyModel: PropertyTexturePropertyModel,
    propertyTextureProperty: any,
    classProperty: ClassProperty,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate each property value
    const sizeX = propertyTexturePropertyModel.getSizeX();
    const sizeY = propertyTexturePropertyModel.getSizeY();
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        const propertyValue = propertyTexturePropertyModel.getPropertyValue(
          x,
          y
        );
        const rawPropertyValue =
          propertyTexturePropertyModel.getRawPropertyValue(x, y);

        console.log(
          "At " +
            x +
            " " +
            y +
            " for " +
            propertyName +
            " is " +
            propertyValue +
            " from raw " +
            rawPropertyValue
        );

        if (ArrayValues.anyDeepLessThan(propertyValue, definedMin)) {
          const valueMessagePart =
            MetadataValuesValidationMessages.createValueMessagePart(
              rawPropertyValue,
              classProperty.normalized,
              propertyTextureProperty.scale,
              propertyTextureProperty.offset,
              propertyValue
            );

          const message =
            `For property '${propertyName}', the the ${definedMinInfo} ` +
            `defines a minimum of ${definedMin}, but the value in the property ` +
            `texture at (${x},${y}) is ${valueMessagePart}`;
          const issue = MetadataValidationIssues.METADATA_VALUE_NOT_IN_RANGE(
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
   * Compute the mimimum value that appears in the given property
   * taxture property.
   *
   * This assumes that the property has a numeric type,
   * as indicated by `ClassProperties.hasNumericType`.
   *
   * @param propertyTexturePropertyModel - The property texture
   * property model
   * @returns The minimum
   */
  private static computeMin(
    propertyTexturePropertyModel: PropertyTexturePropertyModel
  ): any {
    let computedMin = undefined;
    const sizeX = propertyTexturePropertyModel.getSizeX();
    const sizeY = propertyTexturePropertyModel.getSizeY();
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        const propertyValue = propertyTexturePropertyModel.getPropertyValue(
          x,
          y
        );
        if (!defined(computedMin)) {
          computedMin = ArrayValues.deepClone(propertyValue);
        } else {
          computedMin = ArrayValues.deepMin(computedMin, propertyValue);
        }
      }
    }
    return computedMin;
  }

  /**
   * Validate the that none of the values of the specified
   * property in the given property texture is greater than
   * the given defined maximum.
   *
   * @param path - The path of the `PropertyTablePropery`, for
   * `ValidationIssue` instances
   * @param propertyName - The property name
   * @param definedMax - The defined maximum
   * @param definedMaxInfo - A string indicating the source of the maximum
   * definition: 'class property' or 'property texture property'.
   * @param propertyTexturePropertyModel - The property texture
   * property model
   * @param context - The `ValidationContext`
   * @returns Whether the values obeyed the limit
   */
  private static validateMax(
    path: string,
    propertyName: string,
    definedMax: any,
    definedMaxInfo: string,
    propertyTexturePropertyModel: PropertyTexturePropertyModel,
    propertyTextureProperty: any,
    classProperty: ClassProperty,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate each property value
    const sizeX = propertyTexturePropertyModel.getSizeX();
    const sizeY = propertyTexturePropertyModel.getSizeY();
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        const propertyValue = propertyTexturePropertyModel.getPropertyValue(
          x,
          y
        );
        const rawPropertyValue =
          propertyTexturePropertyModel.getRawPropertyValue(x, y);

        console.log(
          "At " +
            x +
            " " +
            y +
            " for " +
            propertyName +
            " is " +
            propertyValue +
            " from raw " +
            rawPropertyValue
        );

        if (ArrayValues.anyDeepGreaterThan(propertyValue, definedMax)) {
          const valueMessagePart =
            MetadataValuesValidationMessages.createValueMessagePart(
              rawPropertyValue,
              classProperty.normalized,
              propertyTextureProperty.scale,
              propertyTextureProperty.offset,
              propertyValue
            );

          const message =
            `For property '${propertyName}', the the ${definedMaxInfo} ` +
            `defines a maximum of ${definedMax}, but the value in the property ` +
            `texture at (${x},${y}) is ${valueMessagePart}`;
          const issue = MetadataValidationIssues.METADATA_VALUE_NOT_IN_RANGE(
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
   * Compute the mimimum value that appears in the given property
   * taxture property.
   *
   * This assumes that the property has a numeric type,
   * as indicated by `ClassProperties.hasNumericType`.
   *
   * @param propertyTexturePropertyModel - The property texture
   * property model
   * @returns The maximum
   */
  private static computeMax(
    propertyTexturePropertyModel: PropertyTexturePropertyModel
  ): any {
    let computedMax = undefined;
    const sizeX = propertyTexturePropertyModel.getSizeX();
    const sizeY = propertyTexturePropertyModel.getSizeY();
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        const propertyValue = propertyTexturePropertyModel.getPropertyValue(
          x,
          y
        );
        if (!defined(computedMax)) {
          computedMax = ArrayValues.deepClone(propertyValue);
        } else {
          computedMax = ArrayValues.deepMax(computedMax, propertyValue);
        }
      }
    }
    return computedMax;
  }
}
