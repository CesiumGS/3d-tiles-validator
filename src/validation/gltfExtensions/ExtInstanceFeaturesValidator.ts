import { defined } from "@3d-tiles-tools/base";

import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { ValidatedElement } from "../ValidatedElement";

import { GltfData } from "./GltfData";
import { FeatureIdValidator } from "./FeatureIdValidator";
import { PropertyTableDefinitionValidator } from "./PropertyTableDefinitionValidator";
import { FeatureIdAccessorValidator } from "./FeatureIdAccessorValidator";

import { GltfExtensionValidationIssues } from "../../issues/GltfExtensionValidationIssues";
import { StructureValidationIssues } from "../../issues/StructureValidationIssues";

/**
 * A class for validating the `EXT_instance_features` extension in
 * glTF assets.
 *
 * This class assumes that the structure of the glTF asset itself
 * has already been validated (e.g. with the glTF Validator).
 *
 * @internal
 */
export class ExtInstanceFeaturesValidator {
  /**
   * Performs the validation to ensure that the `EXT_instance_features`
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
    // glTF, to find the nodes that carry the
    // EXT_instance_features extension
    const nodes = gltf.nodes;
    if (!nodes) {
      return true;
    }
    if (!Array.isArray(nodes)) {
      return true;
    }

    let result = true;
    for (let n = 0; n < nodes.length; n++) {
      const node = nodes[n];
      const nodePath = path + `/nodes[${n}]`;
      const extensions = node.extensions;
      if (!extensions) {
        continue;
      }
      const instanceFeatures = extensions["EXT_instance_features"];
      if (defined(instanceFeatures)) {
        const meshGpuInstancing = extensions["EXT_mesh_gpu_instancing"];
        if (!defined(meshGpuInstancing)) {
          const message =
            `The node contains an 'EXT_instance_features' extension ` +
            `object, but no 'EXT_mesh_gpu_instancing' extension object`;
          const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
            nodePath,
            message
          );
          context.addIssue(issue);
          result = false;
        } else {
          const objectIsValid =
            await ExtInstanceFeaturesValidator.validateExtInstanceFeatures(
              nodePath,
              instanceFeatures,
              meshGpuInstancing,
              gltfData,
              context
            );
          if (!objectIsValid) {
            result = false;
          }
        }
      }
    }
    return result;
  }

  /**
   * Validate the given EXT_instance_features extension object that was
   * found in the given node
   *
   * This assumes that the given object has already been validated
   * to the extent that is checked by the `FeatureIdValidator`,
   * with the `validateCommonFeatureId` method.
   *
   * @param path - The path for validation issues
   * @param instanceFeatures - The EXT_instance_features extension object
   * @param meshGpuInstancing - The EXT_mesh_gpu_instancing extension object
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static async validateExtInstanceFeatures(
    path: string,
    instanceFeatures: any,
    meshGpuInstancing: any,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "instanceFeatures",
        instanceFeatures,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the featureIds
    const featureIds = instanceFeatures.featureIds;
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

          const commonFeatureIdValid =
            FeatureIdValidator.validateCommonFeatureId(
              featureIdPath,
              featureId,
              context
            );
          if (!commonFeatureIdValid) {
            result = false;
          } else {
            const featureIdValid =
              await ExtInstanceFeaturesValidator.validateInstanceFeaturesFeatureId(
                featureIdPath,
                featureId,
                meshGpuInstancing,
                gltfData,
                context
              );
            if (!featureIdValid) {
              result = false;
            }
          }
        }
      }
    }
    return result;
  }

  /**
   * Validate the given feature ID object that was found in the
   * `featureIds` array of an EXT_instance_features extension object
   *
   * @param path - The path for validation issues
   * @param featureId - The feature ID
   * @param meshGpuInstancing - The `EXT_mesh_gpu_instancing` extension object
   * that contains the attribute definitions
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static async validateInstanceFeaturesFeatureId(
    path: string,
    featureId: any,
    meshGpuInstancing: any,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    // Validate the propertyTable
    const propertyTable = featureId.propertyTable;
    const propertyTablePath = path + "/propertyTable";
    const propertyTableState =
      PropertyTableDefinitionValidator.validatePropertyTableDefinition(
        propertyTablePath,
        propertyTable,
        gltfData,
        context
      );

    let result = true;

    const featureCount = featureId.featureCount;
    const nullFeatureId = featureId.nullFeatureId;

    // Validate the attribute
    const attribute = featureId.attribute;
    const attributePath = path + "/attribute";
    if (defined(attribute)) {
      const attributeValid =
        ExtInstanceFeaturesValidator.validateFeatureIdAttribute(
          attributePath,
          attribute,
          featureCount,
          meshGpuInstancing,
          gltfData,
          propertyTableState,
          nullFeatureId,
          context
        );
      if (!attributeValid) {
        result = false;
      }
    }
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
   * @param meshGpuInstancing - The `EXT_mesh_gpu_instancing` extension object
   * that contains the attribute definitions
   * @param gltfData - The glTF data
   * @param propertyTableState - The validation state of the property table
   * definition (i.e. the index into the property tables array)
   * @param nullFeatureId - The `nullFeatureId` of the `featureId` object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateFeatureIdAttribute(
    path: string,
    attribute: any,
    featureCount: number,
    meshGpuInstancing: any,
    gltfData: GltfData,
    propertyTableState: ValidatedElement<{ count: number }>,
    nullFeatureId: number | undefined,
    context: ValidationContext
  ): boolean {
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

    // For a given attribute value, the attribute with the
    // name `_FEATURE_ID_${attribute}` must appear as an
    // attribute in the `EXT_mesh_gpu_instancing` attributes
    const featureIdAttributeName = `_FEATURE_ID_${attribute}`;
    const primitiveAttributes = meshGpuInstancing.attributes || {};
    const featureIdAccessorIndex = primitiveAttributes[featureIdAttributeName];
    if (featureIdAccessorIndex === undefined) {
      const message =
        `The feature ID defines the attribute ${attribute}, ` +
        `but the attribute ${featureIdAttributeName} was not ` +
        `found in the 'EXT_mesh_gpu_instancing' attributes`;
      const issue = StructureValidationIssues.IDENTIFIER_NOT_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    } else {
      const accessorValid =
        FeatureIdAccessorValidator.validateFeatureIdAccessor(
          path,
          featureIdAccessorIndex,
          featureCount,
          gltfData,
          propertyTableState,
          nullFeatureId,
          context
        );
      if (!accessorValid) {
        result = false;
      }
    }

    return result;
  }
}
