import { defined } from "3d-tiles-tools";

import { Validator } from "../Validator";
import { ValidationContext } from "../ValidationContext";
import { BasicValidator } from "../BasicValidator";
import { JsonValidationIssues } from "../../issues/JsonValidationIssues";
import { IoValidationIssues } from "../../issues/IoValidationIssue";
import { GeojsonValidator } from "../../tileFormats/GeojsonValidator";

/**
 * A class for validating MAXAR_extent extension objects.
 *
 * @internal
 */
export class MaxarExtentValidator implements Validator<any> {
  /**
   * Performs the validation to determine whether the given tileset contains
   * a valid MAXAR_extent extension.
   *
   * @param path - The path for ValidationIssue instances
   * @param tileset - The tileset object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  async validateObject(
    path: string,
    tileset: any,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (!BasicValidator.validateObject(path, "tileset", tileset, context)) {
      return false;
    }

    let result = true;

    // If there is a MAXAR_extent extension,
    // perform the validation of the corresponding object
    const extensions = tileset.extensions;
    if (defined(extensions)) {
      const key = "MAXAR_extent";
      const extension = extensions[key];
      if (defined(extension)) {
        const extensionPath = path + "/extensions/" + key;
        const extensionValid = await MaxarExtentValidator.validateMaxarExtent(
          extensionPath,
          extension,
          context
        );
        if (!extensionValid) {
          result = false;
        }
      }
    }

    return result;
  }

  /**
   * Validates the MAXAR_extent extension object
   *
   * @param path - The path for ValidationIssue instances
   * @param maxar_extent - The MAXAR_extent object to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the object was valid
   */
  static async validateMaxarExtent(
    path: string,
    maxar_extent: any,
    context: ValidationContext
  ): Promise<boolean> {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "MAXAR_extent",
        maxar_extent,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the uri property (required)
    const uri = maxar_extent.uri;
    const uriPath = path + "/uri";

    if (!BasicValidator.validateString(uriPath, "uri", uri, context)) {
      result = false;
    } else {
      // Validate that the URI is not empty
      if (uri.trim().length === 0) {
        const message = "The 'uri' property must not be empty";
        const issue = JsonValidationIssues.STRING_VALUE_INVALID(
          uriPath,
          message
        );
        context.addIssue(issue);
        result = false;
      } else {
        // Validate that the URI is resolvable and contains valid GeoJSON
        const uriValid = await MaxarExtentValidator.validateUriContent(
          uriPath,
          uri,
          context
        );
        if (!uriValid) {
          result = false;
        }
      }
    }

    return result;
  }

  /**
   * Validates that the URI is resolvable and contains valid GeoJSON content
   *
   * @param path - The path for ValidationIssue instances
   * @param uri - The URI to validate
   * @param context - The ValidationContext that any issues will be added to
   * @returns Whether the URI content was valid
   */
  static async validateUriContent(
    path: string,
    uri: string,
    context: ValidationContext
  ): Promise<boolean> {
    try {
      // Attempt to resolve the URI
      const resourceResolver = context.getResourceResolver();
      const uriData = await resourceResolver.resolveData(uri);

      if (!defined(uriData)) {
        const message = `The URI '${uri}' could not be resolved`;
        const issue = IoValidationIssues.IO_ERROR(path, message);
        context.addIssue(issue);
        return false;
      }

      // Validate the resolved content as GeoJSON
      const geojsonValidator = new GeojsonValidator();
      const geojsonValid = await geojsonValidator.validateObject(
        uri,
        uriData,
        context
      );

      return geojsonValid;
    } catch (error) {
      const message = `Error resolving URI '${uri}': ${error}`;
      const issue = IoValidationIssues.IO_ERROR(path, message);
      context.addIssue(issue);
      return false;
    }
  }
}
