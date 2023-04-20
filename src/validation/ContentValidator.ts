import { defined } from "3d-tiles-tools";

import { ValidationContext } from "./ValidationContext";
import { ValidationState } from "./ValidationState";
import { BoundingVolumeValidator } from "./BoundingVolumeValidator";
import { BasicValidator } from "./BasicValidator";
import { RootPropertyValidator } from "./RootPropertyValidator";
import { ExtendedObjectsValidators } from "./ExtendedObjectsValidators";

import { MetadataEntityValidator } from "./metadata/MetadataEntityValidator";

import { Content } from "3d-tiles-tools";

import { StructureValidationIssues } from "../issues/StructureValidationIssues";

/**
 * A class for validations related to `content` objects.
 *
 * @internal
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
   * @param contentPath - The path for the `ValidationIssue` instances
   * @param content - The object to validate
   * @param validationState - The `ValidationState`
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the given object was valid
   */
  static async validateContent(
    contentPath: string,
    content: Content,
    validationState: ValidationState,
    context: ValidationContext
  ): Promise<boolean> {
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

    // Perform the validation of the object in view of the
    // extensions that it may contain
    if (
      !ExtendedObjectsValidators.validateExtendedObject(
        contentPath,
        content,
        context
      )
    ) {
      result = false;
    }
    // If there was an extension validator that overrides the
    // default validation, then skip the remaining validation.
    if (ExtendedObjectsValidators.hasOverride(content)) {
      return result;
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
          group,
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
        if (!validationState.hasGroupsDefinition) {
          const message =
            `Tile content has a group index ${group}, ` +
            `but the containing tileset does not define groups`;
          const issue = StructureValidationIssues.IDENTIFIER_NOT_FOUND(
            groupPath,
            message
          );
          context.addIssue(issue);
          result = false;
        } else if (defined(validationState.validatedGroups)) {
          if (group >= validationState.validatedGroups.length) {
            const message =
              `Tile content has a group index ${group}, ` +
              `but the containing tileset only contains ` +
              `${validationState.validatedGroups.length} groups`;
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

    // TODO XXX Temporary, for CesiumJS spec files
    /*/
    const url = (content as any).url;
    if (defined(url)) {
      const message = `Using content.url as content.uri`;
      console.error(message);
      content.uri = url;
    }
    //*/

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
      const boundingVolumeValid =
        await BoundingVolumeValidator.validateBoundingVolume(
          boundingVolumePath,
          boundingVolume,
          context
        );
      if (!boundingVolumeValid) {
        result = false;
      }
    }

    // Validate the metadata
    const metadata = content.metadata;
    const metadataPath = contentPath + "/metadata";
    if (defined(metadata)) {
      if (!validationState.hasSchemaDefinition) {
        // If there is metadata, then there must be a schema definition
        const message =
          "The content defines 'metadata' but the tileset does not have a schema";
        const issue = StructureValidationIssues.REQUIRED_VALUE_NOT_FOUND(
          contentPath,
          message
        );
        context.addIssue(issue);
        result = false;
      } else if (defined(validationState.validatedSchema)) {
        if (
          !MetadataEntityValidator.validateMetadataEntity(
            metadataPath,
            "content.metadata",
            metadata,
            validationState.validatedSchema,
            context
          )
        ) {
          result = false;
        }
      }
    }
    return result;
  }
}
