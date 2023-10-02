import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { StructureValidationIssues } from "../../issues/StructureValidationIssues";
import { GltfExtensionValidationIssues } from "../../issues/GltfExtensionValidationIssues";

/**
 * A class for validating feature ID or property textures in the
 * glTF metadata extensions.
 *
 * @internal
 */
export class TextureValidator {
  /**
   * Validate the `texCoord` definition of a texture.
   *
   * Without further context, this can only check whether the `texCoord`
   * property is a nonnegative integer.
   *
   * It can NOT check whether the `texCoord` results in a
   * `TEXCOORD_${texCoord}` attribute that actually appears in a
   * mesh primitive. For this, `validateTexCoordForMeshPrimitive`
   * can be used.
   *
   * If the given value is not valid, then a validation error will
   * be added to the given context, and `false` will be returned.
   *
   * @param path - The path for validation issues
   * @param texCoord - The the texture coordinate set index, used for
   * constructing the `TEXCOORD_${texCoord}` attribute name.
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateTexCoordDefinition(
    path: string,
    texCoord: number,
    context: ValidationContext
  ): boolean {
    // The texCoord MUST be an integer of at least 0
    if (
      !BasicValidator.validateIntegerRange(
        path,
        "texCoord",
        texCoord,
        0,
        true,
        undefined,
        false,
        context
      )
    ) {
      return false;
    }
    return true;
  }

  /**
   * Validate the `texCoord` definition of a texture.
   *
   * This will check whether the given value is a nonnegative integer,
   * and whether the resulting `TEXCOORD_${texCoord}` attribute
   * appears in the given mesh primitive.
   *
   * If the given value is not valid, then a validation error will
   * be added to the given context, and `false` will be returned.
   *
   * @param path - The path for validation issues
   * @param texCoord - The the texture coordinate set index, used for
   * constructing the `TEXCOORD_${texCoord}` attribute name.
   * @param gltf - The glTF object
   * @param meshPrimitive - The mesh primitive that contains the extension
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateTexCoordForMeshPrimitive(
    path: string,
    texCoord: number,
    meshPrimitive: any,
    context: ValidationContext
  ): boolean {
    // The texCoord MUST be an integer of at least 0
    if (
      !BasicValidator.validateIntegerRange(
        path,
        "texCoord",
        texCoord,
        0,
        true,
        undefined,
        false,
        context
      )
    ) {
      return false;
    }

    // For a given texCoord value, the attribute
    // with the name `TEXCOORD_${texCoord}` must
    // appear as an attribute in the mesh primitive
    const texCoordAttributeName = `TEXCOORD_${texCoord}`;
    const primitiveAttributes = meshPrimitive.attributes || {};
    const texCoordAccessorIndex = primitiveAttributes[texCoordAttributeName];
    if (texCoordAccessorIndex === undefined) {
      const message =
        `The texture defines the texCoord ${texCoord}, ` +
        `but the attribute ${texCoordAttributeName} was not ` +
        `found in the mesh primitive attributes`;
      const issue = StructureValidationIssues.IDENTIFIER_NOT_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      return false;
    }

    // The presence and validity of the accessor for the TEXCOORD_n
    // attribute has already been validated by the glTF-Validator.
    // This includes the validation that...
    // - the accessor type MUST be "VEC2"
    // - the accessor componentType MUST be FLOAT, UNSIGNED_BYTE,
    //   or UNSIGNED_SHORT
    // - when the accessor componentType is UNSIGNED_BYTE or
    //   UNSIGNED_SHORT, then the accessor MUST be normalized
    return true;
  }

  /**
   * Validate the given `channels`, which may be part of a feature ID
   * texture or a property texture.
   *
   * In both cases, the `channels` must be an array with at least 1
   * element, and all elements must be nonnegative integers.
   *
   * This only performs the structural validation. The validity of
   * the elements of the `channels` array for a given number of
   * image channels can be checked with `validateChannelsForImage`.
   *
   * The validity of the binary data that is supposed to be accessed
   * using these channels is not checked here.
   *
   * If the channels are not valid, then a validation error will be
   * added to the given context, and `false` will be returned.
   *
   * @param path - The path for validation issues
   * @param channels - The channels
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateChannels(
    path: string,
    channels: any,
    context: ValidationContext
  ): boolean {
    let result = true;
    const channelsPath = path + "/channels";
    if (channels) {
      if (
        !BasicValidator.validateArray(
          channelsPath,
          "channels",
          channels,
          1,
          undefined,
          "number",
          context
        )
      ) {
        result = false;
      } else {
        for (let i = 0; i < channels.length; i++) {
          const channelsElement = channels[i];
          const channelsElementPath = path + "/" + i;
          if (
            !BasicValidator.validateIntegerRange(
              channelsElementPath,
              "channel",
              channelsElement,
              0,
              true,
              undefined,
              false,
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
   * Validate the given `channels`, which may be part of a feature ID
   * texture or a property texture, for an image that has the
   * given number of channels.
   *
   * If the channels are not valid, then a validation error will be
   * added to the given context, and `false` will be returned.
   *
   * @param path - The path for validation issues
   * @param name - A name for the source of the `channels` definition.
   * This may be "feature ID texture" or "property texture property".
   * @param channels - The channels
   * @param channelsInImage - The number of channels in the image
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateChannelsForImage(
    path: string,
    name: string,
    channels: number[],
    channelsInImage: number,
    context: ValidationContext
  ): boolean {
    // Make sure that the `channels` contains only elements that
    // are smaller than the number of channels in the image
    if (channels.length > channelsInImage) {
      const message =
        `The ${name} defines ${channels.length} channels, ` +
        `but the texture only contains ${channelsInImage} channels`;
      const issue = GltfExtensionValidationIssues.TEXTURE_CHANNELS_OUT_OF_RANGE(
        path,
        message
      );
      context.addIssue(issue);
      return false;
    }
    for (let i = 0; i < channels.length; i++) {
      const c = channels[i];
      if (c >= channelsInImage) {
        const message =
          `Channel ${i} of the ${name} is ${c}, ` +
          `but the texture only contains ${channelsInImage} channels`;
        const issue =
          GltfExtensionValidationIssues.TEXTURE_CHANNELS_OUT_OF_RANGE(
            path,
            message
          );
        context.addIssue(issue);
        return false;
      }
    }
    return true;
  }
}
