import { defined } from "3d-tiles-tools";
import { Schema } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { ValidatedElement } from "../../ValidatedElement";
import { BasicValidator } from "../../BasicValidator";

import { PropertyTextureValidator } from "./PropertyTextureValidator";

import { StructureValidationIssues } from "../../../issues/StructureValidationIssues";

/**
 * A class for validating the definition of property textures.
 */
export class PropertyTexturesDefinitionValidator {
  /**
   * Validate the given definition of property textures.
   *
   * The returned object will contain two properties:
   * - `wasPresent`: Whether property textures have been given
   * - `validatedElement`: The validated `PropertyTexture[]` object
   *
   * When no property textures are given, then it will just return
   * `{false, undefined}`.
   *
   * If the given `schemaState` indicates that no schema was present,
   * or the property textures have not been valid according to the
   * schema, then an error will be added to the given context,
   * and `{true, undefined}` is returned.
   *
   * The method will return `{true, propertyTextures}` only if the
   * given property textures have been valid.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param name - The name of the object containing the definition
   * (for example, 'metadata extension object')
   * @param propertyTextures - The actual property textures
   * @param gltf - The containing glTF object
   * @param schemaState - The state of the schema validation
   * @param context - The `ValidationContext`
   * @returns Information about the validity of the definition
   */
  static validatePropertyTexturesDefinition(
    path: string,
    name: string,
    propertyTextures: any[] | undefined,
    gltf: any,
    schemaState: ValidatedElement<Schema>,
    context: ValidationContext
  ): ValidatedElement<any[]> {
    // Return immediately when there are no property textures
    const propertyTexturesState: ValidatedElement<any[]> = {
      wasPresent: false,
      validatedElement: undefined,
    };
    if (!defined(propertyTextures)) {
      return propertyTexturesState;
    }

    // There are property textures.
    propertyTexturesState.wasPresent = true;

    // Validate the propertyTextures, returning as soon as they
    // have been determined to be invalid
    const propertyTexturesPath = path + "/propertyTextures";
    if (!schemaState.wasPresent) {
      // If there are property textures, then there MUST be a schema definition
      const message =
        `The ${name} defines 'propertyTextures' but ` +
        `there was no schema definition`;
      const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      return propertyTexturesState;
    }
    if (defined(schemaState.validatedElement)) {
      // The propertyTextures MUST be an array of at least 1 objects
      if (
        !BasicValidator.validateArray(
          propertyTexturesPath,
          "propertyTextures",
          propertyTextures,
          1,
          undefined,
          "object",
          context
        )
      ) {
        return propertyTexturesState;
      }
      // Validate each propertyTexture
      for (let i = 0; i < propertyTextures.length; i++) {
        const propertyTexture = propertyTextures[i];
        const propertyTexturePath = propertyTexturesPath + "/" + i;
        if (
          !PropertyTextureValidator.validatePropertyTexture(
            propertyTexturePath,
            propertyTexture,
            gltf,
            schemaState.validatedElement,
            context
          )
        ) {
          return propertyTexturesState;
        }
      }
    }

    // The property textures have been determined to be valid.
    // Return them as the validatedElement in the returned
    // state:
    propertyTexturesState.validatedElement = propertyTextures;
    return propertyTexturesState;
  }
}
