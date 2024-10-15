import { Schema, defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { BasicValidator } from "../../BasicValidator";
import { ValidatedElement } from "../../ValidatedElement";

import { GltfData } from "../GltfData";
import { PropertyTexturesDefinitionValidator } from "./PropertyTexturesDefinitionValidator";
import { PropertyAttributesDefinitionValidator } from "./PropertyAttributesDefinitionValidator";
import { PropertyTextureValuesValidator } from "./PropertyTextureValuesValidator";

import { SchemaDefinitionValidator } from "../../metadata/SchemaDefinitionValidator";
import { PropertyTablesDefinitionValidator } from "../../metadata/PropertyTablesDefinitionValidator";

import { GltfExtensionValidationIssues } from "../../../issues/GltfExtensionValidationIssues";
import { JsonValidationIssues } from "../../../issues/JsonValidationIssues";
import { PropertyAttributeValuesValidator } from "./PropertyAttributeValuesValidator";

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
    let result = true;

    // Try to find and validate the top-level extension object.
    let schema = undefined;
    let gltfStructuralMetadata = undefined;

    const gltf = gltfData.gltf;
    const extensions = gltf.extensions;
    if (extensions) {
      const structuralMetadata = extensions["EXT_structural_metadata"];
      if (structuralMetadata) {
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

        // The schema or schemaUri MUST be present
        if (!schemaState.wasPresent) {
          const issue = JsonValidationIssues.ANY_OF_ERROR(
            path,
            "structuralMetadata",
            "schema",
            "schemaUri"
          );
          context.addIssue(issue);
          return false;
        }

        // Bail out early if there was a schema definition, but the schema
        // itself was not valid
        if (schemaState.wasPresent && !defined(schemaState.validatedElement)) {
          return false;
        }

        const structuralMetadataValid =
          await ExtStructuralMetadataValidator.validateTopLevelStructuralMetadata(
            path,
            structuralMetadata,
            schemaState,
            gltfData,
            context
          );

        // Bail out early if the top-level extension object is invalid.
        if (!structuralMetadataValid) {
          return false;
        }
        gltfStructuralMetadata = structuralMetadata;
        schema = schemaState.validatedElement;
      }
    }

    // Dive into the mesh primitives of the glTF, and check if they
    // contain EXT_structural_metadata extension objects
    const meshes = gltf.meshes;
    if (meshes) {
      if (Array.isArray(meshes)) {
        for (let m = 0; m < meshes.length; m++) {
          const mesh = meshes[m];
          const primitives = mesh.primitives;
          if (!primitives) {
            continue;
          }
          if (!Array.isArray(primitives)) {
            continue;
          }
          for (let p = 0; p < primitives.length; p++) {
            const primitive = primitives[p];
            if (!primitive) {
              continue;
            }
            const extensions = primitive.extensions;
            if (!extensions) {
              continue;
            }
            const extensionObject = extensions["EXT_structural_metadata"];
            if (defined(extensionObject)) {
              // When there is an extension object in one of the mesh
              // primitives, and there was no top-level extension object,
              // then bail out: There is no need to report the missing
              // top-level object multiple times.
              if (!defined(gltfStructuralMetadata)) {
                const message =
                  `The primitive ${p} of mesh ${m} uses the ` +
                  `EXT_structural_metadata extension, but ` +
                  `no top-level EXT_structural_metadata ` +
                  `object was found.`;
                const issue =
                  GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
                    path,
                    message
                  );
                context.addIssue(issue);
                return false;
              }

              // Here, the `gltfStructuralMetadata` and the `schema`
              // have been validated
              const objectIsValid =
                await ExtStructuralMetadataValidator.validateMeshPrimitiveStructuralMetadata(
                  path,
                  extensionObject,
                  primitive,
                  m,
                  p,
                  schema!,
                  gltfStructuralMetadata,
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
    }

    return result;
  }

  /**
   * Validate the given top-level EXT_structural_metadata extension object
   * that was found in the given glTF.
   *
   * @param path - The path for validation issues
   * @param structuralMetadata - The EXT_structural_metadata extension object
   * @param schemaState - The object holding information about the presence
   * and validity of the schema
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static async validateTopLevelStructuralMetadata(
    path: string,
    structuralMetadata: any,
    schemaState: ValidatedElement<Schema>,
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

    const gltf = gltfData.gltf;
    const numBufferViews = defaultValue(gltf.bufferViews?.length, 0);

    // Validate the property tables definition
    const propertyTablesState =
      PropertyTablesDefinitionValidator.validatePropertyTablesDefinition(
        path,
        "structuralMetadata",
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
        "structuralMetadata",
        structuralMetadata.propertyTextures,
        gltf,
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

    // Validate the property attributes definition
    const propertyAttributesState =
      PropertyAttributesDefinitionValidator.validatePropertyAttributesDefinition(
        path,
        "structuralMetadata",
        structuralMetadata.propertyAttributes,
        schemaState,
        context
      );

    // When there was a property attributes definition, but the
    // property attributes are not valid, then the overall result
    // is invalid
    if (
      propertyAttributesState.wasPresent &&
      !defined(propertyAttributesState.validatedElement)
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given EXT_structural_metadata extension object
   * that was found in the given mesh primitive.
   *
   * @param path - The path for validation issues
   * @param meshPrimitiveStructuralMetadata - The EXT_mesh_features
   * extension object that was found in the mesh primitive
   * @param meshPrimitive - The mesh primitive that contained
   * the extension object
   * @param meshIndex - The index of the mesh (only for details
   * in validation messages)
   * @param primitiveIndex - The index of the primitive (only for details
   * in validation messages)
   * @param schema - The metadata schema
   * @param gltfStructuralMetadata - The EXT_mesh_features object
   * that was found at the top level in the glTF asset
   * @param gltfData - The glTF data
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static async validateMeshPrimitiveStructuralMetadata(
    path: string,
    meshPrimitiveStructuralMetadata: any,
    meshPrimitive: any,
    meshIndex: number,
    primitiveIndex: number,
    schema: Schema,
    gltfStructuralMetadata: any,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "structuralMetadata",
        meshPrimitiveStructuralMetadata,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the propertyTextures
    const numPropertyTextures =
      gltfStructuralMetadata.propertyTextures?.length ?? 0;
    const propertyTextures = meshPrimitiveStructuralMetadata.propertyTextures;
    const propertyTexturesPath = path + "/propertyTextures";
    if (defined(propertyTextures)) {
      // The propertyTextures MUST be an an array of at least 1 index
      if (
        !BasicValidator.validateIndexArray(
          propertyTexturesPath,
          "propertyTextures",
          propertyTextures,
          numPropertyTextures,
          context
        )
      ) {
        result = false;
      } else {
        for (let i = 0; i < propertyTextures.length; i++) {
          const propertyTexturePath = propertyTexturesPath + "/" + i;
          const propertyTextureIndex = propertyTextures[i];
          const propertyTextureValuesValid =
            await PropertyTextureValuesValidator.validatePropertyTextureValues(
              propertyTexturePath,
              propertyTextureIndex,
              meshPrimitive,
              meshIndex,
              primitiveIndex,
              schema,
              gltfStructuralMetadata,
              gltfData,
              context
            );
          if (!propertyTextureValuesValid) {
            result = false;
          }
        }
      }
    }

    // Validate the propertyAttributes
    const numPropertyAttributes =
      gltfStructuralMetadata.propertyAttributes?.length ?? 0;
    const propertyAttributes =
      meshPrimitiveStructuralMetadata.propertyAttributes;
    const propertyAttributesPath = path + "/propertyAttributes";
    if (defined(propertyAttributes)) {
      // The propertyAttributes MUST be an an array of at least 1 index
      if (
        !BasicValidator.validateIndexArray(
          propertyAttributesPath,
          "propertyAttributes",
          propertyAttributes,
          numPropertyAttributes,
          context
        )
      ) {
        result = false;
      } else {
        for (let i = 0; i < propertyAttributes.length; i++) {
          const propertyAttributePath = propertyAttributesPath + "/" + i;
          const propertyAttributeIndex = propertyAttributes[i];
          const propertyAttributeValuesValid =
            await PropertyAttributeValuesValidator.validatePropertyAttributeValues(
              propertyAttributePath,
              propertyAttributeIndex,
              meshPrimitive,
              meshIndex,
              primitiveIndex,
              schema,
              gltfStructuralMetadata,
              gltfData,
              context
            );
          if (!propertyAttributeValuesValid) {
            result = false;
          }
        }
      }
    }

    return result;
  }
}
