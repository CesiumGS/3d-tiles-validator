import { defined } from "../base/defined";

import { ValidationContext } from "./ValidationContext";
import { BoundingVolumeValidator } from "./BoundingVolumeValidator";
import { BasicValidator } from "./BasicValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";

import { Content } from "../structure/Content";
import { Group } from "../structure/Group";

import { StructureValidationIssues } from "../issues/StructureValidationIssues";

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
}
