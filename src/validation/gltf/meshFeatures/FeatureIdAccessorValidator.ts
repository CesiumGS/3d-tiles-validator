import { ValidationContext } from "../../ValidationContext";
import { ValidatedElement } from "../../ValidatedElement";

import { GltfData } from "../GltfData";
import { Accessors } from "../Accessors";
import { FeatureIdValidator } from "./FeatureIdValidator";

import { GltfExtensionValidationIssues } from "../../../issues/GltfExtensionValidationIssues";
import { ValidationIssues } from "../../../issues/ValidationIssues";

/**
 * Methods related to the validation of accessors that store
 * feature IDs, in the context of the `EXT_mesh_features` and
 * `EXT_instance_features` extensions.
 */
export class FeatureIdAccessorValidator {
  /**
   * Validate the given feature ID attribute accessor index that
   * was found in the mesh primitive attributes for the
   * `_FEATURE_ID_${attribute}` attribute.
   *
   * @param path - The path for validation issues
   * @param accessorIndex - The accessor index
   * @param featureCount - The `featureCount` value from the feature ID definition
   * @param gltfData - The glTF data
   * @param propertyTableState - The validation state of the property table
   * definition (i.e. the index into the property tables array)
   * @param nullFeatureId - The `nullFeatureId` of the `featureId` object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateFeatureIdAccessor(
    path: string,
    accessorIndex: number,
    featureCount: number,
    gltfData: GltfData,
    propertyTableState: ValidatedElement<{ count: number }>,
    nullFeatureId: number | undefined,
    context: ValidationContext
  ): boolean {
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
    if (result && gltfData.gltfDocument) {
      const dataValid =
        FeatureIdAccessorValidator.validateFeatureIdAccessorData(
          path,
          accessorIndex,
          featureCount,
          gltfData,
          propertyTableState,
          nullFeatureId,
          context
        );
      if (!dataValid) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the data of the given feature ID attribute.
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
   * @param gltfData - The glTF data
   * @param propertyTableState - The validation state of the property table
   * definition (i.e. the index into the property tables array)
   * @param nullFeatureId - The `nullFeatureId` of the `featureId` object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateFeatureIdAccessorData(
    path: string,
    accessorIndex: number,
    featureCount: number,
    gltfData: GltfData,
    propertyTableState: ValidatedElement<{ count: number }>,
    nullFeatureId: number | undefined,
    context: ValidationContext
  ): boolean {
    const accessorValues = Accessors.readScalarAccessorValues(
      accessorIndex,
      gltfData
    );
    if (!accessorValues) {
      // This should only happen for invalid glTF assets (e.g. ones that
      // use wrong accessor component types), or when the gltfDocument
      // could not be read due to another structural error that should
      // be detected by the extension validation.
      const message = `Could not read data for feature ID attribute accessor`;
      const issue = ValidationIssues.INTERNAL_ERROR(path, message);
      context.addIssue(issue);
      return false;
    }

    // Validate the set of feature ID values
    const featureIdSet = new Set<number>(accessorValues);
    if (
      !FeatureIdValidator.validateFeatureIdSet(
        path,
        "attribute",
        featureIdSet,
        featureCount,
        propertyTableState,
        nullFeatureId,
        context
      )
    ) {
      return false;
    }

    return true;
  }
}
