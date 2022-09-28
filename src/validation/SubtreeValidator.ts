import { defined } from "../base/defined";
import { bufferToJson } from "../base/bufferToJson";

import { ResourceTypes } from "../io/ResourceTypes";
import { ResourceResolver } from "../io/ResourceResolver";

import { Validator } from "./Validator";
import { ValidationContext } from "./ValidationContext";
import { ValidationState } from "./ValidationState";
import { BasicValidator } from "./BasicValidator";
import { BinaryValidator } from "./BinaryValidator";
import { MetadataEntityValidator } from "./MetadataEntityValidator";
import { SubtreeConsistencyValidator } from "./SubtreeConsistencyValidator";
import { PropertyTableValidator } from "./PropertyTableValidator";
import { SubtreeInfoValidator } from "./SubtreeInfoValidator";

import { BufferObject } from "../structure/BufferObject";
import { Subtree } from "../structure/Subtree";
import { BufferView } from "../structure/BufferView";
import { Availability } from "../structure/Availability";
import { TileImplicitTiling } from "../structure/TileImplicitTiling";

import { JsonValidationIssues } from "../issues/JsonValidationIssues";
import { IoValidationIssues } from "../issues/IoValidationIssue";
import { StructureValidationIssues } from "../issues/StructureValidationIssues";
import { RootPropertyValidator } from "./RootPropertyValidator";

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
 * @private
 */
export class SubtreeValidator implements Validator<Buffer> {
  /**
   * Preliminary:
   *
   * An optional validator that will be applied to the `Subtree`
   * object, after it has been parsed from the JSON, but before
   * any further validation takes place.
   */
  private _genericValidator: Validator<any> | undefined;

  /**
   * The URI that the subtree data was read from
   */
  private _uri: string;

  /**
   * The `ValidationState` that carries information about
   * the metadata schema
   */
  private _validationState: ValidationState;

  /**
   * The `TileImplicitTiling` object that carries information
   * about the expected structure of the subtree
   */
  private _implicitTiling: TileImplicitTiling | undefined;

  /**
   * The `ResourceResolver` that will be used to resolve
   * buffer URIs
   */
  private _resourceResolver: ResourceResolver;

  /**
   * Creates a new instance.
   *
   * Preliminary:
   *
   * The given validator will be applied to the `Subtree`
   * object, after it has been parsed from the JSON, but before
   * any further validation takes place.
   *
   * @param genericValidator The optional generic validator
   * @param uri The URI that the subtree data was read from
   * @param validationState The `ValidationState`
   * @param implicitTiling The `TileImplicitTiling` that
   * defines the expected structure of the subtree
   * @param resourceResolver The `ResourceResolver` that
   * will be used to resolve buffer URIs.
   */
  constructor(
    genericValidator: Validator<any> | undefined,
    uri: string,
    validationState: ValidationState,
    implicitTiling: TileImplicitTiling | undefined,
    resourceResolver: ResourceResolver
  ) {
    this._genericValidator = genericValidator;
    this._uri = uri;
    this._validationState = validationState;
    this._implicitTiling = implicitTiling;
    this._resourceResolver = resourceResolver;
  }

  /**
   * Performs the validation of the given buffer, which is supposed to
   * contain subtree data, either in binary form or as JSON.
   *
   * @param input The subtree data
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether the object was valid or not.
   */
  async validateObject(
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const isSubt = ResourceTypes.isSubt(input);
    if (isSubt) {
      const result = await this.validateSubtreeBinaryData(input, context);
      return result;
    }
    const isJson = ResourceTypes.isProbablyJson(input);
    if (isJson) {
      const result = await this.validateSubtreeJsonData(input, context);
      return result;
    }
    const message = `Subtree input data was neither a subtree binary nor JSON`;
    const path = this._uri;
    const issue = IoValidationIssues.IO_ERROR(path, message);
    context.addIssue(issue);
    return false;
  }

  /**
   * Performs the validation of the given buffer, which contains the
   * data from a binary subtree file
   *
   * @param input The contents of a binary subtree file
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether the object was valid or not.
   */
  private async validateSubtreeBinaryData(
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const path = this._uri;

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
    let subtreeJson: any;
    let subtree: Subtree;
    try {
      subtreeJson = bufferToJson(jsonBuffer);
      subtree = subtreeJson;
    } catch (error) {
      const message = `Could not parse subtree JSON: ${error}`;
      const issue = IoValidationIssues.JSON_PARSE_ERROR(this._uri, message);
      context.addIssue(issue);
      return false;
    }

    // Extract the binary buffer
    const binaryStartByteOffset = jsonEndByteOffset;
    const binaryEndByteOffset =
      binaryStartByteOffset + Number(binaryByteLength);
    const binaryBufferSlice = input.subarray(
      binaryStartByteOffset,
      binaryEndByteOffset
    );
    const binaryBuffer =
      binaryBufferSlice.length > 0 ? binaryBufferSlice : undefined;

    const result = this.validateSubtree(path, subtree, binaryBuffer, context);
    return result;
  }

  /**
   * Performs the validation of the subtree JSON data in the given buffer
   *
   * @param input The buffer that contains the subtree JSON data
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether the object was valid or not.
   */
  private async validateSubtreeJsonData(
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const path = this._uri;
    try {
      const inputString = input.toString();
      const subtree: Subtree = JSON.parse(inputString);
      const result = await this.validateSubtree(
        path,
        subtree,
        undefined,
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
   * Performs the validation of the given `Subtree` object and the
   * (optional) binary buffer that is associated with it
   *
   * @param path The path for `ValidationIssue` instances
   * @param subtree The `Subtree` object
   * @param binaryBuffer The optional binary buffer
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   * and indicates whether the object was valid or not.
   */
  private async validateSubtree(
    path: string,
    subtree: Subtree,
    binaryBuffer: Buffer | undefined,
    context: ValidationContext
  ): Promise<boolean> {
    const hasBinaryBuffer = defined(binaryBuffer);

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

    // Validate the structure of the given subtree object,
    // on the level of JSON validity
    const structureIsValid = this.validateSubtreeObject(
      subtree,
      hasBinaryBuffer,
      context
    );
    if (!structureIsValid) {
      result = false;
      return result;
    }

    // If the structure was valid, perform the deeper consistency validation
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

    // If the structure was valid and consistent, perform the validity
    // checks for the actual buffer data
    if (defined(this._implicitTiling)) {
      const dataIsConsistent = await SubtreeInfoValidator.validateSubtreeInfo(
        path,
        subtree,
        binaryBuffer,
        this._implicitTiling!,
        this._resourceResolver,
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
   * @param subtree The `Subtree` object
   * @param hasBinaryBuffer Whether the subtree has an associated
   * binary buffer
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private validateSubtreeObject(
    subtree: Subtree,
    hasBinaryBuffer: boolean,
    context: ValidationContext
  ): boolean {
    let result = true;
    if (defined(this._genericValidator)) {
      const genericResult = this._genericValidator!.validateObject(
        subtree,
        context
      );
      if (!genericResult) {
        result = false;
      }
    }
    const path = this._uri;
    if (!this.validateSubtreeBasic(path, subtree, hasBinaryBuffer, context)) {
      return false;
    }
    if (!this.validateMetadata(path, subtree, context)) {
      return false;
    }
    return result;
  }

  /**
   * Performs the validation to ensure that the given object is a
   * valid `subtree` object.
   *
   * This method will perform the basic validation of the JSON part,
   * excluding the metadata.
   * The consistency and binary data will be validated separately.
   *
   * @param path The path for the `ValidationIssue` instances
   * @param subtree The `Subtree` object
   * @param context The `ValidationContext` that any issues will be added to
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

    // Validate the buffers
    const buffers = subtree.buffers;
    const buffersPath = path + "/buffers";
    if (defined(buffers)) {
      // The buffers MUST be an array of at least 1 objects
      if (
        !BasicValidator.validateArray(
          buffersPath,
          "buffers",
          buffers,
          1,
          undefined,
          "object",
          context
        )
      ) {
        result = false;
      } else {
        // Validate each buffer
        for (let i = 0; i < buffers!.length; i++) {
          const buffer = buffers![i];
          const bufferPath = buffersPath + "/" + i;
          if (
            !this.validateBuffer(
              bufferPath,
              "buffers/" + i,
              buffer,
              hasBinaryBuffer,
              context
            )
          ) {
            result = false;
          }
        }
      }
    }
    // Validate the bufferViews
    const bufferViews = subtree.bufferViews;
    const bufferViewsPath = path + "/bufferViews";
    if (defined(bufferViews)) {
      //The bufferViews MUST be an array of at least 1 objects
      if (
        !BasicValidator.validateArray(
          bufferViewsPath,
          "bufferViews",
          bufferViews,
          1,
          undefined,
          "object",
          context
        )
      ) {
        result = false;
      } else {
        // Validate each bufferView
        for (let i = 0; i < bufferViews!.length; i++) {
          const bufferView = bufferViews![i];
          const bufferViewPath = bufferViewsPath + "/" + i;
          if (
            !SubtreeValidator.validateBufferView(
              bufferViewPath,
              "bufferViews/" + i,
              bufferView,
              context
            )
          ) {
            result = false;
          }
        }
      }
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
        for (let i = 0; i < contentAvailability!.length; i++) {
          const elementPath = contentAvailabilityPath + "/" + i;
          const elementName = "contentAvailability/" + i;
          const element = contentAvailability![i];
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
   * valid `BufferObject` object.
   *
   * @param path The path for the `ValidationIssue` instances
   * @param name The name of the object
   * @param buffer The `BufferObject` object
   * @param hasBinaryBuffer Whether the subtree has an internal buffer
   * (i.e. it was read from a binary subtree file)
   * @param context The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private validateBuffer(
    path: string,
    name: string,
    buffer: BufferObject,
    hasBinaryBuffer: boolean,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, buffer, context)) {
      return false;
    }

    let result = true;

    // Validate the uri
    const uri = buffer.uri;
    const uriPath = path + "/uri";

    // When there is no binary buffer (from a binary subtree file),
    // then the uri MUST be defined
    if (!hasBinaryBuffer && !defined(uri)) {
      const message =
        `The 'uri' property of a buffer is required ` +
        `when there is no binary buffer`;
      const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
        uriPath,
        message
      );
      context.addIssue(issue);
      result = false;
    }
    if (defined(uri)) {
      // The uri MUST be a string
      if (!BasicValidator.validateString(uriPath, "uri", uri, context)) {
        result = false;
      }
    }

    // Validate the byteLength
    // The byteLength MUST be defined
    // The byteLength MUST be an integer of at least 1
    const byteLength = buffer.byteLength;
    const byteLengthPath = path + "/byteLength";
    if (
      !BasicValidator.validateIntegerRange(
        byteLengthPath,
        "byteLength",
        byteLength,
        1,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate the name
    const theName = buffer.name;
    const namePath = path + "/name";
    if (defined(theName)) {
      // The name MUST be a string
      // The name MUST have a length of at least 1
      if (
        !BasicValidator.validateStringLength(
          namePath,
          "name",
          theName,
          1,
          undefined,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Performs the validation to ensure that the given object is a
   * valid `BufferView` object.
   *
   * @param path The path for the `ValidationIssue` instances
   * @param name The name of the object
   * @param bufferView The `BufferView` object
   * @param context The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateBufferView(
    path: string,
    name: string,
    bufferView: BufferView,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, name, bufferView, context)) {
      return false;
    }

    let result = true;

    // Validate the buffer
    // The buffer MUST be defined
    // The buffer MUST be an integer of at least 0
    const buffer = bufferView.buffer;
    const bufferPath = path + "/buffer";
    if (
      !BasicValidator.validateIntegerRange(
        bufferPath,
        "buffer",
        buffer,
        0,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate the byteOffset
    // The byteOffset MUST be defined
    // The byteOffset MUST be an integer of at least 0
    const byteOffset = bufferView.byteOffset;
    const byteOffsetPath = path + "/byteOffset";
    if (
      !BasicValidator.validateIntegerRange(
        byteOffsetPath,
        "byteOffset",
        byteOffset,
        0,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate the byteLength
    // The byteLength MUST be defined
    // The byteLength MUST be an integer of at least 1
    const byteLength = bufferView.byteLength;
    const byteLengthPath = path + "/byteLength";
    if (
      !BasicValidator.validateIntegerRange(
        byteLengthPath,
        "byteLength",
        byteLength,
        1,
        true,
        undefined,
        false,
        context
      )
    ) {
      result = false;
    }

    // Validate the name
    const theName = bufferView.name;
    const namePath = path + "/name";
    if (defined(theName)) {
      // The name MUST be a string
      // The name MUST have a length of at least 1
      if (
        !BasicValidator.validateStringLength(
          namePath,
          "name",
          theName,
          1,
          undefined,
          context
        )
      ) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Performs the validation to ensure that the given object is a
   * valid `availability` object.
   *
   * @param path The path for the `ValidationIssue` instances
   * @param name The name of the object
   * @param availability The `Availability` object
   * @param context The `ValidationContext` that any issues will be added to
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

    const bitstream = availability!.bitstream;
    const bitstreamPath = path + "/bitstream";

    const constant = availability!.constant;
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
          bitstream!,
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
    const availableCount = availability!.availableCount;
    const availableCountPath = path + "/availableCount";
    if (defined(availableCount)) {
      // The availableCount MUST be an integer of at least 0
      if (
        !BasicValidator.validateIntegerRange(
          availableCountPath,
          "availableCount",
          availableCount!,
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
   * @param path The path for `ValidationIssue` instances
   * @param subtree The `Subtree` object
   * @param context The `ValidationContext`
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
          for (let i = 0; i < propertyTables!.length; i++) {
            const propertyTable = propertyTables![i];
            const propertyTablePath = propertyTablesPath + "/" + i;
            if (
              !PropertyTableValidator.validatePropertyTable(
                propertyTablePath,
                propertyTable,
                this._validationState.validatedSchema!,
                context
              )
            ) {
              result = false;
              propertyTablesAreValid = false;
            }
          }
          if (propertyTablesAreValid) {
            validatedPropertyTables = propertyTables!;
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
          tileMetadata!,
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
              tileMetadata!,
              0,
              true,
              validatedPropertyTables!.length,
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
          for (let i = 0; i < contentMetadata!.length; i++) {
            const elementPath = contentMetadataPath + "/" + i;
            const elementName = "contentMetadata/" + i;
            const element = contentMetadata![i];
            // Each contentMetadata MUST be an integer of at least 0
            // Each contentMetadata MUST be smaller than the numberOfPropertyTables
            if (
              !BasicValidator.validateIntegerRange(
                elementPath,
                elementName,
                element,
                0,
                true,
                validatedPropertyTables!.length,
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
            subtreeMetadata!,
            this._validationState.validatedSchema!,
            context
          )
        ) {
          result = false;
        }
      }
    }
    return result;
  }
}
