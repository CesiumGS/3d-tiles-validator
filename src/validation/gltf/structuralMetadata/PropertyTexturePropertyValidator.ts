import { defined } from "3d-tiles-tools";
import { MetadataComponentTypes } from "3d-tiles-tools";
import { MetadataTypes } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";
import { ClassProperty } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { BasicValidator } from "../../BasicValidator";

import { MetadataPropertyValidator } from "../../metadata/MetadataPropertyValidator";

import { GltfExtensionValidationIssues } from "../../../issues/GltfExtensionValidationIssues";

import { TextureValidator } from "../TextureValidator";
import { SamplerValidator } from "../SamplerValidator";

/**
 * A class for validations related to `propertyTexture.property` objects.
 *
 * @internal
 */
export class PropertyTexturePropertyValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `propertyTexture.property` object.
   *
   * This checks the basic validity of the property, namely
   * - it is an object
   * - its `index` refers to an existing texture in the glTF
   * - its `texCoord` is a nonnegative integer
   * - its `channels` (if defined) is an array of at least one nonnegative integers
   * - its type (defined via the `classProperty`) is suitable for a property texture
   * - the sampler of the texture is suitable for a property texture
   * - its `offset/scale/min/max` properties match the `classProperty` structure
   *
   * Checking the validity of the `texCoord` for a mesh primitive, and
   * checking the values (whether they are valid enum values, or whether
   * their min/max are valid) is done by the PropertyTextureValuesValidator.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyName - The name of the property
   * @param propertyTextureProperty - The object to validate
   * @param gltf - The containing glTF object
   * @param meshPrimitive - The mesh primitive that contains the extension
   * @param classProperty - The `ClassProperty` definition from the schema
   * @param enumValueType - The value type of the enum that is represented
   * with the given class property, or `undefined` if it is not an enum
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validatePropertyTextureProperty(
    path: string,
    propertyName: string,
    propertyTextureProperty: any,
    gltf: any,
    classProperty: ClassProperty,
    enumValueType: string | undefined,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        propertyName,
        propertyTextureProperty,
        context
      )
    ) {
      return false;
    }

    const textures = gltf.textures || [];
    const numTextures = textures.length;

    // Validate the index
    // The index MUST be defined
    // The index MUST be an integer in [0, numTextures)
    const index = propertyTextureProperty.index;
    const indexPath = path + "/index";
    if (
      !BasicValidator.validateIntegerRange(
        indexPath,
        "index",
        index,
        0,
        true,
        numTextures,
        false,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the texCoord
    const texCoord = propertyTextureProperty.texCoord;
    const texCoordPath = path + "/texCoord";
    if (defined(texCoord)) {
      if (
        !TextureValidator.validateTexCoordDefinition(
          texCoordPath,
          texCoord,
          context
        )
      ) {
        result = false;
      }
    }

    // Make sure that the type of the class property is valid for
    // a property texture in general.
    const typeIsValid =
      PropertyTexturePropertyValidator.validateClassPropertyForPropertyTextureProperty(
        path,
        propertyName,
        classProperty,
        context
      );
    if (!typeIsValid) {
      result = false;
    }

    // Validate the channels.
    // This will only check the basic validity, namely that the channels
    // (if they are defined) are an array of nonnegative integers. Whether
    // the channels match the image structure is validated later
    const channels = propertyTextureProperty.channels;
    if (!TextureValidator.validateChannels(path, channels, context)) {
      result = false;
    } else {
      // If the type and channels are basically valid, ensure that the
      // length of the channels array matches the number of bytes of
      // the type that is defined with the `classProperty`.
      if (typeIsValid) {
        // The channels are defaulting to `[ 0 ]`
        const numChannels = defaultValue(channels?.length, 1);
        if (
          !PropertyTexturePropertyValidator.validatePropertyTexturePropertyTypeSize(
            path,
            propertyName,
            numChannels,
            classProperty,
            enumValueType,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Make sure that the sampler of the texture (if present) uses the
    // allowed values (namely, 'undefined' or 9728 (NEAREST) or
    // 9729 (LINEAR)) for its minFilter and magFilter.
    // (Note: The validity of the `texture.sampler` index has
    // already been checked by the glTF Validator)
    const texture = textures[index];
    const samplerIndex = texture.sampler;
    if (samplerIndex !== undefined) {
      const samplers = gltf.samplers || [];
      const sampler = samplers[samplerIndex];
      if (
        !SamplerValidator.validateSamplerNearestOrLinear(path, sampler, context)
      ) {
        result = false;
      }
    }

    // Validate the offset/scale/max/min properties
    const elementsAreValid =
      MetadataPropertyValidator.validateOffsetScaleMaxMin(
        path,
        propertyTextureProperty,
        propertyName,
        classProperty,
        context
      );
    if (!elementsAreValid) {
      result = false;
    }

    return result;
  }

  /**
   * Validates that the given number of channels matches the
   * number of bytes of the type of the given `classProperty`.
   *
   * The given number is the length of the `channels` array of
   * a property texture property (if it is defined). If the
   * `channels` array is not defined, then this value should be
   * `1`, because the default value for the `channels` is `[0]`.
   *
   * This assumes that the given `classProperty` does not have
   * the type `STRING`, and has already been determined to be
   * structurally valid.
   *
   * If the number is not valid, then a validation warning will be
   * added to the given context.
   *
   * This makes the assumption that one channel of the image
   * indeed consists of 8 bits. Since there is no reasonable
   * way validate the bit depth of the image, any mismatch
   * will only result in a WARNING (and not an error).
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyName - The name of the property
   * @param numberOfChannels - The number of channels
   * @param classProperty - The `ClassProperty` definition from the schema
   * @param enumValueType - The value type of the enum that is represented
   * with the given class property, or `undefined` if it is not an enum
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the number was valid
   */
  static validatePropertyTexturePropertyTypeSize(
    path: string,
    propertyName: string,
    numberOfChannels: number,
    classProperty: ClassProperty,
    enumValueType: string | undefined,
    context: ValidationContext
  ): boolean {
    // When the type is an enum, compute the required size
    // based on the enum value type
    const enumType = classProperty.enumType;
    if (defined(enumType)) {
      // It is assumed that the schema and classProperty are valid,
      // so that a valid enum value type was given here:
      const byteSize = MetadataComponentTypes.byteSizeForComponentType(
        enumValueType!
      );

      if (classProperty.array === true) {
        // Handle properties that are enum arrays
        const totalByteSize = classProperty.count! * byteSize;
        if (totalByteSize !== numberOfChannels) {
          const message =
            `The property '${propertyName}' has the enum type ` +
            `${enumType} with a value type of ${enumValueType} which ` +
            `consists of ${byteSize} bytes, and the property is an ` +
            `array with ${classProperty.count} elements, resulting in ` +
            `a total number of ${totalByteSize}, but the number of channels ` +
            `in the property texture property was ${numberOfChannels}`;
          const issue =
            GltfExtensionValidationIssues.TEXTURE_CHANNELS_SIZE_MISMATCH(
              path,
              message
            );
          context.addIssue(issue);
        }
      } else {
        // Handle properties that are single enums
        if (byteSize !== numberOfChannels) {
          const message =
            `The property '${propertyName}' has the enum type ` +
            `${enumType} with a value type of ${enumValueType}, which ` +
            `consists of ${byteSize} bytes, but the number of channels ` +
            `in the property texture property was ${numberOfChannels}`;
          const issue =
            GltfExtensionValidationIssues.TEXTURE_CHANNELS_SIZE_MISMATCH(
              path,
              message
            );
          context.addIssue(issue);
        }
      }

      return true;
    }

    // When the type is ENUM, compute the size based on the
    // number of required bits
    const type = classProperty.type;
    if (type === "BOOLEAN") {
      if (classProperty.array === true) {
        // Handle BOOLEAN properties that are arrays
        const count = classProperty.count!;
        const totalByteSize = Math.ceil(count / 8);
        if (totalByteSize !== numberOfChannels) {
          const message =
            `The property '${propertyName}' is has the type 'BOOLEAN' and it ` +
            `is an array with ${count} elements, resulting in a total number of ` +
            `ceil(${count}/8) = ${totalByteSize} bytes, but the number of channels ` +
            `in the property texture property was ${numberOfChannels}`;
          const issue =
            GltfExtensionValidationIssues.TEXTURE_CHANNELS_SIZE_MISMATCH(
              path,
              message
            );
          context.addIssue(issue);
        }
      }
      // For BOOLEAN properties that are not arrays, even a single
      // channel is sufficient
      return true;
    }

    // For non-ENUM and non-BOOLEAN types, compute the required size
    // based on the number of bytes per component, and the number
    // of components per element
    const componentType = classProperty.componentType;
    const componentCount = MetadataTypes.componentCountForType(type);
    const componentByteSize = MetadataComponentTypes.byteSizeForComponentType(
      componentType!
    );
    const elementByteSize = componentCount * componentByteSize;

    if (classProperty.array === true) {
      // Handle properties that are arrays
      const totalByteSize = classProperty.count! * elementByteSize;
      if (totalByteSize !== numberOfChannels) {
        const message =
          `The property '${propertyName}' has the component type ` +
          `${componentType}, with a size of ${componentByteSize} bytes, ` +
          `and the type ${type} with ${componentCount} components, ` +
          `resulting in ${elementByteSize} bytes per element, and it ` +
          `is an array with ${classProperty.count} elements, resulting in ` +
          `a total number of ${totalByteSize}, but the number of channels ` +
          `in the property texture property was ${numberOfChannels}`;
        const issue =
          GltfExtensionValidationIssues.TEXTURE_CHANNELS_SIZE_MISMATCH(
            path,
            message
          );
        context.addIssue(issue);
      }
    } else {
      // Handle properties that are not arrays
      if (elementByteSize !== numberOfChannels) {
        const message =
          `The property '${propertyName}' has the component type ` +
          `${componentType}, with a size of ${componentByteSize} bytes, ` +
          `and the type ${type} with ${componentCount} components, ` +
          `resulting in ${elementByteSize} bytes per element, but ` +
          `the number of channels in the property texture property ` +
          `was ${numberOfChannels}`;
        const issue =
          GltfExtensionValidationIssues.TEXTURE_CHANNELS_SIZE_MISMATCH(
            path,
            message
          );
        context.addIssue(issue);
      }
    }
    return true;
  }

  /**
   * Validates that the given `classProperty` is basically suitable
   * for a property texture (meaning that it is not a variable-length
   * array and not of type STRING).
   *
   * If the type is not valid, then a validation error will be added
   * to the given context, and `false` will be returned.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyName - The name of the property
   * @param classProperty - The `ClassProperty` definition from the schema
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateClassPropertyForPropertyTextureProperty(
    path: string,
    propertyName: string,
    classProperty: ClassProperty,
    context: ValidationContext
  ): boolean {
    // From the specification text for property textures:
    // Variable-length arrays are not supported in property textures
    const isVariableLengthArray =
      classProperty.array && !defined(classProperty.count);
    if (isVariableLengthArray) {
      const message =
        `The property '${propertyName}' is a variable-length array, ` +
        `which is not supported for property textures`;
      const issue =
        GltfExtensionValidationIssues.INVALID_METADATA_PROPERTY_TYPE(
          path,
          message
        );
      context.addIssue(issue);
      return false;
    }

    // From the specification text for property textures:
    // Strings are not supported in property textures
    const isString = classProperty.type === "STRING";
    if (isString) {
      const message =
        `The property '${propertyName}' has the type 'STRING', ` +
        `which is not supported for property textures`;
      const issue =
        GltfExtensionValidationIssues.INVALID_METADATA_PROPERTY_TYPE(
          path,
          message
        );
      context.addIssue(issue);
      return false;
    }

    return true;
  }
}
