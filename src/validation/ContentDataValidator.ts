import paths from "path";

import { defined } from "../base/defined";

import { Uris } from "../io/Uris";

import { ValidationContext } from "./ValidationContext";
import { ContentData } from "./ContentData";
import { ContentDataTypes } from "./ContentDataTypes";
import { ContentDataValidators } from "./ContentDataValidators";

import { Content } from "../structure/Content";

import { IoValidationIssues } from "../issues/IoValidationIssue";
import { ContentValidationIssues } from "../issues/ContentValidationIssues";
import { ValidationOptionChecks } from "./ValidationOptionChecks";

/**
 * A class for validation of the data that is pointed to by a `content.uri`.
 *
 * @internal
 */
export class ContentDataValidator {
  /**
   * Validate the actual data that is referred to by the URI in the
   * given content.
   *
   * This assumes that the given content has already been validated
   * to be structurally valid, using the `ContentValidator`.
   *
   * @param contentPath - The path for the `ValidationIssue` instances
   * @param content - The `Content` object
   * @param context - The `ValidationContext`
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

    const result = await ContentDataValidator.validateContentDataInternal(
      contentPath,
      uri,
      context
    );
    return result;
  }

  /**
   * Perform the validation of the content data that is pointed to
   * by the given content URI.
   *
   * If the data causes validation issues, they will be summarized
   * into a `CONTENT_VALIDATION_ERROR` or `CONTENT_VALIDATION_WARNING`
   * that is added to the given context.
   *
   * If the data type cannot be determined, an `CONTENT_VALIDATION_WARNING`
   * will be added to the given context.
   *
   * @param contentPath - The path for the `ValidationIssue` instances.
   * @param contentUri - The URI of the content
   * @param context - The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateContentDataInternal(
    contentPath: string,
    contentUri: string,
    context: ValidationContext
  ): Promise<boolean> {
    const resourceResolver = context.getResourceResolver();

    // Create the `ContentData` that summarizes all information
    // that is requiring for determining the content type
    const contentData = new ContentData(contentUri, resourceResolver);

    // Make sure that the content data can be resolved at all
    const data = await contentData.getData();
    if (data === null) {
      const path = contentPath;
      const message =
        `Tile content ${contentPath} refers to URI ${contentUri}, ` +
        `which could not be resolved`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
        path,
        message
      );
      context.addIssue(issue);
      return false;
    }

    // Check if the content data should be validated
    const options = context.getOptions();
    const shouldValidate = await ValidationOptionChecks.shouldValidate(
      options,
      contentData
    );
    if (!shouldValidate) {
      return true;
    }

    // Find the validator for the content data
    const dataValidator = await ContentDataValidators.findContentDataValidator(
      contentData
    );
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

    ContentDataValidator.trackExtensionsFound(contentData, context);

    // Create a new context to collect the issues that are found in
    // the data. If there are issues, then they will be stored as
    // the 'causes' of a single content validation issue.
    const dirName = paths.dirname(contentData.uri);
    const derivedContext = context.deriveFromUri(dirName);
    const result = await dataValidator!.validateObject(
      contentUri,
      contentData,
      derivedContext
    );
    const derivedResult = derivedContext.getResult();

    const isTileset = await ContentDataTypes.isProbablyTileset(contentData);
    if (isTileset) {
      const issue = ContentValidationIssues.createForExternalTileset(
        contentUri,
        derivedResult
      );
      if (issue) {
        context.addIssue(issue);
      }
    } else {
      const issue = ContentValidationIssues.createForContent(
        contentUri,
        derivedResult
      );
      if (issue) {
        context.addIssue(issue);
      }
    }
    return result;
  }

  /**
   * Track the extensions that are used, and which only refer to
   * allowing certain content data types.
   *
   * When a certain content data type that requires an extension
   * is encountered, then the respective extension will be added
   * as a "used" extension to the given context.
   *
   * @param contentData - The `ContentData`
   * @param context - The `ValidationContext`
   */
  private static async trackExtensionsFound(
    contentData: ContentData,
    context: ValidationContext
  ) {
    const magic = await contentData.getMagic();
    const isGlb = magic === "glTF";
    if (isGlb) {
      context.addExtensionFound("3DTILES_content_gltf");
    }
    const isGltf = await ContentDataTypes.isProbablyGltf(contentData);
    if (isGltf) {
      context.addExtensionFound("3DTILES_content_gltf");
    }
    const isProbably3tz = contentData.extension === ".3tz";
    if (isProbably3tz) {
      context.addExtensionFound("MAXAR_content_3tz");
    }
  }
}
