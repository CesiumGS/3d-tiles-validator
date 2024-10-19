import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { BasicValidator } from "../../BasicValidator";

import { GltfData } from "../GltfData";

import { StructureValidationIssues } from "../../../issues/StructureValidationIssues";
import { TextureValidator } from "../TextureValidator";


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
        NgaGpmLocalValidator.validateIntraTileCorrelationGroups(
          intraTileCorrelationGroupsPath,
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
   * @param anchorPointsIndirect - The array of objects
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateAnchorPointsIndirect(
    path: string,
    anchorPointsIndirect: any,
    context: ValidationContext
  ): boolean {
    // The anchorPointsIndirect MUST be an array of objects
    if (
      !BasicValidator.validateArray(
        path,
        "anchorPointsIndirect",
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
   * @param anchorPointIndirect - The anchorPointIndirect
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateAnchorPointIndirect(
    path: string,
    anchorPointIndirect: any,
    context: ValidationContext
  ): boolean {
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
   * Validate the given array of "correlationGroup" objects that
   * have been found as the intraTileCorrelationGroups
   *
   * @param path - The path for validation issues
   * @param intraTileCorrelationGroups - The array of objects
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateIntraTileCorrelationGroups(
    path: string,
    intraTileCorrelationGroups: any,
    context: ValidationContext
  ): boolean {
    // The intraTileCorrelationGroups MUST be an array of at most 3 objects
    if (
      !BasicValidator.validateArray(
        path,
        "intraTileCorrelationGroups",
        intraTileCorrelationGroups,
        0,
        3,
        "object",
        context
      )
    ) {
      return false;
    }
    let result = true;

    // Validate each correlationGroup
    for (let i = 0; i < intraTileCorrelationGroups.length; i++) {
      const correlationGroup = intraTileCorrelationGroups[i];
      const correlationGroupPath = path + "/" + i;
      if (
        !NgaGpmLocalValidator.validateCorrelationGroup(
          correlationGroupPath,
          correlationGroup,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the given correlationGroup
   *
   * @param path - The path for validation issues
   * @param correlationGroup - The correlationGroup
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateCorrelationGroup(
    path: string,
    correlationGroup: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate the groupFlags
    const groupFlags = correlationGroup.groupFlags;
    const groupFlagsPath = path + "/groupFlags";

    // The groupFlags MUST be a 3-element array of booleans
    const groupFlagsValid = BasicValidator.validateArray(
      groupFlagsPath,
      "groupFlags",
      groupFlags,
      3,
      3,
      "boolean",
      context
    );
    if (!groupFlagsValid) {
      result = false;
    }

    // Validate the rotationThetas
    const rotationThetas = correlationGroup.rotationThetas;
    const rotationThetasPath = path + "/rotationThetas";

    // The rotationThetas MUST be a 3-element array of numbers
    const rotationThetasValid = BasicValidator.validateArray(
      rotationThetasPath,
      "rotationThetas",
      rotationThetas,
      3,
      3,
      "number",
      context
    );
    if (!rotationThetasValid) {
      result = false;
    }

    // Validate the params
    const params = correlationGroup.params;
    const paramsPath = path + "/params";

    // The params MUST be a 3-element array of objects
    if (
      !BasicValidator.validateArray(
        paramsPath,
        "params",
        params,
        3,
        3,
        "object",
        context
      )
    ) {
      result = false;
    } else {
      // Validate each param (an SPDCF)
      for (let i = 0; i < params.length; i++) {
        const param = params[i];
        const paramPath = path + "/" + i;
        if (!NgaGpmLocalValidator.validateSpdcf(paramPath, param, context)) {
          result = false;
        }
      }
    }
    return result;
  }

  /**
   * Validate the given SPDCF (Strictly Positive-Definite Correlation Function)
   *
   * @param path - The path for validation issues
   * @param spdcf - The SPDCF
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateSpdcf(
    path: string,
    spdcf: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Sorry about the names here. I'm trying to be consistent...

    // Validate the A
    const A = spdcf.A;
    const APath = path + "/A";

    // The A MUST be a number in (0, 1]
    const AValid = BasicValidator.validateNumberRange(
      APath,
      "A",
      A,
      0,
      false,
      1,
      true,
      context
    );
    if (!AValid) {
      result = false;
    }

    // Validate the alpha
    const alpha = spdcf.alpha;
    const alphaPath = path + "/alpha";

    // The alpha MUST be a number in [0, 1)
    const alphaValid = BasicValidator.validateNumberRange(
      alphaPath,
      "alpha",
      alpha,
      0,
      true,
      1,
      false,
      context
    );
    if (!alphaValid) {
      result = false;
    }

    // Validate the beta
    const beta = spdcf.beta;
    const betaPath = path + "/beta";

    // The beta MUST be a number in [0, 10]
    const betaValid = BasicValidator.validateNumberRange(
      betaPath,
      "beta",
      beta,
      0,
      true,
      10,
      true,
      context
    );
    if (!betaValid) {
      result = false;
    }

    // Validate the T
    const T = spdcf.T;
    const TPath = path + "/T";

    // The T MUST be a number in (0, +Inf)
    const TValid = BasicValidator.validateNumberRange(
      TPath,
      "T",
      T,
      0,
      false,
      undefined,
      false,
      context
    );
    if (!TValid) {
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

  private static validateAnchorPointsDirect(
    path: string,
    anchorPointsDirect: any,
    context: ValidationContext
  ): boolean {
    // The anchorPointsDirect MUST be an array of objects
    if (
      !BasicValidator.validateArray(
        path,
        "anchorPointsDirect",
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
   * @param anchorPointDirect - The anchorPointDirect
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateAnchorPointDirect(
    path: string,
    anchorPointDirect: any,
    context: ValidationContext
  ): boolean {
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

    // The ppeTextures MUST be an array of objects
    if (
      !BasicValidator.validateArray(
        ppeTexturesPath,
        "ppeTextures",
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
   * @param ppeTexture - The ppeTexture object
   * @param gltf - The glTF that contains this object
   * @param meshPrimitive - The mesh primitive that contains this object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validatePpeTexture(
    path: string,
    ppeTexture: any,
    gltf: any,
    meshPrimitive: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(path, "ppeTexture", ppeTexture, context)
    ) {
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
      !NgaGpmLocalValidator.validatePpeMetadata(traitsPath, traits, context)
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

  /**
   * Validate the given ppeMetadata object
   *
   * @param path - The path for validation issues
   * @param ppeMetadata - The ppeMetadata object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validatePpeMetadata(
    path: string,
    ppeMetadata: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(path, "ppeMetadata", ppeMetadata, context)
    ) {
      return false;
    }

    let result = true;

    // Validate the source
    const source = ppeMetadata.source;
    const sourcePath = path + "/source";

    // The source MUST be one of these valid values
    const sourceValues = [
      "SIGX",
      "SIGY",
      "SIGZ",
      "VARX",
      "VARY",
      "VARZ",
      "SIGR",
    ];
    if (
      !BasicValidator.validateEnum(
        sourcePath,
        "source",
        source,
        sourceValues,
        context
      )
    ) {
      result = false;
    }

    // Validate the min
    const min = ppeMetadata.min;
    const minPath = path + "/min";

    // If min is defined, then it MUST be a number
    if (defined(min)) {
      if (!BasicValidator.validateNumber(minPath, "min", min, context)) {
        result = false;
      }
    }

    // Validate the max
    const max = ppeMetadata.max;
    const maxPath = path + "/max";

    // If max is defined, then it MUST be a number
    if (defined(max)) {
      if (!BasicValidator.validateNumber(maxPath, "max", max, context)) {
        result = false;
      }
    }

    return result;
  }
}
