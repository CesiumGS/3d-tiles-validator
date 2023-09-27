import { defined } from "3d-tiles-tools";
import { ClassProperty } from "3d-tiles-tools";

import { ValidationContext } from "./../ValidationContext";
import { BasicValidator } from "./../BasicValidator";

import { MetadataPropertyValidator } from "../metadata/MetadataPropertyValidator";

import { GltfExtensionValidationIssues } from "../../issues/GltfExtensionValidationIssues";
import { TextureValidator } from "./TextureValidator";
import { SamplerValidator } from "./SamplerValidator";

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
   * @param path - The path for the `ValidationIssue` instances
   * @param propertyName - The name of the property
   * @param propertyTextureProperty - The object to validate
   * @param gltf - The containing glTF object
   * @param meshPrimitive - The mesh primitive that contains the extension
   * @param classProperty - The `ClassProperty` definition from the schema
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validatePropertyTextureProperty(
    path: string,
    propertyName: string,
    propertyTextureProperty: any,
    gltf: any,
    classProperty: ClassProperty,
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

      // Bail out early for invalid property types
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

      // Bail out early for invalid property types
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

    // Validate the channels.
    // This will only check the basic validity, namely that the channels
    // (if they are defined) are an array of nonnegative integers. Whether
    // the channels match the image structure is validated later
    const channels = propertyTextureProperty.channels;
    if (!TextureValidator.validateChannels(path, channels, context)) {
      result = false;
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
}
