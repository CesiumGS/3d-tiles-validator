import { defined } from "3d-tiles-tools";
import { defaultValue } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { BasicValidator } from "./BasicValidator";

import { BufferObject } from "3d-tiles-tools";
import { BufferView } from "3d-tiles-tools";

import { BinaryBufferStructure } from "3d-tiles-tools";

import { StructureValidationIssues } from "../issues/StructureValidationIssues";
import { SemanticValidationIssues } from "../issues/SemanticValidationIssues";

/**
 * A class for validations related to binary buffer structures.
 *
 * This is the information that is stored in a `BinaryBufferStructure`,
 * namely the `buffers` and `bufferViews`, which may be part of a `Subtree`.
 *
 * The validation here is split into two parts:
 *
 * - validateBinaryBufferStructure Performs the JSON-level validation
 *   of the `buffer` and `bufferView` objects
 *
 * - validateBinaryBufferStructureConsistency Performs the consistency
 *   validation of the buffers and buffer views in terms of the
 *   memory layout, and is supposed to be called only after the
 *   JSON-level validation has been performed
 *
 * @internal
 */
export class BinaryBufferStructureValidator {
  /**
   * Performs the validation of the given `BinaryBufferStructure`
   *
   * @param path - The path for `ValidationIssue` instances
   * @param binaryBufferStructure - The `BinaryBufferStructure` object
   * @param firstBufferUriIsRequired - If this is `false`, then the
   * first buffer may omit the `uri` property, namely when it refers
   * to a  binary chunk, for example, of a binary `.subtree` file.
   * @param context - The `ValidationContext`
   * @returns Whether the object was valid
   */
  static validateBinaryBufferStructure(
    path: string,
    binaryBufferStructure: BinaryBufferStructure,
    firstBufferUriIsRequired: boolean,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate the buffers
    const buffers = binaryBufferStructure.buffers;
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
        for (let i = 0; i < buffers.length; i++) {
          const buffer = buffers[i];
          const bufferPath = buffersPath + "/" + i;
          const bufferUriIsRequired = firstBufferUriIsRequired || i > 0;
          if (
            !this.validateBuffer(
              bufferPath,
              "buffers/" + i,
              buffer,
              bufferUriIsRequired,
              context
            )
          ) {
            result = false;
          }
        }
      }
    }
    // Validate the bufferViews
    const bufferViews = binaryBufferStructure.bufferViews;
    const bufferViewsPath = path + "/bufferViews";
    if (defined<any>(bufferViews)) {
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
        for (let i = 0; i < bufferViews.length; i++) {
          const bufferView = bufferViews[i];
          const bufferViewPath = bufferViewsPath + "/" + i;
          if (
            !BinaryBufferStructureValidator.validateBufferView(
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
    return result;
  }

  /**
   * Performs the validation to ensure that the given object is a
   * valid `BufferObject` object.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param name - The name of the object
   * @param buffer - The `BufferObject` object
   * @param bufferUriIsRequired - Whether the buffer must have a `uri`
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateBuffer(
    path: string,
    name: string,
    buffer: BufferObject,
    bufferUriIsRequired: boolean,
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

    // When the bufferUriIsRequired, then the uri MUST be defined
    if (bufferUriIsRequired && !defined(uri)) {
      const message = `The 'uri' property of the buffer is required`;
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
   * @param path - The path for the `ValidationIssue` instances
   * @param name - The name of the object
   * @param bufferView - The `BufferView` object
   * @param context - The `ValidationContext` that any issues will be added to
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
   * Validate the consistency of the `buffer` and `bufferView` objects
   * in the given binary buffer structure.
   *
   * This assumes that the basic (JSON-level) structural validations
   * have already been performed. It will only validate the consistency
   * of the memory layout of buffer views and buffers.
   *
   * @param path - The path for the `ValidationIssue` instances
   * @param binaryBufferStructure - The `BinaryBufferStructure` object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static validateBinaryBufferStructureConsistency(
    path: string,
    binaryBufferStructure: BinaryBufferStructure,
    context: ValidationContext
  ): boolean {
    let result = true;

    // Validate the consistency of the bufferViews
    const buffers = defaultValue(binaryBufferStructure.buffers, []);
    const bufferViews = defaultValue(binaryBufferStructure.bufferViews, []);
    for (let i = 0; i < bufferViews.length; i++) {
      const bufferView = bufferViews[i];
      const bufferViewPath = path + "/bufferViews/" + i;

      // The buffer (index) MUST be smaller than the number of buffers
      if (
        !BasicValidator.validateIntegerRange(
          bufferViewPath + "/buffer",
          "buffer",
          bufferView.buffer,
          0,
          true,
          buffers.length,
          false,
          context
        )
      ) {
        result = false;
      } else {
        const bufferViewEnd = bufferView.byteOffset + bufferView.byteLength;
        const buffer = buffers[bufferView.buffer];

        // The end of the buffer view MUST be at most the buffer length
        if (bufferViewEnd > buffer.byteLength) {
          const message =
            `The bufferView has an offset of ${bufferView.byteOffset} ` +
            `and a length of ${bufferView.byteLength}, yielding ` +
            `${bufferView.byteOffset + bufferView.byteLength}, but buffer ` +
            `${bufferView.buffer} only has a length of ${buffer.byteLength}`;
          const issue = SemanticValidationIssues.BUFFERS_INCONSISTENT(
            bufferViewPath,
            message
          );
          context.addIssue(issue);
          result = false;
        }
      }
    }

    // NOTE: One could consider to require bufferViews to NOT overlap.
    // But there does not seem to be a strong, convincing reason for that...

    return result;
  }
}
