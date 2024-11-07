import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { BasicValidator } from "../../BasicValidator";

import { GltfData } from "../GltfData";

import { StructureValidationIssues } from "../../../issues/StructureValidationIssues";
import { TextureValidator } from "../TextureValidator";
import { NgaGpmValidatorCommon } from "../../extensions/gpm/NgaGpmValidatorCommon";

/**
 * A class for validating the `NGA_gpm_local` extension in glTF assets.
 *
 * This class assumes that the structure of the glTF asset itself
 * has already been validated (e.g. with the glTF Validator).
 *
 * @internal
 */
export class NgaGpmLocalValidator {
  /**
   * Performs the validation to ensure that the `NGA_gpm_local`
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

    let result = true;

    // Check if the NGA_gpm_local extension object
    // at the root level is present and valid
    const rootExtensions = gltf.extensions;
    if (defined(rootExtensions)) {
      const gltfGpmLocal = rootExtensions["NGA_gpm_local"];
      if (defined(gltfGpmLocal)) {
        const rootExtensionObjectIsValid =
          NgaGpmLocalValidator.validateGltfGpmLocal(
            path,
            gltfGpmLocal,
            context
          );
        if (!rootExtensionObjectIsValid) {
          result = false;
        }
      }
    }

    // Check all mesh primitives, and see whether NGA_gpm_local
    // extension object is present and valid
    const meshes = gltf.meshes;
    if (defined(meshes) && Array.isArray(meshes)) {
      for (let m = 0; m < meshes.length; m++) {
        const mesh = meshes[m];
        const primitives = mesh.primitives;
        if (defined(primitives) && Array.isArray(primitives)) {
          for (let p = 0; p < primitives.length; p++) {
            const primitive = primitives[p];

            const primitiveExtensions = primitive.extensions;
            if (defined(primitiveExtensions)) {
              const primitiveGpmLocal = primitiveExtensions["NGA_gpm_local"];
              if (defined(primitiveGpmLocal)) {
                const currentPath = path + "/meshes/" + m + "/primitives/" + p;
                const meshPrimitiveExtensionObjectIsValid =
                  NgaGpmLocalValidator.validateMeshPrimitiveGpmLocal(
                    currentPath,
                    primitiveGpmLocal,
                    gltf,
                    primitive,
                    context
                  );
                if (!meshPrimitiveExtensionObjectIsValid) {
                  result = false;
                }
              }
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Validate the given root-level NGA_gpm_local extension object
   *
   * @param path - The path for validation issues
   * @param gltfGpmLocal - The root-level NGA_gpm_local extension object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateGltfGpmLocal(
    path: string,
    gltfGpmLocal: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "NGA_gpm_local",
        gltfGpmLocal,
        context
      )
    ) {
      return false;
    }

    // Validate the storageType
    const storageType = gltfGpmLocal.storageType;
    const storageTypePath = path + "/storageType";

    // The storageType MUST be one of these valid values
    const storageTypeValues = ["Direct", "Indirect"];
    if (
      !BasicValidator.validateEnum(
        storageTypePath,
        "storageType",
        storageType,
        storageTypeValues,
        context
      )
    ) {
      // The remaining validation depends on the storageType,
      // so bail out early when it is invalid
      return false;
    }

    // The actual structure of the extension object is defined
    // with a "oneOf [ two nearly disjoint things ]", depending
    // on the storageType.
    if (storageType === "Indirect") {
      return NgaGpmLocalValidator.validateGltfGpmLocalIndirect(
        path,
        gltfGpmLocal,
        context
      );
    }
    return NgaGpmLocalValidator.validateGltfGpmLocalDirect(
      path,
      gltfGpmLocal,
      context
    );
  }

  /**
   * Validate the given root-level NGA_gpm_local extension object,
   * assuming that it already has been checked to contain the
   * `storageType === "Indirect"`.
   *
   * @param path - The path for validation issues
   * @param gltfGpmLocal - The root-level NGA_gpm_local extension object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateGltfGpmLocalIndirect(
    path: string,
    gltfGpmLocal: any,
    context: ValidationContext
  ): boolean {
    const storageType = "Indirect";
    let result = true;

    // Validate that the properties that are disallowed for
    // the storageType===Indirect are NOT defined:
    const anchorPointsDirect = gltfGpmLocal.anchorPointsDirect;
    if (defined(anchorPointsDirect)) {
      const message =
        `For storageType===${storageType}, ` +
        `the 'anchorPointsDirect' may not be defined`;
      const issue = StructureValidationIssues.DISALLOWED_VALUE_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }
    const covarianceDirectUpperTriangle =
      gltfGpmLocal.covarianceDirectUpperTriangle;
    if (defined(covarianceDirectUpperTriangle)) {
      const message =
        `For storageType===${storageType}, ` +
        `the 'covarianceDirectUpperTriangle' may not be defined`;
      const issue = StructureValidationIssues.DISALLOWED_VALUE_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    // Validate the anchorPointsIndirect
    const anchorPointsIndirect = gltfGpmLocal.anchorPointsIndirect;
    const anchorPointsIndirectPath = path + "/anchorPointsIndirect";
    if (!defined(anchorPointsIndirect)) {
      const message =
        `For storageType===${storageType}, ` +
        `the 'anchorPointsIndirect' must be defined`;
      const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    } else {
      const anchorPointsIndirectValid =
        NgaGpmLocalValidator.validateAnchorPointsIndirect(
          anchorPointsIndirectPath,
          "anchorPointsIndirect",
          anchorPointsIndirect,
          context
        );
      if (!anchorPointsIndirectValid) {
        result = false;
      }
    }

    // Validate the intraTileCorrelationGroups
    const intraTileCorrelationGroups = gltfGpmLocal.intraTileCorrelationGroups;
    const intraTileCorrelationGroupsPath = path + "/intraTileCorrelationGroups";
    if (!defined(intraTileCorrelationGroups)) {
      const message =
        `For storageType===${storageType}, ` +
        `the 'intraTileCorrelationGroups' must be defined`;
      const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    } else {
      const intraTileCorrelationGroupsValid =
        NgaGpmValidatorCommon.validateCorrelationGroups(
          intraTileCorrelationGroupsPath,
          "intraTileCorrelationGroups",
          intraTileCorrelationGroups,
          context
        );
      if (!intraTileCorrelationGroupsValid) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the given array of "anchorPointIndirect" objects
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param anchorPointsIndirect - The array of objects
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateAnchorPointsIndirect(
    path: string,
    name: string,
    anchorPointsIndirect: any,
    context: ValidationContext
  ): boolean {
    // The anchorPointsIndirect MUST be an array of objects
    if (
      !BasicValidator.validateArray(
        path,
        name,
        anchorPointsIndirect,
        undefined,
        undefined,
        "object",
        context
      )
    ) {
      return false;
    }
    let result = true;

    // Validate each anchorPointIndirect
    for (let i = 0; i < anchorPointsIndirect.length; i++) {
      const anchorPointIndirect = anchorPointsIndirect[i];
      const anchorPointIndirectPath = path + "/" + i;
      if (
        !NgaGpmLocalValidator.validateAnchorPointIndirect(
          anchorPointIndirectPath,
          name + `[${i}]`,
          anchorPointIndirect,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the given anchorPointIndirect
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param anchorPointIndirect - The anchorPointIndirect
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateAnchorPointIndirect(
    path: string,
    name: string,
    anchorPointIndirect: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(path, name, anchorPointIndirect, context)
    ) {
      return false;
    }

    let result = true;

    // Validate the position
    const position = anchorPointIndirect.position;
    const positionPath = path + "/position";

    // The position MUST be a 3-element array of numbers
    const positionValid = BasicValidator.validateArray(
      positionPath,
      "position",
      position,
      3,
      3,
      "number",
      context
    );
    if (!positionValid) {
      result = false;
    }

    // Validate the adjustmentParams
    const adjustmentParams = anchorPointIndirect.adjustmentParams;
    const adjustmentParamsPath = path + "/adjustmentParams";

    // The adjustmentParams MUST be a 3-element array of numbers
    const adjustmentParamsValid = BasicValidator.validateArray(
      adjustmentParamsPath,
      "adjustmentParams",
      adjustmentParams,
      3,
      3,
      "number",
      context
    );
    if (!adjustmentParamsValid) {
      result = false;
    }

    // Validate the covarianceMatrix
    const covarianceMatrix = anchorPointIndirect.covarianceMatrix;
    const covarianceMatrixPath = path + "/covarianceMatrix";

    // The covarianceMatrix MUST be a 6-element array of numbers
    const covarianceMatrixValid = BasicValidator.validateArray(
      covarianceMatrixPath,
      "covarianceMatrix",
      covarianceMatrix,
      6,
      6,
      "number",
      context
    );
    if (!covarianceMatrixValid) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given root-level NGA_gpm_local extension object,
   * assuming that it already has been checked to contain the
   * `storageType === "Direct"`.
   *
   * @param path - The path for validation issues
   * @param gltfGpmLocal - The root-level NGA_gpm_local extension object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateGltfGpmLocalDirect(
    path: string,
    gltfGpmLocal: any,
    context: ValidationContext
  ): boolean {
    const storageType = "Direct";
    let result = true;

    // Validate that the properties that are disallowed for
    // the storageType===Direct are NOT defined:
    const anchorPointsIndirect = gltfGpmLocal.anchorPointsIndirect;
    if (defined(anchorPointsIndirect)) {
      const message =
        `For storageType===${storageType}, ` +
        `the 'anchorPointsIndirect' may not be defined`;
      const issue = StructureValidationIssues.DISALLOWED_VALUE_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    const intraTileCorrelationGroups = gltfGpmLocal.intraTileCorrelationGroups;
    if (defined(intraTileCorrelationGroups)) {
      const message =
        `For storageType===${storageType}, ` +
        `the 'intraTileCorrelationGroups' may not be defined`;
      const issue = StructureValidationIssues.DISALLOWED_VALUE_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    // Validate the anchorPointsDirect
    const anchorPointsDirect = gltfGpmLocal.anchorPointsDirect;
    const anchorPointsDirectPath = path + "/anchorPointsDirect";
    if (!defined(anchorPointsDirect)) {
      const message =
        `For storageType===${storageType}, ` +
        `the 'anchorPointsDirect' must be defined`;
      const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    } else {
      const anchorPointsDirectValid =
        NgaGpmLocalValidator.validateAnchorPointsDirect(
          anchorPointsDirectPath,
          "anchorPointsDirect",
          anchorPointsDirect,
          context
        );
      if (!anchorPointsDirectValid) {
        result = false;
      }
    }

    // Validate the covarianceDirectUpperTriangle
    const covarianceDirectUpperTriangle =
      gltfGpmLocal.covarianceDirectUpperTriangle;
    const covarianceDirectUpperTrianglePath =
      path + "/covarianceDirectUpperTriangle";
    if (!defined(covarianceDirectUpperTriangle)) {
      const message =
        `For storageType===${storageType}, ` +
        `the 'covarianceDirectUpperTriangle' must be defined`;
      const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    } else {
      const covarianceDirectUpperTriangleValid =
        NgaGpmLocalValidator.validateCovarianceDirectUpperTriangle(
          covarianceDirectUpperTrianglePath,
          covarianceDirectUpperTriangle,
          context
        );
      if (!covarianceDirectUpperTriangleValid) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the given array of anchorPointDirect objects
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param anchorPointsDirect - The array object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateAnchorPointsDirect(
    path: string,
    name: string,
    anchorPointsDirect: any,
    context: ValidationContext
  ): boolean {
    // The anchorPointsDirect MUST be an array of objects
    if (
      !BasicValidator.validateArray(
        path,
        name,
        anchorPointsDirect,
        undefined,
        undefined,
        "object",
        context
      )
    ) {
      return false;
    }
    let result = true;

    // Validate each anchorPointDirect
    for (let i = 0; i < anchorPointsDirect.length; i++) {
      const anchorPointDirect = anchorPointsDirect[i];
      const anchorPointDirectPath = path + "/" + i;
      if (
        !NgaGpmLocalValidator.validateAnchorPointDirect(
          anchorPointDirectPath,
          name + `[${i}]`,
          anchorPointDirect,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the given anchorPointDirect
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param anchorPointDirect - The anchorPointDirect
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateAnchorPointDirect(
    path: string,
    name: string,
    anchorPointDirect: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(path, name, anchorPointDirect, context)
    ) {
      return false;
    }

    let result = true;

    // Validate the position
    const position = anchorPointDirect.position;
    const positionPath = path + "/position";

    // The position MUST be a 3-element array of numbers
    const positionValid = BasicValidator.validateArray(
      positionPath,
      "position",
      position,
      3,
      3,
      "number",
      context
    );
    if (!positionValid) {
      result = false;
    }

    // Validate the adjustmentParams
    const adjustmentParams = anchorPointDirect.adjustmentParams;
    const adjustmentParamsPath = path + "/adjustmentParams";

    // The adjustmentParams MUST be a 3-element array of numbers
    const adjustmentParamsValid = BasicValidator.validateArray(
      adjustmentParamsPath,
      "adjustmentParams",
      adjustmentParams,
      3,
      3,
      "number",
      context
    );
    if (!adjustmentParamsValid) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given covarianceDirectUpperTriangle
   *
   * @param path - The path for validation issues
   * @param covarianceDirectUpperTriangle - The covarianceDirectUpperTriangle
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateCovarianceDirectUpperTriangle(
    path: string,
    covarianceDirectUpperTriangle: any,
    context: ValidationContext
  ): boolean {
    // The covarianceDirectUpperTriangle MUST be an array of numbers
    return BasicValidator.validateArray(
      path,
      "covarianceDirectUpperTriangle",
      covarianceDirectUpperTriangle,
      undefined,
      undefined,
      "number",
      context
    );
  }

  /**
   * Validate the given mesh-primitive NGA_gpm_local extension object
   *
   * @param path - The path for validation issues
   * @param meshPrimitiveGpmLocal - The mesh-primitive NGA_gpm_local extension object
   * @param gltf - The glTF that contains this object
   * @param meshPrimitive - The mesh primitive that contains this object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateMeshPrimitiveGpmLocal(
    path: string,
    meshPrimitiveGpmLocal: any,
    gltf: any,
    meshPrimitive: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "NGA_gpm_local",
        meshPrimitiveGpmLocal,
        context
      )
    ) {
      return false;
    }

    // Validate the ppeTextures
    const ppeTextures = meshPrimitiveGpmLocal.ppeTextures;
    const ppeTexturesPath = path + "/ppeTextures";
    return NgaGpmLocalValidator.validatePpeTextures(
      ppeTexturesPath,
      "ppeTextures",
      ppeTextures,
      gltf,
      meshPrimitive,
      context
    );
  }

  /**
   * Validate the given mesh-primitive NGA_gpm_local extension object
   *
   * @param path - The path for validation issues
   * @param meshPrimitiveGpmLocal - The mesh-primitive NGA_gpm_local extension object
   * @param gltf - The glTF that contains this object
   * @param meshPrimitive - The mesh primitive that contains this object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validatePpeTextures(
    path: string,
    name: string,
    ppeTextures: any,
    gltf: any,
    meshPrimitive: any,
    context: ValidationContext
  ): boolean {
    // The ppeTextures MUST be an array of objects
    if (
      !BasicValidator.validateArray(
        path,
        name,
        ppeTextures,
        1,
        undefined,
        "object",
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate each ppeTexture
    for (let i = 0; i < ppeTextures.length; i++) {
      const ppeTexture = ppeTextures[i];
      const ppeTexturePath = path + "/" + i;
      if (
        !NgaGpmLocalValidator.validatePpeTexture(
          ppeTexturePath,
          name + `[${i}]`,
          ppeTexture,
          gltf,
          meshPrimitive,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the given ppeTexture object
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param ppeTexture - The ppeTexture object
   * @param gltf - The glTF that contains this object
   * @param meshPrimitive - The mesh primitive that contains this object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validatePpeTexture(
    path: string,
    name: string,
    ppeTexture: any,
    gltf: any,
    meshPrimitive: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, ppeTexture, context)) {
      return false;
    }

    let result = true;

    // Validate the index (this is part of the textureInfo)
    const index = ppeTexture.index;
    const indexPath = path + "/index";

    // The index MUST be defined, and must be a valid texture index
    const textures = gltf.textures ?? [];
    if (
      !BasicValidator.validateIntegerRange(
        indexPath,
        "index",
        index,
        0,
        true,
        textures.length,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate the texCoord (this is part of the textureInfo)
    const texCoord = ppeTexture.texCoord;
    const texCoordPath = path + "/texCoord";
    if (defined(texCoord)) {
      if (
        !TextureValidator.validateTexCoordForMeshPrimitive(
          texCoordPath,
          texCoord,
          meshPrimitive,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the traits
    const traits = ppeTexture.traits;
    const traitsPath = path + "/traits";
    if (
      !NgaGpmValidatorCommon.validatePpeMetadata(
        traitsPath,
        "traits",
        traits,
        context
      )
    ) {
      result = false;
    }

    // Validate the noData
    const noData = ppeTexture.noData;
    const noDataPath = path + "/noData";

    // If noData is defined, then it MUST be an integer
    if (defined(noData)) {
      if (
        !BasicValidator.validateInteger(noDataPath, "noData", noData, context)
      ) {
        result = false;
      }
    }

    // Validate the offset
    const offset = ppeTexture.offset;
    const offsetPath = path + "/offset";

    // If offset is defined, then it MUST be a number
    if (defined(offset)) {
      if (
        !BasicValidator.validateNumber(offsetPath, "offset", offset, context)
      ) {
        result = false;
      }
    }

    // Validate the scale
    const scale = ppeTexture.scale;
    const scalePath = path + "/scale";

    // If scale is defined, then it MUST be a number
    if (defined(scale)) {
      if (!BasicValidator.validateNumber(scalePath, "scale", scale, context)) {
        result = false;
      }
    }

    return result;
  }
}
