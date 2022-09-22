import path from "path";

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
 */
export class GltfValidator implements Validator<Buffer> {
  private _baseDirectory: string;
  private _uri: string;

  constructor(uri: string) {
    this._uri = uri;
    this._baseDirectory = path.dirname(uri);
  }

  static createValidationIssueFromGltfMessage(
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
    const issue = ContentValidationIssues.CONTENT_VALIDATION_WARNING(
      path,
      message
    );
    return issue;
  }

  async validateObject(
    input: Buffer,
    context: ValidationContext
  ): Promise<void> {
    const resourceResolver = context.getResourceResolver();
    const gltfResourceResolver = resourceResolver.derive(this._baseDirectory);
    const uri = this._uri;
    const result = await validator.validateBytes(input, {
      uri: uri,
      externalResourceFunction: (gltfUri: string) => {
        return gltfResourceResolver.resolve(gltfUri);
      },
    });
    if (result.issues.numErrors > 0) {
      const path = uri;
      const message = `Content ${uri} caused validation errors`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
        path,
        message
      );
      for (const gltfMessage of result.issues.messages) {
        //console.log(gltfMessage);
        const internalIssue =
          GltfValidator.createValidationIssueFromGltfMessage(gltfMessage);
        issue.addInternalIssue(internalIssue);
      }
      context.addIssue(issue);
    }
    if (result.issues.numWarnings > 0) {
      const path = uri;
      const message = `Content ${uri} caused validation warnings`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_WARNING(
        path,
        message
      );

      for (const gltfMessage of result.issues.messages) {
        //console.log(gltfMessage);
        const internalIssue =
          GltfValidator.createValidationIssueFromGltfMessage(gltfMessage);
        issue.addInternalIssue(internalIssue);
      }
      context.addIssue(issue);
    }
  }
}
