import { defined } from "3d-tiles-tools";

import { Validator } from "./Validator";
import { ValidationState } from "./ValidationState";
import { BasicValidator } from "./BasicValidator";
import { ValidationContext } from "./ValidationContext";
import { PropertiesValidator } from "./PropertiesValidator";
import { StatisticsValidator } from "./StatisticsValidator";
import { AssetValidator } from "./AssetValidator";
import { TilesetTraversingValidator } from "./TilesetTraversingValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { ExtendedObjectsValidators } from "./ExtendedObjectsValidators";

import { SchemaDefinitionValidator } from "./metadata/SchemaDefinitionValidator";
import { MetadataEntityValidator } from "./metadata/MetadataEntityValidator";

import { Tileset } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";
import { Group } from "3d-tiles-tools";

import { IoValidationIssues } from "../issues/IoValidationIssue";
import { StructureValidationIssues } from "../issues/StructureValidationIssues";
import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";
import { ValidatedElement } from "./ValidatedElement";

/**
 * A class that can validate a 3D Tiles tileset.
 *
 * @internal
 */
export class TilesetValidator implements Validator<Tileset> {
  /**
   * Performs the validation of the tileset that is parsed from the
   * given input string.
   *
   * @param input - The string that was read from a `tileset.json` file
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  async validateJsonString(
    input: string,
    context: ValidationContext
  ): Promise<void> {
    try {
      const object: Tileset = JSON.parse(input);
      await this.validateObject("", object, context);
    } catch (error) {
      //console.log(error);
      const issue = IoValidationIssues.JSON_PARSE_ERROR("", "" + error);
      context.addIssue(issue);
    }
  }

  /**
   * Implementation of the `Validator` interface that just passes the
   * input to `validateTileset`.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param input - The `Tileset` object
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether the object was valid or not.
   */
  async validateObject(
    path: string,
    input: Tileset,
    context: ValidationContext
  ): Promise<boolean> {
    const result = await TilesetValidator.validateTileset(path, input, context);
    return result;
  }

  /**
   * Performs the validation of the given `Tileset` object that was parsed
   * from a `tileset.json` input.
   *
   * Issues that are encountered during the validation will be added
   * as `ValidationIssue` instances to the given `ValidationContext`.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param tileset - The `Tileset` object
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether the object was valid or not.
   */
  static async validateTileset(
    path: string,
    tileset: Tileset,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "tileset", tileset, context)) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        path,
        "tileset",
        tileset,
        context
      )
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(path, tileset, context)
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(tileset)) {
      return result;
    }

    // The asset MUST be defined
    const asset = tileset.asset;
    if (!AssetValidator.validateAsset(asset, context)) {
      result = false;
    }

    // Validate the properties (I mean, the `properties`...)
    const properties = tileset.properties;
    if (defined(properties)) {
      if (!PropertiesValidator.validateProperties(properties, context)) {
        result = false;
      }
    }

    // Validate the schema definition that is given either via
    // the `schema` or the `schemaUri`.
    const schemaState =
      await SchemaDefinitionValidator.validateSchemaDefinition(
        path,
        "tileset",
        tileset.schema,
        tileset.schemaUri,
        context
      );
    // When there was a schema definition, but the schema itself
    // was not valid, then the overall result is invalid
    if (schemaState.wasPresent && !defined(schemaState.validatedElement)) {
      result = false;
    }

    // Validate the groups.
    const groupsState: ValidatedElement<Group[]> = {
      wasPresent: false,
      validatedElement: undefined,
    };
    const groups = tileset.groups;
    const groupsPath = path + "/groups";
    if (defined(groups)) {
      groupsState.wasPresent = true;

      // If there are groups, then there must be a schema definition
      if (!schemaState.wasPresent) {
        const message =
          "The tileset defines 'groups' but does not have a schema";
        const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
          groupsPath,
          message
        );
        context.addIssue(issue);
        result = false;
      } else if (defined(schemaState.validatedElement)) {
        if (
          TilesetValidator.validateTilesetGroups(
            groups,
            schemaState.validatedElement,
            context
          )
        ) {
          groupsState.validatedElement = groups;
        } else {
          result = false;
        }
      }
    }

    // Create the ValidationState that describes the state of
    // the validation for tileset elements (i.e. the schema
    // and the metadata groups)
    const validationState: ValidationState = {
      schemaState: schemaState,
      groupsState: groupsState,
    };

    // Validate the statistics
    const statistics = tileset.statistics;
    const statisticsPath = path + "/statistics";
    if (defined(statistics)) {
      if (
        !StatisticsValidator.validateStatistics(
          statisticsPath,
          statistics,
          schemaState,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the geometricError
    const geometricError = tileset.geometricError;
    const geometricErrorPath = "/geometricError";

    // The geometricError MUST be defined
    // The geometricError MUST be a number
    // The geometricError MUST be >= 0
    if (
      !BasicValidator.validateNumberRange(
        geometricErrorPath,
        "geometricError",
        geometricError,
        0.0,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate the metadata
    const metadata = tileset.metadata;
    const metadataPath = path + "/metadata";
    if (defined(metadata)) {
      if (!schemaState.wasPresent) {
        // If there is metadata, then there MUST be a schema definition
        const message =
          `The tileset defines metadata, but ` +
          `there was no schema definition`;
        const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      } else if (defined(schemaState.validatedElement)) {
        if (
          !MetadataEntityValidator.validateMetadataEntity(
            metadataPath,
            "metadata",
            metadata,
            schemaState.validatedElement,
            context
          )
        ) {
          result = false;
        }
      }
    }

    const traversalValid = await TilesetTraversingValidator.validateTileset(
      tileset,
      validationState,
      context
    );
    if (!traversalValid) {
      result = false;
    }

    if (
      !TilesetValidator.validateExtensionDeclarations(path, tileset, context)
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the extension declarations of the given tileset.
   *
   * This is supposed to be called at the end of the validation process
   * of the tileset. It uses the extension names that have been added
   * to the `ValidationContext` via `addExtensionFound`, to make sure
   * that all extensions that are found have also been declared in
   * the 'extensionsUsed' array.
   *
   * It also performs the JSON-schema level validation of the basic
   * structure and consistency of the 'extensionsUsed' and
   * 'extensionsRequired' arrays of the given tileset.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param tileset - The `Tileset`
   * @param context - The `ValidationContext`
   * @returns Whether the declarations have been valid
   */
  private static validateExtensionDeclarations(
    path: string,
    tileset: Tileset,
    context: ValidationContext
  ): boolean {
    let result = true;

    // These are the actual sets of unique string values that
    // are found in 'extensionsUsed' and 'extensionsRequired'
    const actualExtensionsUsed = new Set<string>();
    const actualExtensionsRequired = new Set<string>();

    // Validate the extensionsUsed
    const extensionsUsed = tileset.extensionsUsed;
    const extensionsUsedPath = path + "/extensionsUsed";
    if (defined(extensionsUsed)) {
      // The extensionsUsed MUST be an array of strings with
      // a length of at least 1
      if (
        !BasicValidator.validateArray(
          extensionsUsedPath,
          "extensionsUsed",
          extensionsUsed,
          1,
          undefined,
          "string",
          context
        )
      ) {
        result = false;
      } else {
        extensionsUsed.forEach((e) => actualExtensionsUsed.add(e));

        // The elements in extensionsUsed MUST be unique
        const elementsUnique = BasicValidator.validateArrayElementsUnique(
          extensionsUsedPath,
          "extensionsUsed",
          extensionsUsed,
          context
        );
        if (!elementsUnique) {
          result = false;
        }
      }
    }
    // Validate the extensionsRequired
    const extensionsRequired = tileset.extensionsRequired;
    const extensionsRequiredPath = path + "/extensionsRequired";
    if (defined(extensionsRequired)) {
      // The extensionsRequired MUST be an array of strings with
      // a length of at least 1
      if (
        !BasicValidator.validateArray(
          extensionsRequiredPath,
          "extensionsRequired",
          extensionsRequired,
          1,
          undefined,
          "string",
          context
        )
      ) {
        result = false;
      } else {
        extensionsRequired.forEach((e) => actualExtensionsRequired.add(e));

        // The elements in extensionsRequired MUST be unique
        const elementsUnique = BasicValidator.validateArrayElementsUnique(
          extensionsRequiredPath,
          "extensionsRequired",
          extensionsRequired,
          context
        );
        if (!elementsUnique) {
          result = false;
        }
      }
    }

    // Each extension in extensionsRequired MUST also
    // appear in extensionsUsed.
    for (const extensionName of actualExtensionsRequired) {
      if (!actualExtensionsUsed.has(extensionName)) {
        const issue = SemanticValidationIssues.EXTENSION_REQUIRED_BUT_NOT_USED(
          extensionsUsedPath,
          extensionName
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Each extension that is found during the validation
    // in the `RootPropertyValidator` or the
    // `ContentDataValidator` also has to appear
    // in the 'extensionsUsed'
    const actualExtensionsFound = context.getExtensionsFound();

    // TODO: A cleaner solution has to be found for this. See
    // https://github.com/CesiumGS/3d-tiles-validator/issues/231
    if (tileset.asset?.version === "1.1") {
      actualExtensionsFound.delete("3DTILES_content_gltf");
    }

    for (const extensionName of actualExtensionsFound) {
      if (!actualExtensionsUsed.has(extensionName)) {
        const issue = SemanticValidationIssues.EXTENSION_FOUND_BUT_NOT_USED(
          extensionsUsedPath,
          extensionName
        );
        context.addIssue(issue);
        result = false;
      }
    }

    // Each extension that is declared in the 'extensionsUsed'
    // should also appear in the extensions that are found
    // (but it does not have to - so this is just a warning)
    for (const extensionName of actualExtensionsUsed) {
      if (!actualExtensionsFound.has(extensionName)) {
        const issue = SemanticValidationIssues.EXTENSION_USED_BUT_NOT_FOUND(
          extensionsUsedPath,
          extensionName
        );
        context.addIssue(issue);
      }
    }
    return result;
  }

  /**
   * Validates the given `tileset.groups`
   *
   * @param groups - The groups
   * @param schema - The schema that was either contained in the
   * `tileset.schema`, or resolved from the `tileset.schemaUri`
   * @param context - The `ValidationContext`
   * @returns Whether the groups are valid
   */
  private static validateTilesetGroups(
    groups: Group[],
    schema: Schema,
    context: ValidationContext
  ): boolean {
    const groupsPath = "/groups";

    // The groups MUST be an array of objects
    if (
      !BasicValidator.validateArray(
        groupsPath,
        "groups",
        groups,
        undefined,
        undefined,
        "object",
        context
      )
    ) {
      return false;
    }
    // Validate each group against the schema
    let allValid = true;
    for (let index = 0; index < groups.length; index++) {
      const group = groups[index];
      const groupPath = groupsPath + "/" + index;
      allValid =
        allValid &&
        MetadataEntityValidator.validateMetadataEntity(
          groupPath,
          "group[" + index + "]",
          group,
          schema,
          context
        );
    }
    return allValid;
  }
}
