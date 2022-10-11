import paths from "path";

import { defined } from "../base/defined";

import { Uris } from "../io/Uris";
import { ResourceTypes } from "../io/ResourceTypes";

import { Validators } from "./Validators";
import { ValidationContext } from "./ValidationContext";

import { B3dmValidator } from "../tileFormats/B3dmValidator";
import { I3dmValidator } from "../tileFormats/I3dmValidator";
import { PntsValidator } from "../tileFormats/PntsValidator";
import { CmptValidator } from "../tileFormats/CmptValidator";
import { GltfValidator } from "../tileFormats/GltfValidator";

import { Content } from "../structure/Content";

import { IoValidationIssues } from "../issues/IoValidationIssue";
import { ContentValidationIssues } from "../issues/ContentValidationIssues";
import { Validator } from "./Validator";
import { ContentData } from "./ContentData";

type Entry = {
  predicate: (contentData: ContentData) => boolean;
  dataValidator: Validator<Buffer>;
};

/**
 * A class for validation of the data that is pointed to by a `content.uri`.
 *
 *
 * @private
 */
export class ContentDataValidator {

  static dataValidators: Entry[] = [];

  static registerDefaults() {
    ContentDataValidator.registerByMagic("glTF", new GltfValidator());
    ContentDataValidator.registerByMagic("b3dm", new B3dmValidator());
    ContentDataValidator.registerByMagic("i3dm", new I3dmValidator());
    ContentDataValidator.registerByMagic("cmpt", new CmptValidator());
    ContentDataValidator.registerByMagic("pnts", new PntsValidator());
    ContentDataValidator.registerByMagic("geom", Validators.createEmpty("Skipping 'geom' validation"));
    ContentDataValidator.registerByMagic("vctr", Validators.createEmpty("Skipping 'vctr' validation"));
    ContentDataValidator.registerByExtension(".geojson", Validators.createEmpty("Skipping 'GeoJSON' validation"));
    ContentDataValidator.registerTileset();
    ContentDataValidator.registerGltf();
  }

  static registerByMagic(magic: string, dataValidator: Validator<Buffer>) {
    ContentDataValidator.registerByPredicate(
      (contentData: ContentData) => contentData.magic === magic,
      dataValidator
    );
  }

  static registerByExtension(extension: string, dataValidator: Validator<Buffer>) {
    ContentDataValidator.registerByPredicate(
      (contentData: ContentData) => contentData.extension === extension.toLowerCase(),
      dataValidator
    );
  }

  static registerTileset() {
    const predicate = (contentData: ContentData) => ContentDataValidator.isProbablyTileset(contentData);
    const externalValidator = Validators.createDefaultTilesetValidator();
    const dataValidator = Validators.wrap(externalValidator);
    ContentDataValidator.registerByPredicate(predicate, dataValidator);
  }

  static registerGltf() {
    const predicate = (contentData: ContentData) => ContentDataValidator.isProbablyGltf(contentData);
    const dataValidator = new GltfValidator();
    ContentDataValidator.registerByPredicate(predicate, dataValidator);
  }

  private static isProbablyTileset(contentData : ContentData) {
    const parsedObject = contentData.parsedObject;
    if (!defined(parsedObject)) {
      return false;
    }
    if (!defined(parsedObject.asset)) {
      return false;
    }
    return defined(parsedObject.geometricError) || defined(parsedObject.root);
  }

  private static isProbablyGltf(contentData : ContentData) {
    const parsedObject = contentData.parsedObject;
    if (!defined(parsedObject)) {
      return false;
    }
    if (!defined(parsedObject.asset)) {
      return false;
    }
    return true;
  }


  static registerByPredicate(
    predicate: (contentData: ContentData) => boolean,
    dataValidator: Validator<Buffer>
  ) {
    const entry = {
      predicate: predicate,
      dataValidator: dataValidator,
    };
    ContentDataValidator.dataValidators.push(entry);
  }

  private static findDataValidator(
    contentData: ContentData
  ): Validator<Buffer> | undefined {
    for (const entry of ContentDataValidator.dataValidators) {
      if (entry.predicate(contentData)) {
        return entry.dataValidator;
      }
    }
    return undefined;
  }

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
        const issue = IoValidationIssues.JSON_PARSE_ERROR(contentUri, "" + error);
        context.addIssue(issue);
        return false;
      }
    }

    // Create the `ContentData`, and look up a 
    // matching content data validator
    const contentData = new ContentData(contentUri, contentDataBuffer, parsedObject);
    const dataValidator = ContentDataValidator.findDataValidator(contentData);
    if (!defined(dataValidator)) {
      const path = contentPath;
      const message =
        `Tile content ${contentPath} refers to URI ${contentUri}, ` +
        `for which no tile content type could be determined`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_WARNING(
        path,
        message
      );
      context.addIssue(issue);
      return true;
    }

    // Create a new context to collect the issues that are
    // found in the data. If there are issues, then they
    // will be stored as the 'internal issues' of a
    // single content validation issue.
    const dirName = paths.dirname(contentData.uri);
    const derivedContext = context.derive(dirName);
    const result = await dataValidator!.validateObject(
      contentUri,
      contentDataBuffer,
      derivedContext
    );
    const derivedResult = derivedContext.getResult();
    const issue = ContentValidationIssues.createFrom(
      contentUri,
      derivedResult
    );
    if (issue) {
      context.addIssue(issue);
    }
    return result;
  }

  /**
   * Perform the validation of the given content data, which already
   * has been determined to (probably) be JSON data.
   *
   * The method will try to figure out the actual data type using
   * a few guesses, and try to validate the data.
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
   * @param contentData The buffer containing the actual content data
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateJsonContentData(
    contentPath: string,
    contentUri: string,
    contentData: Buffer,
    context: ValidationContext
  ): Promise<boolean> {
    // If the data is probably JSON, try to parse it in any case,
    // and bail out if it cannot be parsed
    let parsedObject = undefined;
    try {
      parsedObject = JSON.parse(contentData.toString());
    } catch (error) {
      const issue = IoValidationIssues.JSON_PARSE_ERROR(contentUri, "" + error);
      context.addIssue(issue);
      return false;
    }

    // Try to rule out JSON files which will not be validated anyhow
    const ext = paths.extname(contentUri).toLowerCase();
    if (ext === ".geojson") {
      const message = `Skipping validation of apparent GeoJson file: ${contentUri}`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_WARNING(
        contentUri,
        message
      );
      context.addIssue(issue);
      return true;
    }

    // An 'asset' may indicate an external tileset or a glTF...
    if (defined(parsedObject.asset)) {
      // When there is a `geometricError` or a `root`,
      // let's assume that it is an external tileset:
      if (defined(parsedObject.geometricError) || defined(parsedObject.root)) {
        console.log("Validating as external tileset: " + contentUri);
        // Create a new context to collect the issues that are
        // found in the data. If there are issues, then they
        // will be stored as the 'internal issues' of a
        // single content validation issue.
        const dirName = paths.dirname(contentUri);
        const derivedContext = context.derive(dirName);
        const externalValidator = Validators.createDefaultTilesetValidator();
        const result = await externalValidator.validateObject(
          contentUri,
          parsedObject,
          derivedContext
        );
        const derivedResult = derivedContext.getResult();
        const issue = ContentValidationIssues.createFrom(
          contentUri,
          derivedResult
        );
        if (issue) {
          context.addIssue(issue);
        }
        return result;
      }

      // The parsed object has an 'asset', but is no tileset.
      // Assume that it is a glTF:
      console.log("Validating glTF: " + contentUri);
      const gltfValidator = new GltfValidator();
      const result = await gltfValidator.validateObject(
        contentUri,
        contentData,
        context
      );
      return result;
    }
    const path = contentPath;
    const message =
      `Tile content ${contentPath} refers to URI ${contentUri}, which ` +
      `contains JSON data, but for which no type could be determined`;
    const issue = ContentValidationIssues.CONTENT_VALIDATION_WARNING(
      path,
      message
    );
    context.addIssue(issue);
    return true;
  }
}
