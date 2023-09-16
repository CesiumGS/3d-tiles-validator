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
}
