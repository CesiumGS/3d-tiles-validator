import { ValidationIssue } from "../validation/ValidationIssue";
import { ValidationIssueSeverity } from "../validation/ValidationIssueSeverity";

/**
 * Methods to create `ValidationIssue` instances that describe
 * issues related to the validation of glTF extensions.
 */
export class GltfExtensionValidationIssues {
  /**
   * Indicates that the glTF was fundamentally invalid
   * (i.e. generally not a valid GLB/glTF asset at all)
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static GLTF_INVALID(path: string, message: string) {
    const type = "GLTF_INVALID";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the extension referred to an element in the
   * glTF assset that did not match the requirements of the
   * extension specification. (For example, a 'texCoord' that
   * referred to a VEC3 accessor). Further details should be
   * encoded in the 'message'.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static INVALID_GLTF_STRUCTURE(path: string, message: string) {
    const type = "INVALID_GLTF_STRUCTURE";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the feature ID texture 'channels' property
   * had a structure that did not match the actual image data,
   * meaning that the `channels` array contained an element
   * that was not smaller than the number of actual channels
   * in the image.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static TEXTURE_CHANNELS_OUT_OF_RANGE(path: string, message: string) {
    const type = "TEXTURE_CHANNELS_OUT_OF_RANGE";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that the featureCount of a feature ID did not
   * match the actual number of IDs
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static FEATURE_COUNT_MISMATCH(path: string, message: string) {
    const type = "FEATURE_COUNT_MISMATCH";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }

  /**
   * Indicates that a certain property was defined in a context where
   * this type is not allowed. For example, when a variable-length
   * array or a 'STRING' property are used in a property texture.
   *
   * @param path - The path for the `ValidationIssue`
   * @param message - The message for the `ValidationIssue`
   * @returns The `ValidationIssue`
   */
  static INVALID_METADATA_PROPERTY_TYPE(path: string, message: string) {
    const type = "INVALID_METADATA_PROPERTY_TYPE";
    const severity = ValidationIssueSeverity.ERROR;
    const issue = new ValidationIssue(type, path, message, severity);
    return issue;
  }
}
