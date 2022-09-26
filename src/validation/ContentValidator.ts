import paths from "path";

import { defined } from "../base/defined";

import { Uris } from "../io/Uris";
import { ResourceTypes } from "../io/ResourceTypes";

import { Validators } from "./Validators";
import { ValidationContext } from "./ValidationContext";
import { BoundingVolumeValidator } from "./BoundingVolumeValidator";
import { BasicValidator } from "./BasicValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";

import { B3dmValidator } from "../tileFormats/B3dmValidator";
import { I3dmValidator } from "../tileFormats/I3dmValidator";
import { PntsValidator } from "../tileFormats/PntsValidator";
import { CmptValidator } from "../tileFormats/CmptValidator";
import { GltfValidator } from "../tileFormats/GltfValidator";

import { Content } from "../structure/Content";
import { Group } from "../structure/Group";

import { StructureValidationIssues } from "../issues/StructureValidationIssues";
import { IoValidationIssues } from "../issues/IoValidationIssue";
import { ContentValidationIssues } from "../issues/ContentValidationIssues";

/**
 * A class for validations related to `content` objects.
 *
 * @private
 */
export class ContentValidator {
  /**
   * Performs the validation to ensure that the given object is a
   * valid `content` object.
   *
   * This only performs the basic JSON-level and consistency checks.
   * It does not validate the content data that is referred to by the
   * `content.uri`. The validation of the content data is done with
   * `validateContentData`, if and only if this method returned `true`.
   *
   * @param contentPath The path for the `ValidationIssue` instances
   * @param content The object to validate
   * @param hasGroupsDefinition Whether the tileset defined `tileset.groups`
   * @param validatedGroups The validated groups. This is the `tileset.groups`
   * if they had been defined and could be validated, and `undefined` otherwise.
   * @param context The `ValidationContext` that any issues will be added to
   * @returns Whether the given object was valid
   */
  static validateContent(
    contentPath: string,
    content: Content,
    hasGroupsDefinition: boolean,
    validatedGroups: Group[] | undefined,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(contentPath, "content", content, context)
    ) {
      return false;
    }

    let result = true;

    // Validate the object as a RootProperty
    if (
      !RootPropertyValidator.validateRootProperty(
        contentPath,
        "content",
        content,
        context
      )
    ) {
      result = false;
    }

    // Validate the group
    const group = content.group;
    const groupPath = contentPath + "/group";
    if (defined(group)) {
      // The group MUST be a non-negative integer
      if (
        !BasicValidator.validateIntegerRange(
          groupPath,
          "group",
          group!,
          0,
          true,
          undefined,
          false,
          context
        )
      ) {
        result = false;
      } else {
        // When a group is given, the tileset MUST define groups
        if (!hasGroupsDefinition) {
          const message =
            `Tile content has a group index ${group}, ` +
            `but the containing tileset does not define groups`;
          const issue = StructureValidationIssues.IDENTIFIER_NOT_FOUND(
            groupPath,
            message
          );
          context.addIssue(issue);
          result = false;
        } else if (defined(validatedGroups)) {
          if (group! >= validatedGroups!.length) {
            const message =
              `Tile content has a group index ${group}, ` +
              `but the containing tileset only contains ` +
              `${validatedGroups!.length} groups`;
            const issue = StructureValidationIssues.IDENTIFIER_NOT_FOUND(
              groupPath,
              message
            );
            context.addIssue(issue);
            result = false;
          }
        }
      }
    }

    // Validate the uri
    const uri = content.uri;
    const uriPath = contentPath + "/uri";
    // The uri MUST be defined
    // The uri MUST be a string
    if (!BasicValidator.validateString(uriPath, "uri", uri, context)) {
      result = false;
    }

    // Validate the boundingVolume
    const boundingVolume = content.boundingVolume;
    const boundingVolumePath = contentPath + "/boundingVolume";
    if (defined(boundingVolume)) {
      if (
        !BoundingVolumeValidator.validateBoundingVolume(
          boundingVolumePath,
          boundingVolume!,
          context
        )
      ) {
        result = false;
      }
    }

    // Validate the metadata
    const metadata = content.metadata;
    //const metadataPath = contentPath + "/metadata";
    if (defined(metadata)) {
      // TODO Validate content metadata!
      console.error("Content metadata is not yet validated");
    }
    return result;
  }

  /**
   * Validate the actual data that is referred to by the URI in the
   * given content.
   *
   * This assumes that the given content has already been validated
   * to be structurally valid.
   *
   * It will resolve the actual content data, and pass it to
   * `validateContentDataInternal`.
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
  ): Promise<void> {
    // Validate the uri
    const uri = content.uri;
    // TODO: Assuming that absolute URIs should not be checked
    if (Uris.isAbsoluteUri(uri)) {
      return;
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
      return;
    } else {
      await ContentValidator.validateContentDataInternal(
        contentPath,
        uri,
        contentData!,
        context
      );
    }
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
   * @param contentData The buffer containing the actual content data
   * @param context The `ValidationContext`
   * @returns A promise that resolves when the validation is finished
   */
  private static async validateContentDataInternal(
    contentPath: string,
    contentUri: string,
    contentData: Buffer,
    context: ValidationContext
  ): Promise<void> {
    // Figure out the type of the content data and pass it
    // to the responsible validator.

    const isGlb = ResourceTypes.isGlb(contentData);
    if (isGlb) {
      console.log("Validating GLB: " + contentUri);
      const dataValidator = new GltfValidator(contentUri);
      await dataValidator.validateObject(contentData, context);
      return;
    }

    const isB3dm = ResourceTypes.isB3dm(contentData);
    if (isB3dm) {
      console.log("Validating B3DM: " + contentUri);
      const dataValidator = new B3dmValidator(contentUri);
      await dataValidator.validateObject(contentData, context);
      return;
    }

    const isI3dm = ResourceTypes.isI3dm(contentData);
    if (isI3dm) {
      console.log("Validating I3DM: " + contentUri);
      const dataValidator = new I3dmValidator(contentUri);
      await dataValidator.validateObject(contentData, context);
      return;
    }

    const isPnts = ResourceTypes.isPnts(contentData);
    if (isPnts) {
      console.log("Validating PNTS: " + contentUri);
      const dataValidator = new PntsValidator(contentUri);
      await dataValidator.validateObject(contentData, context);
      return;
    }

    const isCmpt = ResourceTypes.isCmpt(contentData);
    if (isCmpt) {
      console.log("Validating CMPT: " + contentUri);
      const dataValidator = new CmptValidator(contentUri);
      await dataValidator.validateObject(contentData, context);
      return;
    }

    // When there is no known magic value, then it may be JSON.
    const isJson = ResourceTypes.isProbablyJson(contentData);
    if (isJson) {
      await ContentValidator.validateJsonContentData(
        contentPath,
        contentUri,
        contentData,
        context
      );
      return;
    }

    const path = contentPath;
    const message =
      `Tile content ${contentPath} refers to URI ${contentUri}, ` +
      `for which no tile content type could be determined`;
    const issue = ContentValidationIssues.CONTENT_VALIDATION_WARNING(
      path,
      message
    );
    context.addIssue(issue);
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
  ) {
    // If the data is probably JSON, try to parse it in any case,
    // and bail out if it cannot be parsed
    let parsedObject = undefined;
    try {
      parsedObject = JSON.parse(contentData.toString());
    } catch (error) {
      const issue = IoValidationIssues.JSON_PARSE_ERROR(contentUri, "" + error);
      context.addIssue(issue);
      return;
    }

    // Try to rule out JSON files which will not be validated anyhow
    const ext = paths.extname(contentUri).toLowerCase();
    if (ext === "geojson") {
      const message = `Skipping validation of apparent GeoJson file: ${contentUri}`;
      const issue = ContentValidationIssues.CONTENT_VALIDATION_WARNING(
        contentUri,
        message
      );
      context.addIssue(issue);
      return;
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
        await externalValidator.validateObject(parsedObject, derivedContext);
        const derivedResult = derivedContext.getResult();
        const issue = ContentValidationIssues.createFrom(
          contentUri,
          derivedResult
        );
        if (issue) {
          context.addIssue(issue);
        }
        return;
      }

      // The parsed object has an 'asset', but is no tileset.
      // Assume that it is a glTF:
      console.log("Validating glTF: " + contentUri);
      const gltfValidator = new GltfValidator(contentUri);
      await gltfValidator.validateObject(contentData, context);
      return;
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
  }
}
