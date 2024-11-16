import { defined } from "3d-tiles-tools";

import { Validator } from "../Validator";
import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { StringValidator } from "../StringValidator";
import { RootPropertyValidator } from "../RootPropertyValidator";
import { ExtendedObjectsValidators } from "../ExtendedObjectsValidators";

import { JsonValidationIssues } from "../../issues/JsonValidationIssues";
import { StructureValidationIssues } from "../../issues/StructureValidationIssues";

import { NgaGpmValidatorCommon } from "./gpm/NgaGpmValidatorCommon";
import { NgaGpmValidationIssues } from "./gpm/NgaGpmValidationIssues";

/**
 * EPSG codes for WGS84 CRS realizations, as defined in the
 * epsgEcef structure of the schema.
 */
enum EpsgEcefCodes {
  G2139 = 9753,
  G1762 = 7664,
  G1674 = 7662,
  G1150 = 7660,
  G873 = 7658,
  G730 = 7656,
  Generic = 4978,
}

/**
 * The epsilon for the validation of the length of unit vectors.
 *
 * When the length (magnitude) of a unit vector deviates by more
 * than this epsilon from 1.0, then this is considered to be
 * a validation error.
 */
const UNIT_VECTOR_LENGTH_EPSILON = 0.00001;

/**
 * The epsilon for the validation orthogonality unit vectors.
 *
 * When the absolute dot product between two unit vectors
 * is greater than this epsilon, then this is considered
 * to be a validation error.
 */
const ORTHOGONAL_VECTORS_DOT_PRODUCT_EPSILON = 0.0005;

/**
 * A class for the validation of `NGA_gpm` extension objects
 *
 * @internal
 */
export class NgaGpmValidator implements Validator<any> {
  /**
   * Performs the validation of a `Tileset` object that may
   * contain a `NGA_gpm` extension object.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param tileset - The tileset that may contain the extension object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  async validateObject(
    path: string,
    tileset: any,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "tileset", tileset, context)) {
      return false;
    }

    let result = true;

    // If there is a NGA_gpm extension, perform the
    // validation of the corresponding object
    const extensions = tileset.extensions;
    if (defined(extensions)) {
      const ngaGpm = extensions["NGA_gpm"];
      const ngaGpmPath = path + "/NGA_gpm";

      // If the extension object is not an object, then a validation
      // issue was already added when validating the extension objects
      // of the tileset, when it was validated to be a root property.
      if (defined(ngaGpm) && typeof ngaGpm === "object") {
        const numContentsInRootNode =
          NgaGpmValidator.computeNumContentsInRootNode(tileset);
        if (
          !NgaGpmValidator.validateNgaGpm(
            ngaGpmPath,
            "NGA_gpm",
            ngaGpm,
            numContentsInRootNode,
            context
          )
        ) {
          result = false;
        }
      }
    }

    return result;
  }

  /**
   * Returns the number of contents in the root node of the given
   * tileset. The given object is not defined, does not have a
   * root, or the root does not have contents, then 0 is returned.
   *
   * @param tileset - The tileset
   * @returns The number of contents in the root node
   */
  private static computeNumContentsInRootNode(tileset: any) {
    if (!defined(tileset)) {
      return 0;
    }
    const root = tileset.root;
    if (!defined(root)) {
      return 0;
    }
    const content = root.content;
    if (defined(content)) {
      return 1;
    }
    const contents = root.contents;
    if (Array.isArray(contents)) {
      return contents.length;
    }
    return 0;
  }

  /**
   * Performs the validation to ensure that the given object is a
   * valid `NGA_gpm` object.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param name - The name of the object
   * @param object - The object to validate
   * @param numContentsInRootNode - The number of contents in the root
   * node of the tileset. This is required for validating the 'contentIndex'
   * if the 'anchorPointMetadata'
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateNgaGpm(
    path: string,
    name: string,
    object: any,
    numContentsInRootNode: number,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, object, context)) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(path, name, object, context)
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(path, object, context)
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(object)) {
      return result;
    }

    // Validate the masterRecord
    const masterRecord = object.masterRecord;
    const masterRecordPath = path + "/masterRecord";
    if (
      !NgaGpmValidator.validateMasterRecord(
        masterRecordPath,
        "masterRecord",
        masterRecord,
        context
      )
    ) {
      result = false;
    }

    // Validate the unmodeledErrorRecord
    const unmodeledErrorRecord = object.unmodeledErrorRecord;
    const unmodeledErrorRecordPath = path + "/unmodeledErrorRecord";
    if (
      !NgaGpmValidator.validateUnmodeledError(
        unmodeledErrorRecordPath,
        "unmodeledErrorRecord",
        unmodeledErrorRecord,
        context
      )
    ) {
      result = false;
    }

    // Validate the interpolationParams
    const interpolationParams = object.interpolationParams;
    const interpolationParamsPath = path + "/interpolationParams";
    if (
      !NgaGpmValidator.validateInterpolationParams(
        interpolationParamsPath,
        "interpolationParams",
        interpolationParams,
        context
      )
    ) {
      result = false;
    }

    // Validate the interTileCorrelationGroups
    const interTileCorrelationGroups = object.interTileCorrelationGroups;
    const interTileCorrelationGroupsPath = path + "/interTileCorrelationGroups";
    if (
      !NgaGpmValidatorCommon.validateCorrelationGroups(
        interTileCorrelationGroupsPath,
        "interTileCorrelationGroups",
        interTileCorrelationGroups,
        context
      )
    ) {
      result = false;
    }

    // Validate the threeDimConformalParams
    const threeDimConformalParams = object.threeDimConformalParams;
    const threeDimConformalParamsPath = path + "/threeDimConformalParams";
    if (defined(threeDimConformalParams)) {
      if (
        !NgaGpmValidator.validateThreeDimensionalConformal(
          threeDimConformalParamsPath,
          "threeDimConformalParams",
          threeDimConformalParams,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the ppeManifest
    const ppeManifest = object.ppeManifest;
    const ppeManifestPath = path + "/ppeManifest";
    if (defined(ppeManifest)) {
      if (
        !NgaGpmValidator.validatePpeManifest(
          ppeManifestPath,
          "ppeManifest",
          ppeManifest,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the anchorPointMetadata
    const anchorPointMetadata = object.anchorPointMetadata;
    const anchorPointMetadataPath = path + "/anchorPointMetadata";
    if (defined(anchorPointMetadata)) {
      if (
        !NgaGpmValidator.validateAnchorPointMetadata(
          anchorPointMetadataPath,
          "anchorPointMetadata",
          anchorPointMetadata,
          numContentsInRootNode,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validate the given masterRecord
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param masterRecord - The masterRecord
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateMasterRecord(
    path: string,
    name: string,
    masterRecord: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, masterRecord, context)) {
      return false;
    }

    let result = true;

    // Validate the version
    const version = masterRecord.version;
    const versionPath = path + "/version";
    if (
      !BasicValidator.validateString(versionPath, "version", version, context)
    ) {
      result = false;
    }

    // Validate the implementation
    const implementation = masterRecord.implementation;
    const implementationPath = path + "/implementation";
    if (
      !BasicValidator.validateString(
        implementationPath,
        "implementation",
        implementation,
        context
      )
    ) {
      result = false;
    }

    // Validate the modelCoordSystem
    const modelCoordSystem = masterRecord.modelCoordSystem;
    const modelCoordSystemPath = path + "/modelCoordSystem";
    if (
      !NgaGpmValidator.validateModelCoordSystem(
        modelCoordSystemPath,
        "modelCoordSystem",
        modelCoordSystem,
        context
      )
    ) {
      result = false;
    }

    // Validate the idInformation
    const idInformation = masterRecord.idInformation;
    const idInformationPath = path + "/idInformation";
    if (
      !NgaGpmValidator.validateIdInformation(
        idInformationPath,
        "idInformation",
        idInformation,
        context
      )
    ) {
      result = false;
    }

    // Validate the datasetExtentInformation
    const datasetExtentInformation = masterRecord.datasetExtentInformation;
    const datasetExtentInformationPath = path + "/datasetExtentInformation";
    if (defined(datasetExtentInformation)) {
      if (
        !NgaGpmValidator.validateExtentInformation(
          datasetExtentInformationPath,
          "datasetExtentInformation",
          datasetExtentInformation,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the collectionRecordList
    const collectionRecordList = masterRecord.collectionRecordList;
    const collectionRecordListPath = path + "/collectionRecordList";
    if (defined(collectionRecordList)) {
      if (
        !NgaGpmValidator.validateCollectionRecordList(
          collectionRecordListPath,
          "collectionRecordList",
          collectionRecordList,
          context
        )
      ) {
        result = false;
      }
    }

    return result;
  }

  /**
   * Validate the given modelCoordSystem
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param modelCoordSystem - The modelCoordSystem
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateModelCoordSystem(
    path: string,
    name: string,
    modelCoordSystem: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, modelCoordSystem, context)) {
      return false;
    }

    // Validate the mcsType
    const mcsType = modelCoordSystem.mcsType;
    const mcsTypePath = path + "/mcsType";

    // The mcsType MUST be one of these valid values
    const mcsTypeValues = ["ECEF", "LSR", "UTM"];
    if (
      !BasicValidator.validateEnum(
        mcsTypePath,
        "mcsType",
        mcsType,
        mcsTypeValues,
        context
      )
    ) {
      // The remaining validation depends on the mcsType,
      // so bail out early when it is invalid
      return false;
    }

    // The actual structure of the object is defined
    // with a "oneOf [ nearly disjoint things ]", depending
    // on the mcsType.
    if (mcsType === "ECEF") {
      return NgaGpmValidator.validateModelCoordSystemEcef(
        path,
        modelCoordSystem,
        context
      );
    }
    if (mcsType === "UTM") {
      return NgaGpmValidator.validateModelCoordSystemUtm(
        path,
        modelCoordSystem,
        context
      );
    }
    return NgaGpmValidator.validateModelCoordSystemLsr(
      path,
      modelCoordSystem,
      context
    );
  }

  /**
   * Validate the given modelCoordSystem, assuming that it
   * did contain the `mcsType === ECEF`
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param modelCoordSystem - The modelCoordSystem
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateModelCoordSystemEcef(
    path: string,
    modelCoordSystem: any,
    context: ValidationContext
  ): boolean {
    // Value was already validated to be an object
    // in validateModelCoordSystem

    let result = true;

    // Validate the crsEcef
    const crsEcef = modelCoordSystem.crsEcef;
    const crsEcefPath = path + "/crsEcef";
    if (
      !NgaGpmValidator.validateEpsgEcef(
        crsEcefPath,
        "crsEcef",
        crsEcef,
        context
      )
    ) {
      result = false;
    }
    return result;
  }

  /**
   * Validate the given epsgEcef
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param epsgEcef - The epsgEcef
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateEpsgEcef(
    path: string,
    name: string,
    epsgEcef: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, epsgEcef, context)) {
      return false;
    }

    // Validate the id
    const id = epsgEcef.id;
    const idPath = path + "/id";

    // The id MUST be one of these valid values
    const idValues = [
      EpsgEcefCodes.G2139,
      EpsgEcefCodes.G1762,
      EpsgEcefCodes.G1674,
      EpsgEcefCodes.G1150,
      EpsgEcefCodes.G873,
      EpsgEcefCodes.G730,
      EpsgEcefCodes.Generic,
    ];
    if (!BasicValidator.validateEnum(idPath, "id", id, idValues, context)) {
      return false;
    }
    return true;
  }

  /**
   * Validate the given modelCoordSystem, assuming that it
   * did contain the `mcsType === UTM`
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param modelCoordSystem - The modelCoordSystem
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateModelCoordSystemUtm(
    path: string,
    modelCoordSystem: any,
    context: ValidationContext
  ): boolean {
    // Value was already validated to be an object
    // in validateModelCoordSystem

    let result = true;

    // Validate the crsHorizontalUtm
    const crsHorizontalUtm = modelCoordSystem.crsHorizontalUtm;
    const crsHorizontalUtmPath = path + "/crsHorizontalUtm";
    if (
      !NgaGpmValidator.validateEpsgUtm(
        crsHorizontalUtmPath,
        "crsHorizontalUtm",
        crsHorizontalUtm,
        context
      )
    ) {
      result = false;
    }

    // Validate the crsVertical
    const crsVertical = modelCoordSystem.crsVertical;
    const crsVerticalPath = path + "/crsVertical";
    if (
      !NgaGpmValidator.validateReferenceSystem(
        crsVerticalPath,
        "crsVertical",
        crsVertical,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given epsgUtm
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param epsgUtm - The epsgUtm
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateEpsgUtm(
    path: string,
    name: string,
    epsgUtm: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, epsgUtm, context)) {
      return false;
    }

    // Validate the id
    const id = epsgUtm.id;
    const idPath = path + "/id";

    // The id MUST be a number
    if (!BasicValidator.validateNumber(idPath, "id", id, context)) {
      return false;
    }

    // The valid range for the id is described as
    // anyOf {
    //   [32601, 32660]
    //   [32701, 32760]
    // }
    //
    const isInRangeA = id >= 32601 && id <= 32601;
    const isInRangeB = id >= 32701 && id <= 32760;
    if (!isInRangeA && !isInRangeB) {
      const message =
        `The 'id' property must be in [32601, 32660] or ` +
        `in [32701, 32760], but is ${id}`;
      const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(path, message);
      context.addIssue(issue);
      return false;
    }
    return true;
  }

  /**
   * Validate the given referenceSystem
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param referenceSystem - The referenceSystem
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateReferenceSystem(
    path: string,
    referenceSystemName: string,
    referenceSystem: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        referenceSystemName,
        referenceSystem,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the name
    const name = referenceSystem.name;
    const namePath = path + "/name";

    // The name MUST be a string
    if (!BasicValidator.validateString(namePath, "name", name, context)) {
      result = false;
    }

    // Validate the description
    const description = referenceSystem.description;
    const descriptionPath = path + "/description";

    // If the description is defined, then it MUST be a string
    if (defined(description)) {
      if (
        !BasicValidator.validateString(
          descriptionPath,
          "description",
          description,
          context
        )
      ) {
        result = false;
      }
    }

    // Both the name and the description MUST be "human readable".
    // Not gonna try and validate that...

    // The structure requires one of two combinations of
    // properties to be present:
    //
    // The organization + systemId (e.g. EPSG 4978)
    //   required  : [name, orgWithId, epoch]
    //   disallowed: [definition]
    // The definition, as a a WKT 2 string
    //   required  : [name, definition]
    //   disallowed: [orgWithId]
    //
    // The name is always required, and already checked above.
    // So fetch the other properties, and check for these combinations:

    const orgWithId = referenceSystem.orgWithId;
    const orgWithIdPath = path + "/orgWithId";

    const definition = referenceSystem.definition;
    const definitionPath = path + "/definition";

    const epoch = referenceSystem.epoch;
    const epochPath = path + "/epoch";

    if (defined(orgWithId) && defined(epoch)) {
      if (defined(definition)) {
        const message =
          `When the reference system defines 'orgWithId' and 'epoch', ` +
          `then it may not define 'definition'`;
        const issue = StructureValidationIssues.DISALLOWED_VALUE_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }

      // Validate the orgWithId
      if (
        !NgaGpmValidator.validateOrganizationSystemIdPair(
          orgWithIdPath,
          "orgWithId",
          orgWithId,
          context
        )
      ) {
        result = false;
      }

      // Validate the epoch
      // The epoch MUST be a number
      if (!BasicValidator.validateNumber(epochPath, "epoch", epoch, context)) {
        result = false;
      }
    } else if (defined(definition)) {
      if (defined(orgWithId)) {
        const message =
          `When the reference system defines 'definition', ` +
          `then it may not define 'orgWithId'`;
        const issue = StructureValidationIssues.DISALLOWED_VALUE_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }

      if (defined(epoch)) {
        const message =
          `When the reference system defines 'definition', ` +
          `then it may not define 'epoch'`;
        const issue = StructureValidationIssues.DISALLOWED_VALUE_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }

      // Validate the definition
      // The definition MUST be a string
      if (
        !BasicValidator.validateString(
          definitionPath,
          "definition",
          definition,
          context
        )
      ) {
        result = false;
      }

      // The definition MUST be a WKT (Well-Known-Text) string.
      // This cannot sensibly be validated here for now.
    } else {
      const message =
        `The reference system must either define the ` +
        `'orgWithId' and 'epoch', or the 'definition'`;
      const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    return result;
  }

  /**
   * Validate the given organizationSystemIdPair
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param organizationSystemIdPair - The organizationSystemIdPair
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateOrganizationSystemIdPair(
    path: string,
    name: string,
    organizationSystemIdPair: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        name,
        organizationSystemIdPair,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the organization
    const organization = organizationSystemIdPair.organization;
    const organizationPath = path + "/organization";

    // The organization MUST be a string
    if (
      !BasicValidator.validateString(
        organizationPath,
        "organization",
        organization,
        context
      )
    ) {
      result = false;
    }

    // Validate the systemId
    const systemId = organizationSystemIdPair.systemId;
    const systemIdPath = path + "/systemId";

    // The systemId MUST be a string
    if (
      !BasicValidator.validateString(
        systemIdPath,
        "systemId",
        systemId,
        context
      )
    ) {
      result = false;
    }
    return result;
  }

  /**
   * Validate the given modelCoordSystem, assuming that it
   * did contain the `mcsType === LSR`
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param masterRecord - The modelCoordSystem
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateModelCoordSystemLsr(
    path: string,
    modelCoordSystem: any,
    context: ValidationContext
  ): boolean {
    // Value was already validated to be an object
    // in validateModelCoordSystem

    let result = true;

    // Validate the origin
    const origin = modelCoordSystem.origin;
    const originPath = path + "/origin";
    if (
      !NgaGpmValidator.validateEcefCoord(originPath, "origin", origin, context)
    ) {
      result = false;
    }

    // Validate the axisUnitVectors
    const axisUnitVectors = modelCoordSystem.axisUnitVectors;
    const axisUnitVectorsPath = path + "/axisUnitVectors";
    if (
      !NgaGpmValidator.validateUnitVectors(
        axisUnitVectorsPath,
        "axisUnitVectors",
        axisUnitVectors,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given ecefCoord
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param ecefCoord - The ecefCoord
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateEcefCoord(
    path: string,
    name: string,
    ecefCoord: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, ecefCoord, context)) {
      return false;
    }

    let result = true;

    // Validate the coordinates
    const coordinates = ecefCoord.coordinates;
    const coordinatesPath = path + "/coordinates";
    if (
      !NgaGpmValidator.validatePoint3d(
        coordinatesPath,
        "coordinates",
        coordinates,
        context
      )
    ) {
      result = false;
    }

    // Validate the crsEcef
    const crsEcef = ecefCoord.crsEcef;
    const crsEcefPath = path + "/crsEcef";
    if (
      !NgaGpmValidator.validateEpsgEcef(
        crsEcefPath,
        "crsEcef",
        crsEcef,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given point3d
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param point3d - The point3d
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validatePoint3d(
    path: string,
    name: string,
    point3d: any,
    context: ValidationContext
  ): boolean {
    // The point3d MUST be an array of 3 numbers
    if (
      !BasicValidator.validateArray(
        path,
        name,
        point3d,
        3,
        3,
        "number",
        context
      )
    ) {
      return false;
    }
    return true;
  }

  /**
   * Validate the given array of three unitVector objects that form
   * an orthogonal basis.
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param unitVectors - The unitVectors
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateUnitVectors(
    path: string,
    name: string,
    unitVectors: any,
    context: ValidationContext
  ): boolean {
    // The unitVectors MUST be an array of 3 objects
    if (
      !BasicValidator.validateArray(
        path,
        name,
        unitVectors,
        3,
        3,
        "object",
        context
      )
    ) {
      return false;
    }
    let result = true;

    // Validate each unitVector
    for (let i = 0; i < unitVectors.length; i++) {
      const unitVector = unitVectors[i];
      const unitVectorPath = path + "/" + i;
      if (
        !NgaGpmValidator.validateUnitVector(
          unitVectorPath,
          name + `[${i}]`,
          unitVector,
          context
        )
      ) {
        result = false;
      }
    }

    // If the basic structure of the vectors has been valid until now,
    // validate that they form an orthonormal basis.
    if (result) {
      const unitVector0 = unitVectors[0];
      const unitVector1 = unitVectors[1];
      const unitVector2 = unitVectors[2];

      const dot01 = NgaGpmValidator.computeDotProduct(unitVector0, unitVector1);
      if (Math.abs(dot01) > ORTHOGONAL_VECTORS_DOT_PRODUCT_EPSILON) {
        const message =
          `The vectors ${name}[0] and ${name}[1] are not orthogonal, ` +
          `their dot product is ${dot01}`;
        const issue = NgaGpmValidationIssues.VECTORS_NOT_ORTHOGONAL(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }

      const dot12 = NgaGpmValidator.computeDotProduct(unitVector1, unitVector2);
      if (Math.abs(dot12) > ORTHOGONAL_VECTORS_DOT_PRODUCT_EPSILON) {
        const message =
          `The vectors ${name}[1] and ${name}[2] are not orthogonal, ` +
          `their dot product is ${dot12}`;
        const issue = NgaGpmValidationIssues.VECTORS_NOT_ORTHOGONAL(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }

      const dot20 = NgaGpmValidator.computeDotProduct(unitVector2, unitVector0);
      if (Math.abs(dot20) > ORTHOGONAL_VECTORS_DOT_PRODUCT_EPSILON) {
        const message =
          `The vectors ${name}[2] and ${name}[0] are not orthogonal, ` +
          `their dot product is ${dot20}`;
        const issue = NgaGpmValidationIssues.VECTORS_NOT_ORTHOGONAL(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    return result;
  }

  /**
   * Computes the dot product between the given vectors
   *
   * @param v0 - The first vector
   * @param v1 - The second vector
   * @returns The dot product
   */
  private static computeDotProduct(
    v0: [number, number, number],
    v1: [number, number, number]
  ): number {
    const x0 = v0[0];
    const y0 = v0[1];
    const z0 = v0[2];
    const x1 = v1[0];
    const y1 = v1[1];
    const z1 = v1[2];
    const dot = x0 * x1 + y0 * y1 + z0 * z1;
    return dot;
  }

  /**
   * Computes the length (magnitude) of the given vector
   *
   * @param v - The vector
   * @returns The length
   */
  private static computeLength(v: [number, number, number]): number {
    const dot = NgaGpmValidator.computeDotProduct(v, v);
    return Math.sqrt(dot);
  }

  /**
   * Validate the given unitVector
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param unitVector - The unitVector
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateUnitVector(
    path: string,
    name: string,
    unitVector: any,
    context: ValidationContext
  ): boolean {
    // The unitVector MUST be an array of 3 numbers
    if (
      !BasicValidator.validateArray(
        path,
        name,
        unitVector,
        3,
        3,
        "number",
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate each unitVector component
    for (let i = 0; i < unitVector.length; i++) {
      const unitVectorComponent = unitVector[i];
      const unitVectorComponentPath = path + "/" + i;

      // Each component MUST be a number in [-1.0, 1.0]
      if (
        !BasicValidator.validateNumberRange(
          unitVectorComponentPath,
          name + `[${i}]`,
          unitVectorComponent,
          -1.0,
          true,
          1.0,
          true,
          context
        )
      ) {
        result = false;
      }
    }

    // If the basic structure of the vector was valid until now,
    // validate that it has unit length
    if (result) {
      const length = NgaGpmValidator.computeLength(unitVector);
      if (Math.abs(length - 1.0) > UNIT_VECTOR_LENGTH_EPSILON) {
        const message =
          `The vector ${name} must have unit length, but has a length ` +
          `of ${length}`;
        const issue = NgaGpmValidationIssues.VECTOR_NOT_UNIT_LENGTH(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }
    }

    return result;
  }

  /**
   * Validate the given idInformation
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param idInformation - The idInformation
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateIdInformation(
    path: string,
    name: string,
    idInformation: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, idInformation, context)) {
      return false;
    }

    let result = true;

    // Validate the datasetId
    const datasetId = idInformation.datasetId;
    const datasetIdPath = path + "/datasetId";

    // The datasetId MUST be a string
    if (
      !BasicValidator.validateString(
        datasetIdPath,
        "datasetId",
        datasetId,
        context
      )
    ) {
      result = false;
    }

    // Validate the referenceDateTime
    const referenceDateTime = idInformation.referenceDateTime;
    const referenceDateTimePath = path + "/referenceDateTime";

    // The referenceDateTime MUST be an ISO8601 string
    if (
      !StringValidator.validateIso8601String(
        referenceDateTimePath,
        "referenceDateTime",
        referenceDateTime,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given extentInformation
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param extentInformation - The extentInformation
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateExtentInformation(
    path: string,
    name: string,
    extentInformation: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(path, name, extentInformation, context)
    ) {
      return false;
    }

    let result = true;

    // Validate the origin
    const origin = extentInformation.origin;
    const originPath = path + "/origin";
    if (
      !NgaGpmValidator.validatePoint3d(originPath, "origin", origin, context)
    ) {
      result = false;
    }

    // Validate the lsrAxisUnitVectors
    const lsrAxisUnitVectors = extentInformation.lsrAxisUnitVectors;
    const lsrAxisUnitVectorsPath = path + "/lsrAxisUnitVectors";
    if (
      !NgaGpmValidator.validateUnitVectors(
        lsrAxisUnitVectorsPath,
        "lsrAxisUnitVectors",
        lsrAxisUnitVectors,
        context
      )
    ) {
      result = false;
    }

    // Validate the lsrLengths
    const lsrLengths = extentInformation.lsrLengths;
    const lsrLengthsPath = path + "/lsrLengths";

    // The lsrLengths MUST be an array of 3 numbers
    if (
      !BasicValidator.validateArray(
        lsrLengthsPath,
        "lsrLengths",
        lsrLengths,
        3,
        3,
        "number",
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given list of collectionRecord objects
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param collectionRecordList - The collectionRecordList
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateCollectionRecordList(
    path: string,
    name: string,
    collectionRecordList: any,
    context: ValidationContext
  ): boolean {
    // The collectionRecordList MUST be an array of at least 1 object
    if (
      !BasicValidator.validateArray(
        path,
        "collectionRecordList",
        collectionRecordList,
        1,
        undefined,
        "object",
        context
      )
    ) {
      return false;
    }
    let result = true;

    // Validate each collectionRecord
    for (let i = 0; i < collectionRecordList.length; i++) {
      const collectionRecord = collectionRecordList[i];
      const collectionRecordPath = path + "/" + i;
      if (
        !NgaGpmValidator.validateCollectionRecord(
          collectionRecordPath,
          name + `[${i}]`,
          collectionRecord,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the given collectionRecord
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param collectionRecord - The collectionRecord
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateCollectionRecord(
    path: string,
    name: string,
    collectionRecord: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, collectionRecord, context)) {
      return false;
    }

    let result = true;

    // Validate the collectionId
    const collectionId = collectionRecord.collectionId;
    const collectionIdPath = path + "/collectionId";

    // The collectionId MUST be a string
    if (
      !BasicValidator.validateString(
        collectionIdPath,
        "collectionId",
        collectionId,
        context
      )
    ) {
      result = false;
    }

    // Validate the platformId
    const platformId = collectionRecord.platformId;
    const platformIdPath = path + "/platformId";

    // The platformId MUST be a string
    if (
      !BasicValidator.validateString(
        platformIdPath,
        "platformId",
        platformId,
        context
      )
    ) {
      result = false;
    }

    // Validate the sensorRecords
    const sensorRecords = collectionRecord.sensorRecords;
    const sensorRecordsPath = path + "/sensorRecords";
    if (
      !NgaGpmValidator.validateSensorRecords(
        sensorRecordsPath,
        "sensorRecords",
        sensorRecords,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given list of sensorRecord objects
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param sensorRecords - The sensorRecords
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateSensorRecords(
    path: string,
    name: string,
    sensorRecords: any,
    context: ValidationContext
  ): boolean {
    // The sensorRecords MUST be an array of at least 1 object
    if (
      !BasicValidator.validateArray(
        path,
        name,
        sensorRecords,
        1,
        undefined,
        "object",
        context
      )
    ) {
      return false;
    }
    let result = true;

    // Validate each sensorRecord
    for (let i = 0; i < sensorRecords.length; i++) {
      const sensorRecord = sensorRecords[i];
      const sensorRecordPath = path + "/" + i;
      if (
        !NgaGpmValidator.validateSensorRecord(
          sensorRecordPath,
          name + `[${i}]`,
          sensorRecord,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the given sensorRecord
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param sensorRecord - The sensorRecord
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateSensorRecord(
    path: string,
    name: string,
    sensorRecord: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, sensorRecord, context)) {
      return false;
    }

    let result = true;

    // Validate the sensorId
    const sensorId = sensorRecord.sensorId;
    const sensorIdPath = path + "/sensorId";

    // The sensorId MUST be a string
    if (
      !BasicValidator.validateString(
        sensorIdPath,
        "sensorId",
        sensorId,
        context
      )
    ) {
      result = false;
    }

    // Validate the sensorType
    const sensorType = sensorRecord.sensorType;
    const sensorTypePath = path + "/sensorType";

    // The sensorType MUST be a string
    if (
      !BasicValidator.validateString(
        sensorTypePath,
        "sensorType",
        sensorType,
        context
      )
    ) {
      result = false;
    }

    // Validate the sensorMode
    const sensorMode = sensorRecord.sensorMode;
    const sensorModePath = path + "/sensorMode";

    // The sensorMode MUST be a string
    if (
      !BasicValidator.validateString(
        sensorModePath,
        "sensorMode",
        sensorMode,
        context
      )
    ) {
      result = false;
    }

    // Validate the collectionUnitRecords
    const collectionUnitRecords = sensorRecord.collectionUnitRecords;
    const collectionUnitRecordsPath = path + "/collectionUnitRecords";
    if (
      !NgaGpmValidator.validateCollectionUnitRecords(
        collectionUnitRecordsPath,
        "collectionUnitRecords",
        collectionUnitRecords,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given list of collectionUnitRecord objects
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param collectionUnitRecords - The collectionUnitRecords
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateCollectionUnitRecords(
    path: string,
    name: string,
    collectionUnitRecords: any,
    context: ValidationContext
  ): boolean {
    // The collectionUnitRecords MUST be an array of at least 1 object
    if (
      !BasicValidator.validateArray(
        path,
        name,
        collectionUnitRecords,
        1,
        undefined,
        "object",
        context
      )
    ) {
      return false;
    }
    let result = true;

    // Validate each collectionUnitRecord
    for (let i = 0; i < collectionUnitRecords.length; i++) {
      const collectionUnitRecord = collectionUnitRecords[i];
      const collectionUnitRecordPath = path + "/" + i;
      if (
        !NgaGpmValidator.validateCollectionUnitRecord(
          collectionUnitRecordPath,
          name + `[${i}]`,
          collectionUnitRecord,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the given collectionUnitRecord
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param collectionUnitRecord - The collectionUnitRecord
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateCollectionUnitRecord(
    path: string,
    name: string,
    collectionUnitRecord: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(path, name, collectionUnitRecord, context)
    ) {
      return false;
    }

    let result = true;

    // Validate the referenceDateTime
    const referenceDateTime = collectionUnitRecord.referenceDateTime;
    const referenceDateTimePath = path + "/referenceDateTime";

    // The referenceDateTime MUST be an ISO8601 string
    if (
      !StringValidator.validateIso8601String(
        referenceDateTimePath,
        "referenceDateTime",
        referenceDateTime,
        context
      )
    ) {
      // TODO It should be an ISO8601 string. This could/should
      // be checked with the "validator.js" npm library.
      result = false;
    }

    // Validate the collectionUnitId
    const collectionUnitId = collectionUnitRecord.collectionUnitId;
    const collectionUnitIdPath = path + "/collectionUnitId";

    // The collectionUnitId MUST be a string
    if (
      !BasicValidator.validateString(
        collectionUnitIdPath,
        "collectionUnitId",
        collectionUnitId,
        context
      )
    ) {
      result = false;
    }

    // Validate the pointSourceId
    const pointSourceId = collectionUnitRecord.pointSourceId;
    const pointSourceIdPath = path + "/pointSourceId";

    // The pointSourceId MUST be an integer of at least 0
    if (
      !BasicValidator.validateIntegerRange(
        pointSourceIdPath,
        "pointSourceId",
        pointSourceId,
        0,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate the extentInformation
    const extentInformation = collectionUnitRecord.extentInformation;
    const extentInformationPath = path + "/extentInformation";
    if (
      !NgaGpmValidator.validateExtentInformation(
        extentInformationPath,
        "extentInformation",
        extentInformation,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given unmodeledError
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param unmodeledError - The unmodeledError
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateUnmodeledError(
    path: string,
    name: string,
    unmodeledError: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, unmodeledError, context)) {
      return false;
    }

    let result = true;

    // Validate the uniqueId
    const uniqueId = unmodeledError.uniqueId;
    const uniqueIdPath = path + "/uniqueId";

    // The uniqueId MUST be a string
    if (
      !BasicValidator.validateString(
        uniqueIdPath,
        "uniqueId",
        uniqueId,
        context
      )
    ) {
      result = false;
    }

    // Validate the corrRotationThetas
    const corrRotationThetas = unmodeledError.corrRotationThetas;
    const corrRotationThetasPath = path + "/corrRotationThetas";
    if (
      NgaGpmValidator.validateRotationThetas(
        corrRotationThetasPath,
        "corrRotationThetas",
        corrRotationThetas,
        context
      )
    ) {
      result = false;
    }

    // Validate the corrParams
    const corrParams = unmodeledError.corrParams;
    const corrParamsPath = path + "/corrParams";
    if (
      !NgaGpmValidatorCommon.validateCorrelationParameters(
        corrParamsPath,
        "corrParams",
        corrParams,
        context
      )
    ) {
      result = false;
    }

    // Validate the posts
    const posts = unmodeledError.posts;
    const postsPath = path + "/posts";
    if (
      !NgaGpmValidator.validateUnmodeledErrorPosts(
        postsPath,
        "posts",
        posts,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given rotationThetas
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param rotationThetas - The rotationThetas
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateRotationThetas(
    path: string,
    name: string,
    rotationThetas: any,
    context: ValidationContext
  ): boolean {
    // The rotationThetas MUST be an array of 3 numbers
    if (
      !BasicValidator.validateArray(
        path,
        name,
        rotationThetas,
        3,
        3,
        "number",
        context
      )
    ) {
      return false;
    }
    return true;
  }

  /**
   * Validate the given array of unmodeledErrorPost objects
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param unmodeledErrorPosts - The unmodeledErrorPosts
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateUnmodeledErrorPosts(
    path: string,
    name: string,
    unmodeledErrorPosts: any,
    context: ValidationContext
  ): boolean {
    // The unmodeledErrorPosts MUST be an array objects
    if (
      !BasicValidator.validateArray(
        path,
        name,
        unmodeledErrorPosts,
        undefined,
        undefined,
        "object",
        context
      )
    ) {
      return false;
    }
    let result = true;

    // Validate each unmodeledErrorPost
    for (let i = 0; i < unmodeledErrorPosts.length; i++) {
      const unmodeledErrorPost = unmodeledErrorPosts[i];
      const unmodeledErrorPostPath = path + "/" + i;
      if (
        !NgaGpmValidator.validateUnmodeledErrorPost(
          unmodeledErrorPostPath,
          name + `[${i}]`,
          unmodeledErrorPost,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Validate the given unmodeledErrorPost
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param unmodeledErrorPost - The unmodeledErrorPost
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateUnmodeledErrorPost(
    path: string,
    name: string,
    unmodeledErrorPost: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(path, name, unmodeledErrorPost, context)
    ) {
      return false;
    }

    let result = true;

    // Validate the position
    const position = unmodeledErrorPost.position;
    const positionPath = path + "/position";
    if (
      !NgaGpmValidator.validatePoint3d(
        positionPath,
        "position",
        position,
        context
      )
    ) {
      result = false;
    }

    // Validate the covariance
    const covariance = unmodeledErrorPost.covariance;
    const covariancePath = path + "/covariance";
    if (
      !NgaGpmValidator.validateCovarUpperTriangle(
        covariancePath,
        "covariance",
        covariance,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given covarUpperTriangle
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param covarUpperTriangle - The covarUpperTriangle
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateCovarUpperTriangle(
    path: string,
    name: string,
    covarUpperTriangle: any,
    context: ValidationContext
  ): boolean {
    // The covarUpperTriangle MUST be an array of at least 6 numbers
    if (
      !BasicValidator.validateArray(
        path,
        name,
        covarUpperTriangle,
        6,
        undefined,
        "number",
        context
      )
    ) {
      return false;
    }
    return true;
  }

  /**
   * Validate the given interpolationParams
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param interpolationParams - The interpolationParams
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateInterpolationParams(
    path: string,
    name: string,
    interpolationParams: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(path, name, interpolationParams, context)
    ) {
      return false;
    }

    // Validate the interpolationMode
    const interpolationMode = interpolationParams.interpolationMode;
    const interpolationModePath = path + "/interpolationMode";

    // The interpolationMode MUST be one of these valid values
    const interpolationModeValues = ["nearestNeighbor", "IDW"];
    if (
      !BasicValidator.validateEnum(
        interpolationModePath,
        "interpolationMode",
        interpolationMode,
        interpolationModeValues,
        context
      )
    ) {
      // The remaining validation depends on the interpolationMode,
      // so bail out early when it is invalid
      return false;
    }

    let result = true;

    const interpNumPosts = interpolationParams.interpNumPosts;
    const interpNumPostsPath = path + "/interpNumPosts";

    const dampeningParam = interpolationParams.dampeningParam;
    const dampeningParamPath = path + "/dampeningParam";

    // When the interpolation mode is "nearestNeighbor", then
    // none of the other properties may be defined.
    if (interpolationMode === "nearestNeighbor") {
      if (defined(interpNumPosts)) {
        const message =
          `When the interpolation mode is 'nearestNeighbor', then the ` +
          `interpolation parameters may not define 'interpNumPosts'`;
        const issue = StructureValidationIssues.DISALLOWED_VALUE_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }

      if (defined(dampeningParam)) {
        const message =
          `When the interpolation mode is 'nearestNeighbor', then the ` +
          `interpolation parameters may not define 'dampeningParam'`;
        const issue = StructureValidationIssues.DISALLOWED_VALUE_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }

      // Nothing else to check when interpolationMode
      // is "nearestNeighbor" - return immediately.
      return result;
    }

    // Validate the interpNumPosts
    // The interpNumPosts MUST be an integer of at least 1
    if (
      !BasicValidator.validateIntegerRange(
        interpNumPostsPath,
        "interpNumPosts",
        interpNumPosts,
        1,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate the dampeningParam
    // The dampeningParam MUST be number
    if (
      !BasicValidator.validateNumber(
        dampeningParamPath,
        "dampeningParam",
        dampeningParam,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given threeDimensionalConformal
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param threeDimensionalConformal - The threeDimensionalConformal
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateThreeDimensionalConformal(
    path: string,
    name: string,
    threeDimensionalConformal: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        name,
        threeDimensionalConformal,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the flags
    const flags = threeDimensionalConformal.flags;
    const flagsPath = path + "/flags";

    // The flags MUST be an array of 7 boolean values
    const flagsValid = BasicValidator.validateArray(
      flagsPath,
      "flags",
      flags,
      7,
      7,
      "boolean",
      context
    );
    if (!flagsValid) {
      result = false;
    }

    // The subsequent constraints imply that there must be at least
    // one flag being set to 'true'. Check this explicitly.

    // Compute the number of flags that are set to 'true'
    if (flagsValid) {
      const numTrueFlags = flags.reduce(
        (n: number, f: boolean) => n + (f ? 1 : 0),
        0
      );
      if (numTrueFlags === 0) {
        const message =
          `At least one of the flags of the threeDimensionalConformal ` +
          `must be set to 'true'`;
        const issue = JsonValidationIssues.VALUE_NOT_IN_RANGE(path, message);
        context.addIssue(issue);
        result = false;
      }
    }

    // Validate the recentering
    const recentering = threeDimensionalConformal.recentering;
    const recenteringPath = path + "/recentering";

    // The recentering MUST be an array of 4 numbers
    if (
      !BasicValidator.validateArray(
        recenteringPath,
        "recentering",
        recentering,
        3,
        3,
        "number",
        context
      )
    ) {
      result = false;
    }

    // Validate the normalizingScaleFactor
    const normalizingScaleFactor =
      threeDimensionalConformal.normalizingScaleFactor;
    const normalizingScaleFactorPath = path + "/normalizingScaleFactor";

    // The normalizingScaleFactor MUST be a number
    if (
      !BasicValidator.validateNumber(
        normalizingScaleFactorPath,
        "normalizingScaleFactor",
        normalizingScaleFactor,
        context
      )
    ) {
      result = false;
    }

    // Validate the parameters
    const parameters = threeDimensionalConformal.parameters;
    const parametersPath = path + "/parameters";

    // The parameters MUST be an array of at least 1 and at most 7 numbers
    if (
      !BasicValidator.validateArray(
        parametersPath,
        "parameters",
        parameters,
        1,
        7,
        "number",
        context
      )
    ) {
      result = false;
    }

    // Validate the covariance
    const covariance = threeDimensionalConformal.covariance;
    const covariancePath = path + "/covariance";

    // The covariance MUST be an array of at least 1 and at most 28 numbers
    if (
      !BasicValidator.validateArray(
        covariancePath,
        "covariance",
        covariance,
        1,
        28,
        "number",
        context
      )
    ) {
      result = false;
    }

    // Only if the object has been structurally valid on the JSON level,
    // validate its overall consistency in terms of array lengths
    if (result) {
      result = NgaGpmValidator.validateThreeDimensionalConformalConsistency(
        path,
        threeDimensionalConformal,
        context
      );
    }

    return result;
  }

  /**
   * Validate the consistency of the given threeDimensionalConformal,
   * after its basic structural validity has been validated with
   * `validateThreeDimensionalConformal`.
   *
   * This validates the lengths of the 'parameters' and 'covariance'
   * arrays, depending on the number of 'flags' that have been
   * set to 'true'.
   *
   * Note that this COULD be covered with the basic validation in
   * `validateThreeDimensionalConformal`, by passing the expected
   * length to the `BasicValidator.validateArray` calls. But
   * differentiating between a length that is not valid according
   * to the schema, and a length that is not "consistent" with
   * the constraints of the specification allows to provide more
   * specific validation issues, with more helpful messages.
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param threeDimensionalConformal - The threeDimensionalConformal
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateThreeDimensionalConformalConsistency(
    path: string,
    threeDimensionalConformal: any,
    context: ValidationContext
  ): boolean {
    let result = true;

    const flags = threeDimensionalConformal.flags;
    const parameters = threeDimensionalConformal.parameters;
    const covariance = threeDimensionalConformal.covariance;

    // Compute the number of flags that are set to 'true'
    const numTrueFlags = flags.reduce(
      (n: number, f: boolean) => n + (f ? 1 : 0),
      0
    );

    // The length of the parameters array MUST match the number of
    // flags that are set to 'true'
    if (parameters.length !== numTrueFlags) {
      const message =
        `The number of parameters that are given in the ` +
        `threeDimensionalConformal must match the number of flags that ` +
        `are set to 'true'. There are ${numTrueFlags} flags that are ` +
        `set to 'true', but the number of parameters is ${parameters.length}`;
      const issue = NgaGpmValidationIssues.ARRAY_LENGTH_INCONSISTENT(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    // The length of the array for the upper-triangular of the covariance
    // matrix MUST be the n-th triangular number, for n being the number
    // of flags that are set to 'true'
    const expectedCovarianceLength =
      NgaGpmValidatorCommon.computeTriangularNumber(numTrueFlags);
    if (covariance.length !== expectedCovarianceLength) {
      const message =
        `The number of elements in the upper-triangular of the covariance of ` +
        `the threeDimensionalConformal must be 'n*(n+1)/2', for 'n' being the ` +
        `number of flags that are set to 'true'. There are ${numTrueFlags} ` +
        `flags that are set to 'true', meaning that the expected length is ` +
        `${expectedCovarianceLength}, but the length of the covariance array ` +
        `is ${covariance.length}`;
      const issue = NgaGpmValidationIssues.ARRAY_LENGTH_INCONSISTENT(
        path,
        message
      );
      context.addIssue(issue);
      result = false;
    }

    return result;
  }

  /**
   * Validate the given ppeManifest
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param ppeManifest - The ppeManifest
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validatePpeManifest(
    path: string,
    name: string,
    ppeManifest: any,
    context: ValidationContext
  ): boolean {
    // The ppeManifest MUST be an array of at least 1 and at most 7 objects
    if (
      !BasicValidator.validateArray(
        path,
        name,
        ppeManifest,
        1,
        7,
        "object",
        context
      )
    ) {
      return false;
    }
    let result = true;

    // Check each ppeManifest element to be a valid ppeMetadata
    for (let i = 0; i < ppeManifest.length; i++) {
      const ppeMetadata = ppeManifest[i];
      const ppeMetadataPath = path + "/" + i;
      if (
        !NgaGpmValidatorCommon.validatePpeMetadata(
          ppeMetadataPath,
          name + `[${i}]`,
          ppeMetadata,
          context
        )
      ) {
        result = false;
      }
    }

    // If the basic structure was valid until now, then validate that
    // the values of the `ppeMetadata[i].source` entries are unique.
    if (result) {
      const sourceValues: string[] = [];
      for (let i = 0; i < ppeManifest.length; i++) {
        const ppeMetadata = ppeManifest[i];
        const source = ppeMetadata.source;
        sourceValues.push(source);
      }
      const sourceValueSet = new Set<string>(...sourceValues);
      if (sourceValueSet.size != ppeManifest.length) {
        const message =
          `The sources of PPE metadata entries must be unique, ` +
          `but are ${sourceValues} `;
        const issue =
          NgaGpmValidationIssues.PER_POINT_ERROR_SOURCE_VALUES_NOT_UNIQUE(
            path,
            message
          );
        context.addIssue(issue);
        result = false;
      }
    }

    return result;
  }

  /**
   * Validate the given anchorPointMetadata
   *
   * @param path - The path for validation issues
   * @param name - The name of the object
   * @param anchorPointMetadata - The anchorPointMetadata
   * @param numContentsInRootNode - The number of contents in the root
   * node of the tileset.
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateAnchorPointMetadata(
    path: string,
    name: string,
    anchorPointMetadata: any,
    numContentsInRootNode: number,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(path, name, anchorPointMetadata, context)
    ) {
      return false;
    }

    let result = true;

    // Validate the placementType
    const placementType = anchorPointMetadata.placementType;
    const placementTypePath = path + "/placementType";

    // The placementType MUST be one of these valid values
    const placementTypeValues = ["MeshContent", "SeparateContent"];
    if (
      !BasicValidator.validateEnum(
        placementTypePath,
        "placementType",
        placementType,
        placementTypeValues,
        context
      )
    ) {
      // The remaining validation depends on the mcsType,
      // so bail out early when it is invalid
      return false;
    }

    const contentIndex = anchorPointMetadata.contentIndex;
    const contentIndexPath = path + "/contentIndex";

    if (placementType === "MeshContent") {
      if (defined(contentIndex)) {
        const message =
          `When the anchor point metadata has the placement type 'MeshContent', ` +
          `then it may not define 'contentIndex'`;
        const issue = StructureValidationIssues.DISALLOWED_VALUE_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      }
      // Nothing else to check when the placementType is "MeshContent"
      return result;
    }

    // The placementType is "SeparateContent"
    // Validate the contentIndex
    // The contentIndex MUST be an integer of which I now
    // just assume that it may not be negative, and that
    // may not be larger than the number of contents in
    // the root node of the tileset
    if (
      !BasicValidator.validateIntegerRange(
        contentIndexPath,
        "contentIndex",
        contentIndex,
        0,
        true,
        numContentsInRootNode,
        false,
        context
      )
    ) {
      result = false;
    }

    return result;
  }
}
