import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";

import { GltfData } from "./GltfData";
import { ImageDataReader } from "./ImageDataReader";
import { Accessors } from "./Accessors";
import { SamplerValidator } from "./SamplerValidator";
import { TextureValidator } from "./TextureValidator";

import { GltfExtensionValidationIssues } from "../../issues/GltfExtensionValidationIssues";
import { StructureValidationIssues } from "../../issues/StructureValidationIssues";
import { ValidationIssues } from "../../issues/ValidationIssues";

/**
 * A class for validating the `EXT_mesh_features` extension in
 * glTF assets.
 *
 * This class assumes that the structure of the glTF asset itself
 * has already been validated (e.g. with the glTF Validator).
 *
 * @internal
 */
export class ExtMeshFeaturesValidator {
  /**
   * Performs the validation to ensure that the `EXT_mesh_features`
   * extensions in the given glTF are valid
   *
   * @param path - The path for validation issues
   * @param gltfData - The glTF data, containing the parsed JSON and the
   * (optional) binary buffer
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static async validateGltf(
    path: string,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    const gltf = gltfData.gltf;

    // Dig into the (untyped) JSON representation of the
    // glTF, to find the mesh primtives that carry the
    // EXT_mesh_features extension
    const meshes = gltf.meshes;
    if (!meshes) {
      return true;
    }
    if (!Array.isArray(meshes)) {
      return true;
    }

    let result = true;
    for (const mesh of meshes) {
      const primitives = mesh.primitives;
      if (!primitives) {
        continue;
      }
      if (!Array.isArray(primitives)) {
        continue;
      }
      for (const primitive of primitives) {
        if (!primitive) {
          continue;
        }
        const extensions = primitive.extensions;
        if (!extensions) {
          continue;
        }
        const extensionNames = Object.keys(extensions);
        for (const extensionName of extensionNames) {
          if (extensionName === "EXT_mesh_features") {
            const extensionObject = extensions[extensionName];
            const objectIsValid =
              await ExtMeshFeaturesValidator.validateExtMeshFeatures(
                path,
                extensionObject,
                primitive,
                gltfData,
                context
              );
            if (!objectIsValid) {
              result = false;
            }
          }
        }
      }
    }
    return result;
  }

  /**
   * Validate the given EXT_mesh_features extension object that was
   * found in the given mesh primitive.
   *
   * @param path - The path for validation issues
   * @param meshFeatures - The EXT_mesh_features extension object
   * @param meshPrimitive - The mesh primitive that contains the extension
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static async validateExtMeshFeatures(
    path: string,
    meshFeatures: any,
    meshPrimitive: any,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "meshFeatures",
        meshFeatures,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the featureIds
    const featureIds = meshFeatures.featureIds;
    const featureIdsPath = path + "/featureIds";
    if (defined(featureIds)) {
      // The featureIds MUST be an array of at least 1 objects
      if (
        !BasicValidator.validateArray(
          featureIdsPath,
          "featureIds",
          featureIds,
          1,
          undefined,
          "object",
          context
        )
      ) {
        result = false;
      } else {
        // Validate each featureId
        for (let i = 0; i < featureIds.length; i++) {
          const featureId = featureIds[i];
          const featureIdPath = featureIdsPath + "/" + i;
          const featureIdValid =
            await ExtMeshFeaturesValidator.validateFeatureId(
              featureIdPath,
              featureId,
              meshPrimitive,
              gltfData,
              context
            );
          if (!featureIdValid) {
            result = false;
          }
        }
      }
    }
    return result;
  }

  /**
   * Validate the given feature ID object that was found in the
   * `featureIds` array of an EXT_mesh_features extension object
   *
   * @param path - The path for validation issues
   * @param featureId - The feature ID
   * @param meshPrimitive - The mesh primitive that contains the extension
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static async validateFeatureId(
    path: string,
    featureId: any,
    meshPrimitive: any,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "featureId", featureId, context)) {
      return false;
    }

    let result = true;

    // Validate the nullFeatureId
    // The nullFeatureId MUST be an integer of at least 0
    const nullFeatureId = featureId.nullFeatureId;
    const nullFeatureIdPath = path + "/nullFeatureId";
    if (defined(nullFeatureId)) {
      if (
        !BasicValidator.validateIntegerRange(
          nullFeatureIdPath,
          "nullFeatureId",
          nullFeatureId,
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

    // Validate the label
    // The label MUST be a string
    // The label MUST match the ID regex
    const label = featureId.label;
    const labelPath = path + "/label";
    if (defined(label)) {
      if (!BasicValidator.validateString(labelPath, "label", label, context)) {
        result = false;
      } else {
        if (
          !BasicValidator.validateIdentifierString(
            labelPath,
            "label",
            label,
            context
          )
        ) {
          result = false;
        }
      }
    }

    // Validate the featureCount
    // The featureCount MUST be defined
    // The featureCount MUST be an integer of at least 1
    const featureCount = featureId.featureCount;
    const featureCountPath = path + "/featureCount";
    if (
      !BasicValidator.validateIntegerRange(
        featureCountPath,
        "featureCount",
        featureCount,
        1,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;

      // The remaining validation will require a valid featureCount.
      // If the featureCount was not valid, then bail out early:
      return result;
    }

    // Validate the attribute
    const attribute = featureId.attribute;
    const attributePath = path + "/attribute";
    if (defined(attribute)) {
      const attributeValid =
        await ExtMeshFeaturesValidator.validateFeatureIdAttribute(
          attributePath,
          attribute,
          featureCount,
          meshPrimitive,
          gltfData,
          context
        );
      if (!attributeValid) {
        result = false;
      }
    }

    // Validate the texture
    const texture = featureId.texture;
    const texturePath = path + "/texture";
    if (defined(texture)) {
      const textureValid =
        await ExtMeshFeaturesValidator.validateFeatureIdTexture(
          texturePath,
          texture,
          featureCount,
          meshPrimitive,
          gltfData,
          context
        );
      if (!textureValid) {
        result = false;
      }
    }

    // Validate the propertyTable
    // The propertyTable MUST be an integer of at least 0
    const propertyTable = featureId.propertyTable;
    const propertyTablePath = path + "/propertyTable";
    if (defined(propertyTable)) {
      if (
        !BasicValidator.validateIntegerRange(
          propertyTablePath,
          "propertyTable",
          propertyTable,
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

    // TODO Validate propertyTable value to be in [0, numPropertyTables]!!!
    // Connection to `EXT_structural_metadata` here!
    console.log("Property Table value is not validated yet");

    return result;
  }

  /**
   * Validate the given feature ID `attribute` value that was found in
   * a feature ID definition
   *
   * @param path - The path for validation issues
   * @param attribute - The attribute (i.e. the supposed number that
   * will be used for the `_FEATURE_ID_${attribute}` attribute name)
   * @param featureCount - The `featureCount` value from the feature ID definition
   * @param meshPrimitive - The mesh primitive that contains the extension
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static async validateFeatureIdAttribute(
    path: string,
    attribute: any,
    featureCount: number,
    meshPrimitive: any,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    // Validate the attribute
    // The attribute MUST be an integer of at least 0
    if (
      !BasicValidator.validateIntegerRange(
        path,
        "attribute",
        attribute,
        0,
        true,
        undefined,
        false,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // For a given attribute value, the attribute
    // with the name `_FEATURE_ID_${attribute}` must
    // appear as an attribute in the mesh primitive
    const featureIdAttributeName = `_FEATURE_ID_${attribute}`;
    const primitiveAttributes = meshPrimitive.attributes || {};
    const featureIdAccessorIndex = primitiveAttributes[featureIdAttributeName];
    if (featureIdAccessorIndex === undefined) {
      const message =
        `The feature ID defines the attribute ${attribute}, ` +
        `but the attribute ${featureIdAttributeName} was not ` +
        `found in the mesh primitive attributes`;
      const issue = StructureValidationIssues.IDENTIFIER_NOT_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    } else {
      const accessorValid =
        await ExtMeshFeaturesValidator.validateFeatureIdAccessor(
          path,
          featureIdAccessorIndex,
          featureCount,
          gltfData,
          context
        );
      if (!accessorValid) {
        result = false;
      }
    }

    return result;
  }

  private static async validateFeatureIdAccessor(
    path: string,
    accessorIndex: number,
    featureCount: number,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    // The validity of the accessor index and the accessor
    // have already been checked by the glTF-Validator
    const gltf = gltfData.gltf;
    const accessors = gltf.accessors || [];
    const accessor = accessors[accessorIndex];

    let result = true;

    // The accessor type must be "SCALAR"
    if (accessor.type !== "SCALAR") {
      const message =
        `The feature ID attribute accessor must have the type 'SCALAR', ` +
        `but has the type ${accessor.type}`;
      const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    // The accessor must not be normalized
    if (accessor.normalized === true) {
      const message = `The feature ID attribute accessor may not be normalized`;
      const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    // Only if the structures have been valid until now,
    // validate the actual data of the accessor
    if (result) {
      const dataValid =
        await ExtMeshFeaturesValidator.validateFeatureIdAttributeData(
          path,
          accessorIndex,
          featureCount,
          gltfData,
          context
        );
      if (!dataValid) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the data of the given feature ID atribute.
   *
   * This assumes that the glTF data is valid as determined by the
   * glTF Validator, **AND** as determined by the validation of
   * the JSON part of the extension. So this method should only
   * be called when no issues have been detected that may prevent
   * the validation of the accessor values. If this is called
   * with a `gltfData` object where the `gltfDocument` is
   * `undefined`, then an `INTERNAL_ERROR` will be caused.
   *
   * @param path - The path for validation issues
   * @param accessorIndex - The feature ID attribute accessor index
   * @param featureCount - The `featureCount` value from the feature ID definition
   * @param gltf - The glTF object
   * @param binaryBufferData - The binary buffer data of the glTF
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static async validateFeatureIdAttributeData(
    path: string,
    accessorIndex: number,
    featureCount: number,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    const accessorValues = Accessors.readScalarAccessorValues(
      accessorIndex,
      gltfData
    );
    if (!accessorValues) {
      // This should only happen for invalid glTF assets (e.g. ones that
      // use wrong accessor component types), but the glTF Validator
      // should already have caught that.
      const message = `Could not read data for feature ID attribute accessor`;
      const issue = ValidationIssues.INTERNAL_ERROR(path, message);
      context.addIssue(issue);
      return false;
    }

    // Make sure that the `featureCount` matches the
    // actual number of different values that appear
    // in the accessor
    const featureIdSet = new Set<number>(accessorValues);
    if (featureCount !== featureIdSet.size) {
      const message =
        `The featureCount was ${featureCount}, but the attribute ` +
        `accessor contains ${featureIdSet.size} different values`;
      const issue = GltfExtensionValidationIssues.FEATURE_COUNT_MISMATCH(
        path,
        message
      );
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Validate the given feature ID `texture` value that was found in
   * a feature ID definition
   *
   * @param path - The path for validation issues
   * @param featureIdTexture - The feature ID texture definition
   * @param featureCount - The `featureCount` value from the feature ID definition
   * @param meshPrimitive - The mesh primitive that contains the extension
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static async validateFeatureIdTexture(
    path: string,
    featureIdTexture: any,
    featureCount: number,
    meshPrimitive: any,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(path, "texture", featureIdTexture, context)
    ) {
      return false;
    }

    const gltf = gltfData.gltf;
    const textures = gltf.textures || [];
    const numTextures = textures.length;

    // Validate the index
    // The index MUST be defined
    // The index MUST be an integer in [0, numTextures)
    const index = featureIdTexture.index;
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
    const texCoord = featureIdTexture.texCoord;
    const texCoordPath = path + "/texCoord";
    if (defined(texCoord)) {
      if (
        !TextureValidator.validateTexCoordForMeshPrimitive(
          texCoordPath,
          texCoord,
          meshPrimitive,
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
    const channels = featureIdTexture.channels;
    if (!TextureValidator.validateChannels(path, channels, context)) {
      result = false;
    }

    // Make sure that the sampler of the texture (if present) uses the
    // allowed values (namely, 'undefined' or 9728 (NEAREST)) for
    // its minFilter and magFilter
    // (Note: The validity of the `texture.sampler` index has
    // already been checked by the glTF Validator)
    const texture = textures[index];
    const samplerIndex = texture.sampler;
    if (samplerIndex !== undefined) {
      const samplers = gltf.samplers || [];
      const sampler = samplers[samplerIndex];
      if (!SamplerValidator.validateSamplerNearest(path, sampler, context)) {
        result = false;
      }
    }

    // Only if the structures have been valid until now,
    // validate the actual data of the texture
    if (result) {
      const dataValid =
        await ExtMeshFeaturesValidator.validateFeatureIdTextureData(
          path,
          featureIdTexture,
          featureCount,
          gltfData,
          context
        );
      if (!dataValid) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the data of the given feature ID texture.
   *
   * This will try to read the image data, check whether it matches
   * the `channels` definition of the feature ID texture, and whether
   * the number of feature IDs (created from the respective channels
   * of the image pixels) actually matches the given `featureCount`.
   *
   * @param path - The path for validation issues
   * @param featureIdTexture - The feature ID texture
   * @param featureCount - The `featureCount` value from the feature ID definition
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static async validateFeatureIdTextureData(
    path: string,
    featureIdTexture: any,
    featureCount: number,
    gltfData: GltfData,
    context: ValidationContext
  ) {
    const gltf = gltfData.gltf;
    const textureIndex = featureIdTexture.index;
    const textures = gltf.textures || [];
    const texture = textures[textureIndex];
    const images = gltf.images || [];
    const imageIndex = texture.source;
    const image = images[imageIndex];

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
    const channels = defaultValue(featureIdTexture.channels, [0]);
    const channelsValid = TextureValidator.validateChannelsForImage(
      path,
      "feature ID texture",
      channels,
      channelsInImage,
      context
    );
    if (!channelsValid) {
      return false;
    }

    // Make sure that the `featureCount` matches the
    // actual number of different values that appear
    // in the texture
    const featureIdSet = new Set<number>();
    const sizeX = imageData.sizeX;
    const sizeY = imageData.sizeY;
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        const value = ImageDataReader.getValue(imageData, x, y, channels);
        featureIdSet.add(value);
      }
    }
    if (featureCount !== featureIdSet.size) {
      const message =
        `The featureCount was ${featureCount}, but the texture ` +
        `contains ${featureIdSet.size} different values`;
      const issue = GltfExtensionValidationIssues.FEATURE_COUNT_MISMATCH(
        path,
        message
      );
      context.addIssue(issue);
      return false;
    }

    return true;
  }
}
