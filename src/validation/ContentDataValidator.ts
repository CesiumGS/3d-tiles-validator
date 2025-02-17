import paths from "path";

import { Uris } from "3d-tiles-tools";
import { defined } from "3d-tiles-tools";
import { ContentData } from "3d-tiles-tools";
import { ContentDataTypes } from "3d-tiles-tools";
import { ContentDataTypeRegistry } from "3d-tiles-tools";
import { LazyContentData } from "3d-tiles-tools";
import { Content } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { ContentDataValidators } from "./ContentDataValidators";

import { IoValidationIssues } from "../issues/IoValidationIssue";
import { ContentValidationIssues } from "../issues/ContentValidationIssues";
import { ValidationOptionChecks } from "./ValidationOptionChecks";
import { ValidationIssueFilters } from "./ValidationIssueFilters";
import { ValidationIssueSeverity } from "./ValidationIssueSeverity";
import { ValidationResult } from "./ValidationResult";
import { Validator } from "./Validator";

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

    //console.log('Validating ' +contentPath+" with "+contentUri);

    // Create the `ContentData` that summarizes all information
    // that is required for determining the content type
    const contentData = new LazyContentData(contentUri, resourceResolver);

    // Make sure that the content data can be resolved at all
    const dataExists = await contentData.exists();
    if (!dataExists) {
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

    await ContentDataValidator.trackExtensionsFound(contentData, context);

    const contentDataType = await ContentDataTypeRegistry.findContentDataType(
      contentData
    );
    const isTileset = contentDataType === ContentDataTypes.CONTENT_TYPE_TILESET;
    const is3tz = contentDataType === ContentDataTypes.CONTENT_TYPE_3TZ;

    if (isTileset) {
      const result = await ContentDataValidator.validateExternalTilesetContent(
        contentPath,
        contentUri,
        contentData,
        dataValidator,
        context
      );
      return result;
    }
    const result = await ContentDataValidator.validateSimpleContent(
      contentUri,
      contentData,
      dataValidator,
      is3tz,
      context
    );
    return result;
  }

  /**
   * Implementation of `validateContentDataInternal` for the case that
   * the content is an external tileset.
   *
   * @param contentPath - The path for the `ValidationIssue` instances.
   * @param contentUri - The URI of the content
   * @param context - The `ValidationContext`
   * @param contentData - The content data
   * @param dataValidator - The validator for the content data
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateExternalTilesetContent(
    contentPath: string,
    contentUri: string,
    contentData: ContentData,
    dataValidator: Validator<ContentData>,
    context: ValidationContext
  ): Promise<boolean> {
    // Add the resolved URI of the external tileset to the context as
    // an "activeTilesetUri", to detect cycles
    const resolvedTilesetContentUri = context.resolveUri(contentUri);
    if (context.isActiveTilesetUri(resolvedTilesetContentUri)) {
      const message = `External tileset content ${contentUri} creates a cycle`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_ERROR(
        contentPath,
        message
      );
      context.addIssue(issue);
      return false;
    }
    context.addActiveTilesetUri(resolvedTilesetContentUri);

    // Create a new context to collect the issues that are found in
    // the external tileset. If there are issues, then they will be
    // stored as the 'causes' of a single content validation issue.
    const dirName = paths.dirname(contentData.uri);
    const derivedContext = context.deriveFromUri(dirName);
    const result = await dataValidator.validateObject(
      contentUri,
      contentData,
      derivedContext
    );
    const derivedResult = derivedContext.getResult();

    // Add all extensions that have been found in the external
    // tileset to the current context. They also have to appear
    // in the 'extensionsUsed' of the containing tileset.
    const derivedExtensionsFound = derivedContext.getExtensionsFound();
    for (const derivedExtensionFound of derivedExtensionsFound) {
      context.addExtensionFound(derivedExtensionFound);
    }

    const issue = ContentValidationIssues.createForExternalTileset(
      contentUri,
      derivedResult
    );
    if (issue) {
      context.addIssue(issue);
    }

    context.removeActiveTilesetUri(resolvedTilesetContentUri);

    return result;
  }

  /**
   * Implementation of `validateContentDataInternal` for the case that
   * the content is NOT an external tileset.
   *
   * @param contentUri - The URI of the content
   * @param context - The `ValidationContext`
   * @param contentData - The content data
   * @param dataValidator - The validator for the content data
   * @param is3tz - Whether the content is a 3TZ package
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateSimpleContent(
    contentUri: string,
    contentData: ContentData,
    dataValidator: Validator<ContentData>,
    is3tz: boolean,
    context: ValidationContext
  ): Promise<boolean> {
    // Special handling for 3TZ:
    //
    // The context usually refers to the directory that the content
    // is contained in (for example, a URI like `../images/image.png`
    // that is used in a glTF file like `example/directory/file.gltf`
    // has to be resolved to `example/images/image.png`).
    //
    // But for 3TZ, it has to determine the absolute (!) path from
    // the content URI to even be able to open the 3TZ (because 3TZ
    // can only be a file in the local file system), and there are no
    // resources to be resolved FROM the 3TZ that are NOT part of
    // the 3TZ.
    let dirName = ".";
    if (!is3tz) {
      dirName = paths.dirname(contentData.uri);
    }
    const derivedContext = context.deriveFromUri(dirName);
    const result = await dataValidator.validateObject(
      contentUri,
      contentData,
      derivedContext
    );
    const derivedResult = derivedContext.getResult();
    const options = context.getOptions();
    const filteredDerivedResult = ContentDataValidator.filterResult(
      derivedResult,
      options.contentValidationIssueSeverity
    );
    const issue = ContentValidationIssues.createForContent(
      contentUri,
      filteredDerivedResult
    );
    if (issue) {
      context.addIssue(issue);
    }
    return result;
  }

  /**
   * Filter the given result, and return a new result that only contains
   * validation issues that are at least as severe as the given severity.
   *
   * @param result - The validation result
   * @param severity - The highest validation issue severity that should be included
   * @returns The filtered result
   */
  private static filterResult(
    result: ValidationResult,
    severity: ValidationIssueSeverity
  ) {
    const includedSeverities: ValidationIssueSeverity[] = [];
    if (severity == ValidationIssueSeverity.ERROR) {
      includedSeverities.push(ValidationIssueSeverity.ERROR);
    } else if (severity == ValidationIssueSeverity.WARNING) {
      includedSeverities.push(ValidationIssueSeverity.WARNING);
      includedSeverities.push(ValidationIssueSeverity.ERROR);
    } else {
      includedSeverities.push(ValidationIssueSeverity.INFO);
      includedSeverities.push(ValidationIssueSeverity.WARNING);
      includedSeverities.push(ValidationIssueSeverity.ERROR);
    }
    const filter = ValidationIssueFilters.byIncludedSeverities(
      ...includedSeverities
    );
    const filteredResult = result.filter(filter);
    return filteredResult;
  }

  /**
   * Track the extensions that are used, and which only refer to
   * allowing certain content data types.
   *
   * When a certain content data type that requires an extension
   * is encountered, then the respective extension will be added
   * as a "found" extension to the given context.
   *
   * @param contentData - The `ContentData`
   * @param context - The `ValidationContext`
   */
  private static async trackExtensionsFound(
    contentData: ContentData,
    context: ValidationContext
  ) {
    const contentDataType = await ContentDataTypeRegistry.findContentDataType(
      contentData
    );
    if (contentDataType === ContentDataTypes.CONTENT_TYPE_GLB) {
      context.addExtensionFound("3DTILES_content_gltf");
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_GLTF) {
      context.addExtensionFound("3DTILES_content_gltf");
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_3TZ) {
      context.addExtensionFound("MAXAR_content_3tz");
    } else if (contentDataType === ContentDataTypes.CONTENT_TYPE_GEOJSON) {
      context.addExtensionFound("MAXAR_content_geojson");
    }
  }
}
