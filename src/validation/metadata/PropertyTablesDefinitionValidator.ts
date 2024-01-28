import { defined } from "@3d-tiles-tools/base";
import { PropertyTable } from "@3d-tiles-tools/structure";
import { Schema } from "@3d-tiles-tools/structure";

import { ValidationContext } from "../ValidationContext";
import { ValidatedElement } from "../ValidatedElement";
import { BasicValidator } from "../BasicValidator";

import { PropertyTableValidator } from "./PropertyTableValidator";

import { StructureValidationIssues } from "../../issues/StructureValidationIssues";

/**
 * A class for validating the definition of property tables.
 */
export class PropertyTablesDefinitionValidator {
  /**
   * Validate the given definition of property tables.
   *
   * The returned object will contain two properties:
   * - `wasPresent`: Whether property tables have been given
   * - `validatedElement`: The validated `PropertyTables[]` object
   *
   * When no property tables are given, then it will just return
   * `{false, undefined}`.
   *
   * If the given `schemaState` indicates that no schema was present,
   * or the property tables have not been valid according to the
   * schema, then an error will be added to the given context,
   * and `{true, undefined}` is returned.
   *
   * The method will return `{true, propertyTables}` only if the
   * given property tables have been valid.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param name - The name of the object containing the definition
   * (for example, 'subtree')
   * @param propertyTables - The actual property tables
   * @param numBufferViews - The number of buffer views in the
   * containing object
   * @param schemaState - The state of the schema validation
   * @param context - The `ValidationContext`
   * @returns Information about the validity of the definition
   */
  static validatePropertyTablesDefinition(
    path: string,
    name: string,
    propertyTables: PropertyTable[] | undefined,
    numBufferViews: number,
    schemaState: ValidatedElement<Schema>,
    context: ValidationContext
  ): ValidatedElement<PropertyTable[]> {
    // Return immediately when there are no property tables
    const propertyTablesState: ValidatedElement<PropertyTable[]> = {
      wasPresent: false,
      validatedElement: undefined,
    };
    if (!defined(propertyTables)) {
      return propertyTablesState;
    }

    // There are property tables.
    propertyTablesState.wasPresent = true;

    // Validate the propertyTables, returning as soon as they
    // have been determined to be invalid
    const propertyTablesPath = path + "/propertyTables";
    if (!schemaState.wasPresent) {
      // If there are property tables, then there MUST be a schema definition
      const message =
        `The ${name} defines 'propertyTables' but ` +
        `there was no schema definition`;
      const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      return propertyTablesState;
    }
    if (defined(schemaState.validatedElement)) {
      // The propertyTables MUST be an array of at least 1 objects
      if (
        !BasicValidator.validateArray(
          propertyTablesPath,
          "propertyTables",
          propertyTables,
          1,
          undefined,
          "object",
          context
        )
      ) {
        return propertyTablesState;
      }
      // Validate each propertyTable
      for (let i = 0; i < propertyTables.length; i++) {
        const propertyTable = propertyTables[i];
        const propertyTablePath = propertyTablesPath + "/" + i;
        if (
          !PropertyTableValidator.validatePropertyTable(
            propertyTablePath,
            propertyTable,
            numBufferViews,
            schemaState.validatedElement,
            context
          )
        ) {
          return propertyTablesState;
        }
      }
    }

    // The property tables have been determined to be valid.
    // Return them as the validatedElement in the returned
    // state:
    propertyTablesState.validatedElement = propertyTables;
    return propertyTablesState;
  }
}
