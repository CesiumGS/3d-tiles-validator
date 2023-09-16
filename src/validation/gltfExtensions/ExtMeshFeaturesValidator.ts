import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./../ValidationContext";
import { BasicValidator } from "./../BasicValidator";

/**
 * A class for validating the `EXT_mesh_features` extension in
 * glTF assets.
 *
 * @internal
 */
export class ExtMeshFeaturesValidator {
  /**
   * Performs the validation to ensure that the `EXT_mesh_features`
   * extensions in the given glTF are valid
   *
   * @param path - The path for validation issues
   * @param gltf - The object to validate
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateGltf(
    path: string,
    gltf: any,
    context: ValidationContext
  ): boolean {
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
              ExtMeshFeaturesValidator.validateExtMeshFeatures(
                path,
                extensionObject,
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

  private static validateExtMeshFeatures(
    path: string,
    meshFeatures: any,
    context: ValidationContext
  ) {
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
          if (
            !ExtMeshFeaturesValidator.validateFeatureId(
              featureIdPath,
              featureId,
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

  private static validateFeatureId(
    path: string,
    featureId: any,
    context: ValidationContext
  ) {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "featureId", featureId, context)) {
      return false;
    }

    let result = true;

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
    }

    return result;
  }
}
