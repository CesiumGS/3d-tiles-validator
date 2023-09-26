import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "./../ValidationContext";
import { BasicValidator } from "./../BasicValidator";

import { GltfData } from "./GltfData";
import { PropertyTexturesDefinitionValidator } from "./PropertyTexturesDefinitionValidator";

import { SchemaDefinitionValidator } from "../metadata/SchemaDefinitionValidator";
import { PropertyTablesDefinitionValidator } from "../metadata/PropertyTablesDefinitionValidator";

/**
 * A class for validating the `EXT_structural_metadata` extension in
 * glTF assets.
 *
 * This class assumes that the structure of the glTF asset itself
 * has already been validated (e.g. with the glTF Validator).
 *
 * @internal
 */
export class ExtStructuralMetadataValidator {
  /**
   * Performs the validation to ensure that the `EXT_structural_metadata`
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
    // glTF, to find the extension objects.

    const extensions = gltf.extensions;
    if (!extensions) {
      return true;
    }
    const structuralMetadata = extensions["EXT_structural_metadata"];
    if (structuralMetadata) {
      const structuralMetadataValid =
        await ExtStructuralMetadataValidator.validateStructuralMetadata(
          path,
          structuralMetadata,
          gltfData,
          context
        );
      if (!structuralMetadataValid) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate the given top-level EXT_structural_metadata extension object
   * that was found in the given glTF.
   *
   * @param path - The path for validation issues
   * @param meshFeatures - The EXT_mesh_features extension object
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static async validateStructuralMetadata(
    path: string,
    structuralMetadata: any,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "structuralMetadata",
        structuralMetadata,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the schema definition, consisting of the
    // `schema` or `schemaUri`
    const schemaState =
      await SchemaDefinitionValidator.validateSchemaDefinition(
        path,
        "structuralMetadata",
        structuralMetadata.schema,
        structuralMetadata.schemaUri,
        context
      );

    // When there was a schema definition, but the schema
    // itself was not valid, then the overall result
    // is invalid
    if (schemaState.wasPresent && !defined(schemaState.validatedElement)) {
      result = false;
    }

    const gltf = gltfData.gltf;
    const numBufferViews = defaultValue(gltf.bufferViews?.length, 0);

    // Validate the property tables definition
    const propertyTablesState =
      PropertyTablesDefinitionValidator.validatePropertyTablesDefinition(
        path,
        "structural metadata extension object",
        structuralMetadata.propertyTables,
        numBufferViews,
        schemaState,
        context
      );

    // When there was a property tables definition, but the
    // property tables are not valid, then the overall result
    // is invalid
    if (
      propertyTablesState.wasPresent &&
      !defined(propertyTablesState.validatedElement)
    ) {
      result = false;
    }

    // Validate the property textures definition
    const propertyTexturesState =
      PropertyTexturesDefinitionValidator.validatePropertyTexturesDefinition(
        path,
        "structural metadata extension object",
        structuralMetadata.propertyTextures,
        numBufferViews,
        schemaState,
        context
      );

    // When there was a property textures definition, but the
    // property textures are not valid, then the overall result
    // is invalid
    if (
      propertyTexturesState.wasPresent &&
      !defined(propertyTexturesState.validatedElement)
    ) {
      result = false;
    }

    return result;
  }
}
