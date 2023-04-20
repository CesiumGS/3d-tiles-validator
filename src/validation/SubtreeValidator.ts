import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";
import { Buffers } from "3d-tiles-tools";

import { ResourceResolver } from "3d-tiles-tools";

import { Validator } from "./Validator";
import { ValidationContext } from "./ValidationContext";
import { ValidationState } from "./ValidationState";
import { BasicValidator } from "./BasicValidator";
import { BinaryValidator } from "./BinaryValidator";
import { SubtreeConsistencyValidator } from "./SubtreeConsistencyValidator";
import { SubtreeInfoValidator } from "./SubtreeInfoValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { ExtendedObjectsValidators } from "./ExtendedObjectsValidators";

import { BinaryBufferStructureValidator } from "./BinaryBufferStructureValidator";

import { BinaryPropertyTable } from "3d-tiles-tools";

import { MetadataEntityValidator } from "./metadata/MetadataEntityValidator";
import { PropertyTableValidator } from "./metadata/PropertyTableValidator";
import { MetadataUtilities } from "3d-tiles-tools";
import { BinaryBufferStructure } from "3d-tiles-tools";

import { BinarySubtreeData } from "3d-tiles-tools";
import { BinarySubtreeDataResolver } from "3d-tiles-tools";

import { Subtree } from "3d-tiles-tools";
import { Availability } from "3d-tiles-tools";
import { TileImplicitTiling } from "3d-tiles-tools";

import { JsonValidationIssues } from "../issues/JsonValidationIssues";
import { IoValidationIssues } from "../issues/IoValidationIssue";
import { StructureValidationIssues } from "../issues/StructureValidationIssues";
import { BinaryPropertyTableValidator } from "./metadata/BinaryPropertyTableValidator";

/**
 * A class for validations related to `subtree` objects that have
 * been read from subtree JSON files, or the JSON part of a
 * binary 'subtree' file.
 *
 * This class is only performing the high-level validation that
 * is related to the binary data and JSON structure. The
 * detailed consistency validations are done by a
 * `SubtreeConsistencyValidator`.
 *
 * @internal
 */
export class SubtreeValidator implements Validator<Buffer> {
  /**
   * The `ValidationState` that carries information about
   * the metadata schema
   */
  private readonly _validationState: ValidationState;

  /**
   * The `TileImplicitTiling` object that carries information
   * about the expected structure of the subtree
   */
  private readonly _implicitTiling: TileImplicitTiling | undefined;

  /**
   * The `ResourceResolver` that will be used to resolve
   * buffer URIs
   */
  private readonly _resourceResolver: ResourceResolver;

  /**
   * Creates a new instance.
   *
   * @param validationState - The `ValidationState`
   * @param implicitTiling - The `TileImplicitTiling` that
   * defines the expected structure of the subtree
   * @param resourceResolver - The `ResourceResolver` that
   * will be used to resolve buffer URIs.
   */
  constructor(
    validationState: ValidationState,
    implicitTiling: TileImplicitTiling | undefined,
    resourceResolver: ResourceResolver
  ) {
    this._validationState = validationState;
    this._implicitTiling = implicitTiling;
    this._resourceResolver = resourceResolver;
  }

  /**
   * Implementation of the `Validator` interface that performs the
   * validation of the given buffer, which is supposed to
   * contain subtree data, either in binary form or as JSON.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param input - The subtree data
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether the object was valid or not.
   */
  async validateObject(
    path: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const isSubt = Buffers.getMagicString(input) === "subt";
    if (isSubt) {
      const result = await this.validateSubtreeBinaryData(path, input, context);
      return result;
    }
    const isJson = Buffers.isProbablyJson(input);
    if (isJson) {
      const result = await this.validateSubtreeJsonData(path, input, context);
      return result;
    }
    const message = `Subtree input data was neither a subtree binary nor JSON`;
    const issue = IoValidationIssues.IO_ERROR(path, message);
    context.addIssue(issue);
    return false;
  }

  /**
   * Performs the validation of the given buffer, which contains the
   * data from a binary subtree file
   *
   * @param path - The path for `ValidationIssue` instances
   * @param input - The contents of a binary subtree file
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether the object was valid or not.
   */
  private async validateSubtreeBinaryData(
    path: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    // Validate the header length
    const headerByteLength = 24;
    if (
      !BinaryValidator.validateMinLength(
        path,
        "input",
        headerByteLength,
        input.length,
        context
      )
    ) {
      return false;
    }

    // Validate the magic (this was usually already done before entering
    // this method, but done to perform a complete validation here,
    // regardless of where this method is called)
    // The magic MUST be "subt"
    const magic = input.toString("utf8", 0, 4);
    if (!BinaryValidator.validateValue(path, "magic", "subt", magic, context)) {
      return false;
    }

    // Validate the version
    // The version MUST be 1
    const version = input.readUInt32LE(4);
    if (!BinaryValidator.validateValue(path, "version", 1, version, context)) {
      return false;
    }

    // Validate the jsonByteLength
    // The jsonByteLength MUST be aligned to 8
    const jsonByteLength = input.readBigUint64LE(8);
    if (
      !BinaryValidator.validateAlignment(
        path,
        "JSON byte length",
        jsonByteLength,
        8,
        context
      )
    ) {
      return false;
    }

    // Validate the binaryByteLength
    // The binaryByteLength MUST be aligned to 8
    const binaryByteLength = input.readBigUint64LE(16);
    if (
      !BinaryValidator.validateAlignment(
        path,
        "binary byte length",
        binaryByteLength,
        8,
        context
      )
    ) {
      return false;
    }

    // Validate the that the total byte length from the
    // header matches the length of the input data
    const computedByteLength =
      BigInt(headerByteLength) + jsonByteLength + binaryByteLength;
    if (
      !BinaryValidator.validateLength(
        path,
        "header, JSON byte length, and binary byte length",
        input.length,
        computedByteLength,
        context
      )
    ) {
      return false;
    }

    // Extract the JSON buffer
    const jsonStartByteOffset = headerByteLength;
    const jsonEndByteOffset = jsonStartByteOffset + Number(jsonByteLength);
    const jsonBuffer = input.subarray(jsonStartByteOffset, jsonEndByteOffset);

    // Try to parse the JSON
    try {
      Buffers.getJson(jsonBuffer);
    } catch (error) {
      const message = `Could not parse subtree JSON: ${error}`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(path, message);
      context.addIssue(issue);
      return false;
    }

    const hasBinaryBuffer = binaryByteLength > 0;
    const binarySubtreeData = await BinarySubtreeDataResolver.resolveFromBuffer(
      input,
      this._resourceResolver
    );
    const result = this.validateSubtree(
      path,
      binarySubtreeData,
      hasBinaryBuffer,
      context
    );
    return result;
  }

  /**
   * Performs the validation of the subtree JSON data in the given buffer
   *
   * @param path - The path for `ValidationIssue` instances
   * @param input - The buffer that contains the subtree JSON data
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether the object was valid or not.
   */
  private async validateSubtreeJsonData(
    path: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const bom = Buffers.getUnicodeBOMDescription(input);
    if (defined(bom)) {
      const message = `Unexpected BOM in subtree JSON buffer: ${bom}`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(path, message);
      context.addIssue(issue);
      return false;
    }

    try {
      const inputString = input.toString();
      const subtree: Subtree = JSON.parse(inputString);

      const binarySubtreeData = await BinarySubtreeDataResolver.resolveFromJson(
        subtree,
        this._resourceResolver
      );
      const hasBinaryBuffer = false;
      const result = await this.validateSubtree(
        path,
        binarySubtreeData,
        hasBinaryBuffer,
        context
      );
      return result;
    } catch (error) {
      //console.log(error);
      const issue = IoValidationIssues.JSON_PARSE_ERROR(path, `${error}`);
      context.addIssue(issue);
      return false;
    }
  }

  /**
   * Performs the validation of the binary subtree data
   *
   * @param path - The path for `ValidationIssue` instances
   * @param binarySubtreeData - The `BinarySubtreeData` object
   * @param hasBinaryBuffer - Whether the subtree data has an (internal)
   * binary buffer, meaning that the first `Buffer` object may omit
   * the URI.
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether the object was valid or not.
   */
  private async validateSubtree(
    path: string,
    binarySubtreeData: BinarySubtreeData,
    hasBinaryBuffer: boolean,
    context: ValidationContext
  ): Promise<boolean> {
    const subtree = binarySubtreeData.subtree;

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        path,
        "subtree",
        subtree,
        context
      )
    ) {
      result = false;
    }

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(path, subtree, context)
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(subtree)) {
      return result;
    }

    // Validate the structure of the given subtree object,
    // on the level of JSON validity
    const structureIsValid = this.validateSubtreeObject(
      path,
      subtree,
      hasBinaryBuffer,
      context
    );
    if (!structureIsValid) {
      result = false;
      return result;
    }

    // If the structure was valid, perform the deeper consistency validation
    // of the binary buffer structure and availability consistency
    if (
      !SubtreeConsistencyValidator.validateSubtreeConsistency(
        path,
        subtree,
        this._implicitTiling,
        context
      )
    ) {
      result = false;
      return result;
    }

    // If the structure was valid and consistent, perform the
    // validation that actually involves reading the binary data

    // Validate the binary representation of the property tables
    const binaryPropertyTablesValid = await this.validateBinaryPropertyTables(
      path,
      binarySubtreeData,
      context
    );
    if (!binaryPropertyTablesValid) {
      result = false;
    }

    // Validate the consistency of the binary availability data
    if (defined(this._implicitTiling)) {
      const dataIsConsistent = await SubtreeInfoValidator.validateSubtreeInfo(
        path,
        binarySubtreeData,
        this._implicitTiling,
        context
      );
      if (!dataIsConsistent) {
        result = false;
        return result;
      }
    }

    return result;
  }

  /**
   * Performs the validation of the given `Subtree` object, on
   * the level of JSON validity.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param subtree - The `Subtree` object
   * @param hasBinaryBuffer - Whether the subtree has an associated
   * binary buffer
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private validateSubtreeObject(
    path: string,
    subtree: Subtree,
    hasBinaryBuffer: boolean,
    context: ValidationContext
  ): boolean {
    if (!this.validateSubtreeBasic(path, subtree, hasBinaryBuffer, context)) {
      return false;
    }
    if (!this.validateMetadata(path, subtree, context)) {
      return false;
    }
    return true;
  }

  /**
   * Performs the validation to ensure that the given object is a
   * valid `subtree` object.
   *
   * This method will perform the basic validation of the JSON part,
   * excluding the metadata.
   * The consistency and binary data will be validated separately.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param subtree - The `Subtree` object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private validateSubtreeBasic(
    path: string,
    subtree: Subtree,
    hasBinaryBuffer: boolean,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "subtree", subtree, context)) {
      return false;
    }

    let result = true;

    // Validate the binary buffer structure, i.e. the `buffers`
    // and `bufferViews`
    const binaryBufferStructure: BinaryBufferStructure = {
      buffers: subtree.buffers ?? [],
      bufferViews: subtree.bufferViews ?? [],
    };
    const firstBufferUriIsRequired = !hasBinaryBuffer;
    if (
      !BinaryBufferStructureValidator.validateBinaryBufferStructure(
        path,
        binaryBufferStructure,
        firstBufferUriIsRequired,
        context
      )
    ) {
      result = false;
    }

    // Validate the tileAvailability
    const tileAvailability = subtree.tileAvailability;
    const tileAvailabilityPath = path + "/tileAvailability";
    // The tileAvailability MUST be defined
    // The tileAvailability MUST be a valid availability object
    if (
      !SubtreeValidator.validateAvailability(
        tileAvailabilityPath,
        "tileAvailability",
        tileAvailability,
        context
      )
    ) {
      result = false;
    }

    // Validate the contentAvailability
    const contentAvailability = subtree.contentAvailability;
    const contentAvailabilityPath = path + "/contentAvailability";
    if (defined(contentAvailability)) {
      // The contentAvailability MUST be an array of at least 1 objects
      if (
        !BasicValidator.validateArray(
          contentAvailabilityPath,
          "contentAvailability",
          contentAvailability,
          1,
          undefined,
          "object",
          context
        )
      ) {
        result = false;
      } else {
        // Validate each contentAvailability
        for (let i = 0; i < contentAvailability.length; i++) {
          const elementPath = contentAvailabilityPath + "/" + i;
          const elementName = "contentAvailability/" + i;
          const element = contentAvailability[i];
          if (
            !SubtreeValidator.validateAvailability(
              elementPath,
              elementName,
              element,
              context
            )
          ) {
            result = false;
          }
        }
      }
    }

    // Validate the childSubtreeAvailability
    const childSubtreeAvailability = subtree.childSubtreeAvailability;
    const childSubtreeAvailabilityPath = path + "/childSubtreeAvailability";
    // The childSubtreeAvailability MUST be defined
    // The childSubtreeAvailability MUST be a valid availability object
    if (
      !SubtreeValidator.validateAvailability(
        childSubtreeAvailabilityPath,
        "childSubtreeAvailability",
        childSubtreeAvailability,
        context
      )
    ) {
      result = false;
    }
    return result;
  }

  /**
   * Performs the validation to ensure that the given object is a
   * valid `availability` object.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param name - The name of the object
   * @param availability - The `Availability` object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateAvailability(
    path: string,
    name: string,
    availability: Availability | undefined,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, availability, context)) {
      return false;
    }

    let result = true;

    const bitstream = availability.bitstream;
    const bitstreamPath = path + "/bitstream";

    const constant = availability.constant;
    const constantPath = path + "/constant";

    // Any of the bitstream or the constant must be defined
    if (!defined(bitstream) && !defined(constant)) {
      const issue = JsonValidationIssues.ANY_OF_ERROR(
        path,
        name,
        "bitstream",
        "constant"
      );
      context.addIssue(issue);
      result = false;
    }
    // One of the bitstream or the constant must be defined,
    if (defined(bitstream) && defined(constant)) {
      const issue = JsonValidationIssues.ONE_OF_ERROR(
        path,
        name,
        "bitstream",
        "constant"
      );
      context.addIssue(issue);
      result = false;
    }

    if (defined(bitstream)) {
      // The bitstream MUST be an integer of at least 0
      if (
        !BasicValidator.validateIntegerRange(
          bitstreamPath,
          "bitstream",
          bitstream,
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

    if (defined(constant)) {
      // The constant MUST be 0 or 1
      const constantValues = [0, 1];
      if (
        !BasicValidator.validateEnum(
          constantPath,
          "constant",
          constant,
          constantValues,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the availableCount
    const availableCount = availability.availableCount;
    const availableCountPath = path + "/availableCount";
    if (defined(availableCount)) {
      // The availableCount MUST be an integer of at least 0
      if (
        !BasicValidator.validateIntegerRange(
          availableCountPath,
          "availableCount",
          availableCount,
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

    return result;
  }

  /**
   * Validates the metadata that may be associated with the given subtree.
   *
   * This checks whether there are `propertyTables`, and whether they
   * are valid according to the `validationState.validatedSchema`.
   *
   * It also checks the `tileMetadata`, `contentMetadata`, and
   * `subtreeMetadata`, to see whether it complies to the schema
   * definition and the property tables.
   *
   * @param path - The path for `ValidationIssue` instances
   * @param subtree - The `Subtree` object
   * @param context - The `ValidationContext`
   * @returns Whether the metadata was valid
   */
  private validateMetadata(
    path: string,
    subtree: Subtree,
    context: ValidationContext
  ): boolean {
    let result = true;

    // This stores whether there has been a definition of propertyTables
    // at all
    let hasPropertyTablesDefinition = false;

    // This are the validated property tables - i.e. this will only
    // be defined if the (defined) property tables have turned out
    // to be valid
    let validatedPropertyTables = undefined;

    // Validate the propertyTables
    const propertyTables = subtree.propertyTables;
    const propertyTablesPath = path + "/propertyTables";
    if (defined(propertyTables)) {
      hasPropertyTablesDefinition = true;
      const numBufferViews = defaultValue(subtree.bufferViews?.length, 0);

      if (!this._validationState.hasSchemaDefinition) {
        // If there are property tables, then there MUST be a schema definition
        const message =
          `The subtree defines 'propertyTables' but ` +
          `there was no schema definition`;
        const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      } else if (defined(this._validationState.validatedSchema)) {
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
          result = false;
        } else {
          // Validate each propertyTable
          let propertyTablesAreValid = true;
          for (let i = 0; i < propertyTables.length; i++) {
            const propertyTable = propertyTables[i];
            const propertyTablePath = propertyTablesPath + "/" + i;
            if (
              !PropertyTableValidator.validatePropertyTable(
                propertyTablePath,
                propertyTable,
                numBufferViews,
                this._validationState.validatedSchema,
                context
              )
            ) {
              result = false;
              propertyTablesAreValid = false;
            }
          }
          if (propertyTablesAreValid) {
            validatedPropertyTables = propertyTables;
          }
        }
      }
    }

    // Validate the tileMetadata
    const tileMetadata = subtree.tileMetadata;
    const tileMetadataPath = path + "/tileMetadata";
    if (defined(tileMetadata)) {
      // The tileMetadata MUST be an integer of at least 0
      if (
        !BasicValidator.validateIntegerRange(
          tileMetadataPath,
          "tileMetadata",
          tileMetadata,
          0,
          true,
          undefined,
          false,
          context
        )
      ) {
        result = false;
      } else {
        if (!this._validationState.hasSchemaDefinition) {
          // If there is tileMetadata, then there MUST be a schema definition
          const message =
            `The subtree defines 'tileMetadata' but ` +
            `there was no schema definition`;
          const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
            path,
            message
          );
          context.addIssue(issue);
          result = false;
        } else if (!hasPropertyTablesDefinition) {
          // If there is tileMetadata, then there MUST be propertyTables
          const message =
            `The subtree defines 'tileMetadata' but ` +
            `defines no property tables`;
          const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
            path,
            message
          );
          context.addIssue(issue);
          result = false;
        } else if (
          defined(this._validationState.validatedSchema) &&
          defined(validatedPropertyTables)
        ) {
          // The tileMetadata MUST be smaller than the numberOfPropertyTables
          if (
            !BasicValidator.validateIntegerRange(
              tileMetadataPath,
              "tileMetadata",
              tileMetadata,
              0,
              true,
              validatedPropertyTables.length,
              false,
              context
            )
          ) {
            result = false;
          }
        }
      }
    }

    // Validate the contentMetadata
    const contentMetadata = subtree.contentMetadata;
    const contentMetadataPath = path + "/contentMetadata";
    if (defined(contentMetadata)) {
      // The contentMetadata MUST be an array of at least 1 numbers
      if (
        !BasicValidator.validateArray(
          contentMetadataPath,
          "contentMetadata",
          contentMetadata,
          1,
          undefined,
          "number",
          context
        )
      ) {
        result = false;
      } else {
        if (!this._validationState.hasSchemaDefinition) {
          // If there is contentMetadata, then there MUST be a schema definition
          const message =
            `The subtree defines 'contentMetadata' but ` +
            `there was no schema definition`;
          const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
            path,
            message
          );
          context.addIssue(issue);
          result = false;
        } else if (!hasPropertyTablesDefinition) {
          // If there is contentMetadata, then there MUST be propertyTables
          const message =
            `The subtree defines 'contentMetadata' but ` +
            `defines no property tables`;
          const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
            path,
            message
          );
          context.addIssue(issue);
          result = false;
        } else if (
          defined(this._validationState.validatedSchema) &&
          defined(validatedPropertyTables)
        ) {
          for (let i = 0; i < contentMetadata.length; i++) {
            const elementPath = contentMetadataPath + "/" + i;
            const elementName = "contentMetadata/" + i;
            const element = contentMetadata[i];
            // Each contentMetadata MUST be an integer of at least 0
            // Each contentMetadata MUST be smaller than the numberOfPropertyTables
            if (
              !BasicValidator.validateIntegerRange(
                elementPath,
                elementName,
                element,
                0,
                true,
                validatedPropertyTables.length,
                false,
                context
              )
            ) {
              result = false;
            }
          }
        }
      }
    }

    // Validate the subtreeMetadata
    const subtreeMetadata = subtree.subtreeMetadata;
    const subtreeMetadataPath = path + "/subtreeMetadata";
    if (defined(subtreeMetadata)) {
      if (!this._validationState.hasSchemaDefinition) {
        // If there is subtreeMetadata, then there MUST be a schema definition
        const message =
          `The subtree defines 'subtreeMetadata' but ` +
          `there was no schema definition`;
        const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
          path,
          message
        );
        context.addIssue(issue);
        result = false;
      } else if (defined(this._validationState.validatedSchema)) {
        if (
          !MetadataEntityValidator.validateMetadataEntity(
            subtreeMetadataPath,
            "subtreeMetadata",
            subtreeMetadata,
            this._validationState.validatedSchema,
            context
          )
        ) {
          result = false;
        }
      }
    }
    return result;
  }

  private async validateBinaryPropertyTables(
    path: string,
    binarySubtreeData: BinarySubtreeData,
    context: ValidationContext
  ): Promise<boolean> {
    const subtree = binarySubtreeData.subtree;
    if (!defined(subtree.propertyTables)) {
      return true;
    }
    if (!defined(this._validationState.validatedSchema)) {
      return false;
    }
    const binaryBufferStructure = binarySubtreeData.binaryBufferStructure;
    const binaryBufferData = binarySubtreeData.binaryBufferData;

    let result = true;

    // Obtain the structural information about the schema
    // that is required for validating each property table
    const schema = this._validationState.validatedSchema;
    const classes = defaultValue(schema.classes, {});
    const binaryEnumInfo = MetadataUtilities.computeBinaryEnumInfo(schema);
    const propertyTables = defaultValue(subtree.propertyTables, []);
    for (const propertyTable of propertyTables) {
      const classId = propertyTable.class;
      const metadataClass = classes[classId];

      // Create the `BinaryPropertyTable` for each property table,
      // which contains everything that is required for the
      // validation of the binary representation of the
      // property table
      const binaryPropertyTable: BinaryPropertyTable = {
        propertyTable: propertyTable,
        metadataClass: metadataClass,
        binaryEnumInfo: binaryEnumInfo,
        binaryBufferStructure: binaryBufferStructure,
        binaryBufferData: binaryBufferData,
      };

      if (
        !BinaryPropertyTableValidator.validateBinaryPropertyTable(
          path,
          binaryPropertyTable,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }
}
