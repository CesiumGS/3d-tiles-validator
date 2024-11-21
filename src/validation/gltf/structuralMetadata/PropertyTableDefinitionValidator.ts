import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { ValidatedElement } from "../../ValidatedElement";
import { BasicValidator } from "../../BasicValidator";

import { GltfData } from "../GltfData";

import { GltfExtensionValidationIssues } from "../../../issues/GltfExtensionValidationIssues";

/**
 * A class for the validation of a single property table that
 * is referred to by a feature ID definition.
 *
 */
export class PropertyTableDefinitionValidator {
  /**
   * Validate the given feature ID `propertyTable` value that was found in
   * a feature ID definition.
   *
   * The returned object will contain two properties:
   * - `wasPresent`: Whether a propertyTable (index) was given
   * - `validatedElement`: The validated property table object, only
   *    insofar that it contains a defined `count` value
   *
   * This will check whether the `propertyTable` refers to an existing
   * property table in the `EXT_structural_metadata` extension object,
   * and this property table has a valid `count`.
   *
   * It will NOT check the validity of the property table itself. This
   * will be done by the `EXT_structural_metadata` validator.
   *
   * @param path - The path for validation issues
   * @param propertyTableIndex - The value that was found as the `propertyTable`
   * in the definition, indicating the index into the property tables array
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the state summarizing the definition
   */
  static validatePropertyTableDefinition(
    path: string,
    propertyTableIndex: number | undefined,
    gltfData: GltfData,
    context: ValidationContext
  ): ValidatedElement<{ count: number }> {
    // Return immediately when there are no property table
    const propertyTableState: ValidatedElement<{ count: number }> = {
      wasPresent: false,
      validatedElement: undefined,
    };
    if (!defined(propertyTableIndex)) {
      return propertyTableState;
    }

    propertyTableState.wasPresent = true;

    const gltf = gltfData.gltf;
    const extensions = gltf.extensions || {};
    const structuralMetadata = extensions["EXT_structural_metadata"];

    if (!structuralMetadata) {
      const message =
        `The feature ID refers to a property table with index ` +
        `${propertyTableIndex}, but the glTF did not contain an ` +
        `'EXT_structural_metadata' extension object`;
      const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
        path,
        message
      );
      context.addIssue(issue);
      return propertyTableState;
    }
    const propertyTables = structuralMetadata.propertyTables;
    if (!propertyTables) {
      const message =
        `The feature ID refers to a property table with index ` +
        `${propertyTableIndex}, but the 'EXT_structural_metadata' ` +
        `extension object did not define property tables`;
      const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
        path,
        message
      );
      context.addIssue(issue);
      return propertyTableState;
    }

    // Validate the propertyTable(Index)
    // The propertyTable MUST be an integer in [0,numPropertyTables)
    const numPropertyTables = defaultValue(propertyTables.length, 0);
    if (
      !BasicValidator.validateIntegerRange(
        path,
        "propertyTable",
        propertyTableIndex,
        0,
        true,
        numPropertyTables,
        false,
        context
      )
    ) {
      return propertyTableState;
    }

    const propertyTable = propertyTables[propertyTableIndex];
    if (!propertyTable) {
      // An issue will be added to the validation context by
      // the `EXT_structural_metadata` validation
      return propertyTableState;
    }
    const count = propertyTable.count;
    if (count === undefined) {
      // An issue will be added to the validation context by
      // the `EXT_structural_metadata` validation
      return propertyTableState;
    }
    propertyTableState.validatedElement = propertyTable;
    return propertyTableState;
  }
}
