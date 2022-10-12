import paths from "path";

import { defined } from "../base/defined";

import { Uris } from "../io/Uris";
import { ResourceTypes } from "../io/ResourceTypes";

import { ValidationContext } from "./ValidationContext";
import { ContentData } from "./ContentData";
import { ContentDataValidators } from "./ContentDataValidators";

import { Content } from "../structure/Content";

import { IoValidationIssues } from "../issues/IoValidationIssue";
import { ContentValidationIssues } from "../issues/ContentValidationIssues";

/**
 * A class for validation of the data that is pointed to by a `content.uri`.
 *
 * @private
 */
export class ContentDataValidator {
  /**
   * Validate the actual data that is referred to by the URI in the
   * given content.
   *
   * This assumes that the given content has already been validated
   * to be structurally valid, using the `ContentValidator`.
   *
   * @param contentPath The path for the `ValidationIssue` instances
   * @param content The `Content` object
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  static async validateContentData(
    contentPath: string,
    content: Content,
    context: ValidationContext
  ): Promise<boolean> {
    // Validate the uri
    const uri = content.uri;
    if (Uris.isAbsoluteUri(uri)) {
      const path = contentPath;
      const message =
        `Tile content ${contentPath} refers to absolute URI ${uri}, ` +
        `which is not validated`;
      const issue = IoValidationIssues.IO_WARNING(path, message);
      context.addIssue(issue);
      return true;
    }

    const resourceResolver = context.getResourceResolver();
    const contentData = await resourceResolver.resolve(uri);

    // When the content data is not defined, this means that
    // the URI could not be resolved
    if (!defined(contentData)) {
      const path = contentPath;
      const message =
        `Tile content ${contentPath} refers to URI ${uri}, ` +
        `which could not be resolved`;
      const issue = IoValidationIssues.IO_WARNING(path, message);
      context.addIssue(issue);
      return true;
    }

    const result = await ContentDataValidator.validateContentDataInternal(
      contentPath,
      uri,
      contentData!,
      context
    );
    return result;
  }

  /**
   * Perform the validation of the given content data.
   *
   * The data may be binary data from tile formats (B3DM, GLB...),
   * or JSON data (for external tilesets or glTF). The method will
   * try to figure out the actual data type using a lot of guesses
   * and magic (i.e. magic headers), and try to validate the data.
   *
   * If the data causes validation issues, they will be summarized
   * into a `CONTENT_VALIDATION_ERROR` or `CONTENT_VALIDATION_WARNING`
   * that is added to the given context.
   *
   * If the data type cannot be determined, an `CONTENT_VALIDATION_WARNING`
   * will be added to the given context.
   *
   * @param contentPath The path for the `ValidationIssue` instances.
   * @param contentUri The URI of the content
   * @param contentDataBuffer The buffer containing the actual content data
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateContentDataInternal(
    contentPath: string,
    contentUri: string,
    contentDataBuffer: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    // If the data is probably JSON, try to parse it in any case,
    // and bail out if it cannot be parsed
    const isJson = ResourceTypes.isProbablyJson(contentDataBuffer);
    let parsedObject = undefined;
    if (isJson) {
      try {
        parsedObject = JSON.parse(contentDataBuffer.toString());
      } catch (error) {
        const message = `${error}`;
        const issue = IoValidationIssues.JSON_PARSE_ERROR(contentUri, message);
        context.addIssue(issue);
        return false;
      }
    }

    // Create the `ContentData`, and look up a
    // matching content data validator
    const contentData = new ContentData(
      contentUri,
      contentDataBuffer,
      parsedObject
    );
    const dataValidator =
      ContentDataValidators.findContentDataValidator(contentData);
    if (!defined(dataValidator)) {
      const path = contentPath;
      const message =
        `Tile content ${contentPath} refers to URI ${contentUri}, ` +
        `for which no content type could be determined`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_WARNING(
        path,
        message
      );
      context.addIssue(issue);
      return true;
    }

    // Create a new context to collect the issues that are found in
    // the data. If there are issues, then they will be stored as
    // the 'causes' of a single content validation issue.
    const dirName = paths.dirname(contentData.uri);
    const derivedContext = context.derive(dirName);
    const result = await dataValidator!.validateObject(
      contentUri,
      contentDataBuffer,
      derivedContext
    );
    const derivedResult = derivedContext.getResult();
    const issue = ContentValidationIssues.createFrom(contentUri, derivedResult);
    if (issue) {
      context.addIssue(issue);
    }
    return result;
  }
}
