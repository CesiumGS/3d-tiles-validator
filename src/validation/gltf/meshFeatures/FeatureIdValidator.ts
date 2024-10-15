import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { ValidatedElement } from "../../ValidatedElement";
import { BasicValidator } from "../../BasicValidator";

import { GltfData } from "../GltfData";

import { GltfExtensionValidationIssues } from "../../../issues/GltfExtensionValidationIssues";
import { JsonValidationIssues } from "../../../issues/JsonValidationIssues";

/**
 * A class for validation functionality related to feature IDs, as they
 * appear in the `EXT_mesh_features` and `EXT_instance_features`
 * extensions.
 *
 * @internal
 */
export class FeatureIdValidator {
  /**
   * Validate the common elements of a feature ID object.
   *
   * This refers to `featureId` objects that are found in the
   * `EXT_mesh_features` and `EXT_instance_features` extension
   * objects.
   *
   * It ensures that...
   * - the value being an object
   * - the nullFeatureId (if present) being valid
   * - the label (if present) being valid
   * - the featureCount being present and valid
   *
   * It does NOT validate the `texture` or `attribute` properties
   * that may be found in the object, depending on whether it is
   * part of the `EXT_mesh_features` or `EXT_instance_features`
   * extension object.
   *
   * @param path - The path for validation issues
   * @param featureId - The feature ID
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateCommonFeatureId(
    path: string,
    featureId: any,
    context: ValidationContext
  ): boolean {
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
    }

    return result;
  }

  /**
   * Validate the given set of feature ID values that have either
   * been found in an feature ID texture or in a feature ID attribute.
   *
   * This will check the validity of the 'featureCount' for the
   * given set of features, depending on the presence of the
   * 'nullFeatureId', and whether the feature IDs are valid
   * indices into a property table (if the property table count
   * was given)
   *
   * @param path - The path for validation issues
   * @param sourceName - The source, 'texture' or 'attribute'
   * @param featureIdSet - The feature ID set. Note that This set
   * might be modifified by this method!
   * @param featureCount - The `featureCount` value from the feature ID definition
   * @param propertyTableState - The validation state of the property table
   * definition (i.e. the index into the property tables array)
   * @param nullFeatureId - The `nullFeatureId` of the `featureId` object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateFeatureIdSet(
    path: string,
    sourceName: string,
    featureIdSet: Set<number>,
    featureCount: number,
    propertyTableState: ValidatedElement<{ count: number }>,
    nullFeatureId: number | undefined,
    context: ValidationContext
  ) {
    // Make sure that the actual number of different values that appear
    // in the source (excluding the nullFeatureId, if it was defined)
    // is not larger than the `featureCount`
    if (defined(nullFeatureId)) {
      featureIdSet.delete(nullFeatureId);
      if (featureIdSet.size > featureCount) {
        const message =
          `The featureID ${sourceName} contains ${featureIdSet.size} different values ` +
          `(excluding the nullFeatureId value), but the featureCount was ${featureCount}`;
        const issue = GltfExtensionValidationIssues.FEATURE_COUNT_MISMATCH(
          path,
          message
        );
        context.addIssue(issue);
        return false;
      }
    } else {
      if (featureIdSet.size > featureCount) {
        const message =
          `The feature ID ${sourceName} contains ${featureIdSet.size} different values ` +
          `but the featureCount was ${featureCount}`;
        const issue = GltfExtensionValidationIssues.FEATURE_COUNT_MISMATCH(
          path,
          message
        );
        context.addIssue(issue);
        return false;
      }
    }

    // If the feature ID refers to a property table, then make
    // sure that it only contains feature ID values that are in
    // the range [0, propertyTable.count)
    if (
      propertyTableState.wasPresent &&
      propertyTableState.validatedElement !== undefined
    ) {
      const propertyTableCount = propertyTableState.validatedElement.count;
      const featureIdValues = [...featureIdSet];
      const maximumFeatureId = Math.max(...featureIdValues);
      const minimumFeatureId = Math.min(...featureIdValues);
      if (minimumFeatureId < 0 || maximumFeatureId >= propertyTableCount) {
        const message =
          `The feature ID refers to a property table with ${propertyTableCount} ` +
          `rows, so the feature IDs must be in the range ` +
          `[0,${propertyTableCount - 1}], but the feature ID ${sourceName} ` +
          `contains values in [${minimumFeatureId},${maximumFeatureId}]`;
        const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(path, message);
        context.addIssue(issue);
        return false;
      }
    }
    return true;
  }

  /**
   * Obtain the `count` of the property table that is referred to
   * with the given index.
   *
   * This assumes that the validity of this index has already been
   * checked with `validateFeatureIdPropertyTable`. If any
   * element that leads to the `count` is invalid or not defined,
   * then `undefined` will be returned.
   *
   * @param propertyTableIndex - The value that was found as the `propertyTable`
   * in the definition, indicating the index into the property tables array
   * @param gltfData - The glTF data
   * @returns The `count` of the property table
   */
  static obtainPropertyTableCount(
    propertyTableIndex: number,
    gltfData: GltfData
  ): number | undefined {
    const gltf = gltfData.gltf;
    const extensions = gltf.extensions || {};
    const structuralMetadata = extensions["EXT_structural_metadata"] || {};
    const propertyTables = structuralMetadata.propertyTables;
    if (!propertyTables || propertyTableIndex >= propertyTables.length) {
      return undefined;
    }
    const propertyTable = propertyTables[propertyTableIndex];
    const count = propertyTable.count;
    return count;
  }
}
