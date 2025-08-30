import { defined } from "3d-tiles-tools";

import { Validator } from "../validation/Validator";
import { ValidationContext } from "../validation/ValidationContext";
import { ValidationIssue } from "../validation/ValidationIssue";

import { ContentValidationIssues } from "../issues/ContentValidationIssues";
import { GltfExtensionValidators } from "../validation/gltf/GltfExtensionValidators";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const validator = require("gltf-validator");

/**
 * A thin wrapper around the `gltf-validator`, implementing the
 * `Validator` interface for glTF- and GLB data that is given
 * in a Buffer.
 *
 * @internal
 */
export class GltfValidator implements Validator<Buffer> {
  /**
   * The maximum number of issues that should be reported by
   * the glTF validator. For large glTF assets that contain
   * "completely invalid" data, a large number of issues
   * can cause out-of-memory errors.
   * See https://github.com/CesiumGS/3d-tiles-validator/issues/290
   */
  private static readonly MAX_ISSUES = 1000;

  /**
   * Creates a `ValidationIssue` object for the given 'message' object
   * that appears in the output of the glTF validator.
   *
   * @param gltfMessage - The glTF validator message
   * @returns The `ValidationIssue`
   */
  private static createValidationIssueFromGltfMessage(
    gltfMessage: any
  ): ValidationIssue {
    const path = gltfMessage.pointer;
    const message = gltfMessage.message;
    if (gltfMessage.severity == 0) {
      const issue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
        path,
        message
      );
      return issue;
    }
    if (gltfMessage.severity == 1) {
      const issue = ContentValidationIssues.CONTENT_VALIDATION_WARNING(
        path,
        message
      );
      return issue;
    }
    const issue = ContentValidationIssues.CONTENT_VALIDATION_INFO(
      path,
      message
    );
    return issue;
  }

  /**
   * The data that is given as the `input` to `validateObject` might
   * contain padding bytes (for example, when it was extracted
   * from a B3DM file).
   *
   * If the given input is GLB data, then this method will strip
   * any padding bytes, by restricting the buffer to the length
   * that was obtained from the GLB header.
   *
   * If the given data is not GLB data (for example, it might be
   * glTF JSON data!), then the buffer is returned, unmodified.
   *
   * @param input - The buffer, including possible padding
   * @returns The resulting buffer
   */
  private static stripPadding(input: Buffer): Buffer {
    // Handle the cases that indicate that the data is
    // not GLB data. These cases do actually indicate
    // errors, but will be handled by the glTF validator.
    if (input.length < 12) {
      return input;
    }
    const magic = input.readInt32LE(0);
    if (magic !== 0x46546c67) {
      return input;
    }
    const length = input.readInt32LE(8);
    if (length >= input.length) {
      return input;
    }
    const inputWithoutPadding = input.subarray(0, length);
    return inputWithoutPadding;
  }

  async validateObject(
    uri: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const inputWithoutPadding = GltfValidator.stripPadding(input);
    const resourceResolver = context.getResourceResolver();
    let gltfResult = undefined;
    try {
      gltfResult = await validator.validateBytes(inputWithoutPadding, {
        uri: uri,
        maxIssues: GltfValidator.MAX_ISSUES,
        externalResourceFunction: (gltfUri: string) => {
          const resolvedDataPromise = resourceResolver.resolveData(gltfUri);
          return resolvedDataPromise.then((resolvedData: any) => {
            if (!defined(resolvedData)) {
              throw "Could not resolve data from " + gltfUri;
            }
            return resolvedData;
          });
        },
      });
    } catch (error) {
      const message = `Content ${uri} caused internal validation error: ${error}`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
        uri,
        message
      );
      context.addIssue(issue);
      return false;
    }

    // Convert all messages from the glTF validator into ValidationIssue
    // objects that act as the "causes" of the content validation issue
    // that may be about to be created
    const allCauses: ValidationIssue[] = [];
    const gltfMessages = gltfResult.issues?.messages ?? [];
    for (const gltfMessage of gltfMessages) {
      //console.log(gltfMessage);
      const cause =
        GltfValidator.createValidationIssueFromGltfMessage(gltfMessage);
      allCauses.push(cause);
    }

    // XXX Draft for filtering.
    // TODO When the filtering removes the only WARNING, then
    // the "gltfResult.issues.numWarnings > 0" does no longer
    // make sense. The number of errors/warnings/infos have to
    // be determined based on the filtered result!
    const causes = GltfValidator.filterCauses(allCauses);

    // If there are any errors, then summarize ALL issues from the glTF
    // validation as 'internal issues' in a CONTENT_VALIDATION_ERROR
    if (gltfResult.issues.numErrors > 0) {
      const path = uri;
      const message = `Content ${uri} caused validation errors`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
        path,
        message
      );
      for (const cause of causes) {
        issue.addCause(cause);
      }
      context.addIssue(issue);

      // Consider the object to be invalid
      return false;
    }

    // If there are any warnings, then summarize them in a
    // CONTENT_VALIDATION_WARNING, but still consider the
    // object to be valid.
    if (gltfResult.issues.numWarnings > 0) {
      const path = uri;
      const message = `Content ${uri} caused validation warnings`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_WARNING(
        path,
        message
      );

      for (const cause of causes) {
        issue.addCause(cause);
      }
      context.addIssue(issue);
    } else if (gltfResult.issues.numInfos > 0) {
      // If there are no warnings, but infos, then summarize them in a
      // CONTENT_VALIDATION_INFO, but still consider the
      // object to be valid.

      const path = uri;
      const message = `Content ${uri} caused validation infos`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_INFO(
        path,
        message
      );

      for (const cause of causes) {
        issue.addCause(cause);
      }
      context.addIssue(issue);
    }

    // When the glTF itself is considered to be valid, then perform
    // the validation of the Cesium glTF metadata extensions
    const extensionsValid =
      await GltfExtensionValidators.validateGltfExtensions(uri, input, context);
    if (!extensionsValid) {
      return false;
    }

    return true;
  }

  /**
   * Tries to extract an extension name from the message that is generated by
   * the glTF Validator when it encounters an extension that is not supported.
   *
   * This makes assumptions about the structure of the message, and that it
   * is (verbatim) the message as it is generated by the glTF validator.
   *
   * @param message - The validation message
   * @returns The unsupported extension name, or `undefined` if the message
   * does not indicate an unsupported extension
   */
  private static extractUnsupportedExtensionName(
    message: string
  ): string | undefined {
    // Example:
    // "Cannot validate an extension as it is not supported by the validator: 'EXT_mesh_features'.",
    const prefix =
      "Cannot validate an extension as it is not supported by the validator: '";
    if (message.startsWith(prefix)) {
      const extensionName = message.substring(
        prefix.length,
        message.length - 2
      );
      return extensionName;
    }
    return undefined;
  }

  /**
   * Filter the given list of validation issues based on the knowledge about
   * the the glTF extension validations that are implemented as part of the
   * 3D Tiles validator.
   *
   * The given list are the `ValidationIssue` objects that have been created
   * from the messages of the full glTF Validator output, using
   * `createValidationIssueFromGltfMessage`.
   *
   * @param causes - The causes
   * @returns The filtered causes
   */
  private static filterCauses(causes: ValidationIssue[]): ValidationIssue[] {
    console.log("Filtering causes");
    const filteredCauses: ValidationIssue[] = causes.filter(
      (issue) => !GltfValidator.shouldRemove(issue)
    );
    return filteredCauses;
  }

  // TODO DRAFT
  private static shouldRemove(issue: ValidationIssue): boolean {
    const message = issue.message;

    // Messages about unsupported extensions should be removed
    // if and only if they are about an extension that was
    // registered in the GltfExtensionValidators
    const unsupportedExtensionName =
      GltfValidator.extractUnsupportedExtensionName(message);
    if (unsupportedExtensionName) {
      const isRegistered = GltfExtensionValidators.isRegistered(
        unsupportedExtensionName
      );
      if (isRegistered) {
        console.log(
          "Filtering out message about " +
            unsupportedExtensionName +
            " not being supported in glTF Validator"
        );
        return true;
      }
    }

    // TODO XXX DUMMY IMPLEMENTATION
    if (unsupportedExtensionName === "KHR_texture_basisu") {
      console.warn(
        "Filtering out message about KHR_texture_basisu not being supported!"
      );
      return true;
    }
    if (message.startsWith("Invalid value 'image/ktx2'.")) {
      console.warn("Filtering out message invalid image media type!");
      return true;
    }
    if (message === "Image format not recognized.") {
      console.warn("Filtering out unrecognized image format!");
      return true;
    }

    return false;
  }
}
