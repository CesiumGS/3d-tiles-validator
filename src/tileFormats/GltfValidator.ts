import { defined } from "../base/defined";

import { Validator } from "../validation/Validator";
import { ValidationContext } from "../validation/ValidationContext";
import { ValidationIssue } from "../validation/ValidationIssue";

import { ContentValidationIssues } from "../issues/ContentValidationIssues";

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

  async validateObject(
    uri: string,
    input: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    const resourceResolver = context.getResourceResolver();
    let gltfResult = undefined;
    try {
      gltfResult = await validator.validateBytes(input, {
        uri: uri,
        externalResourceFunction: (gltfUri: string) => {
          const resolvedDataPromise = resourceResolver.resolveData(gltfUri);
          return resolvedDataPromise.then((resolvedData) => {
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

    // If there are any errors, then summarize ALL issues from the glTF
    // validation as 'internal issues' in a CONTENT_VALIDATION_ERROR
    if (gltfResult.issues.numErrors > 0) {
      const path = uri;
      const message = `Content ${uri} caused validation errors`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
        path,
        message
      );
      for (const gltfMessage of gltfResult.issues.messages) {
        //console.log(gltfMessage);
        const cause =
          GltfValidator.createValidationIssueFromGltfMessage(gltfMessage);
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

      for (const gltfMessage of gltfResult.issues.messages) {
        //console.log(gltfMessage);
        const cause =
          GltfValidator.createValidationIssueFromGltfMessage(gltfMessage);
        issue.addCause(cause);
      }
      context.addIssue(issue);
    }

    // If there are any infos, then summarize them in a
    // CONTENT_VALIDATION_INFO, but still consider the
    // object to be valid.
    if (gltfResult.issues.numInfos > 0) {
      const path = uri;
      const message = `Content ${uri} caused validation infos`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_INFO(
        path,
        message
      );

      for (const gltfMessage of gltfResult.issues.messages) {
        //console.log(gltfMessage);
        const cause =
          GltfValidator.createValidationIssueFromGltfMessage(gltfMessage);
        issue.addCause(cause);
      }
      context.addIssue(issue);
    }

    return true;
  }
}
