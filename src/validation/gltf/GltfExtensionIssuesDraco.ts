import { GltfData } from "./GltfData";

import { ValidationIssue } from "../ValidationIssue";
import { ValidationIssueSeverity } from "../ValidationIssueSeverity";
import { GltfExtensionIssues } from "./GltfExtensionIssues";

/**
 * Functions for implementing filters on lists of validation issues,
 * related to the KHR_texture_basisu extension
 *
 * @internal
 */
export class GltfExtensionIssuesDraco {
  /**
   * Process the given list of validation issues, and possibly filer
   * out the issues that are obsolete
   *
   * @param path - The path for validation issues
   * @param gltfData - The GltfData objects
   * @param causes - The validation issues
   */
  static async processCauses(
    path: string,
    gltfData: GltfData,
    causes: ValidationIssue[]
  ): Promise<ValidationIssue[]> {
    // When the extension is not used, nothing has to be done
    const gltf = gltfData.gltf;
    const extensionsUsed = gltf.extensionsUsed ?? [];
    if (!extensionsUsed.includes("KHR_draco_mesh_compression")) {
      return causes;
    }

    const usedBufferViewIndices =
      GltfExtensionIssuesDraco.computeUsedBufferViewIndices(gltfData.gltf);

    const processedCauses: ValidationIssue[] = [];
    for (const cause of causes) {
      const remove = await GltfExtensionIssuesDraco.shouldRemove(
        usedBufferViewIndices,
        cause
      );
      if (!remove) {
        processedCauses.push(cause);
      }
    }
    return processedCauses;
  }

  /**
   * Returns whether the given issue is an issue that should be removed
   *
   * @param usedBufferViewIndices - The buffer view indices that are
   * actually used by the extension
   * @param issue - The validation issue
   * @returns Whether the issue should be removed
   */
  private static async shouldRemove(
    usedBufferViewIndices: number[],
    issue: ValidationIssue
  ): Promise<boolean> {
    // Never remove errors!
    if (issue.severity === ValidationIssueSeverity.ERROR) {
      return false;
    }

    // Remove the message about the extension not being supported
    const isIssueAboutUnsupportedExtension =
      GltfExtensionIssues.isIssueAboutUnsupportedExtension(
        issue,
        "KHR_draco_mesh_compression"
      );
    if (isIssueAboutUnsupportedExtension) {
      return true;
    }

    // Remove all INFO- and WARNING issues about unused objects
    // for buffer views that are actually used by the extension
    const isObsoleteAboutBufferView =
      GltfExtensionIssues.isObsoleteIssueAboutUnusedObject(
        issue,
        "bufferViews",
        usedBufferViewIndices
      );
    if (isObsoleteAboutBufferView) {
      return true;
    }
    return false;
  }

  /**
   * Pragmatically drill into the given glTF object to find all bufferView
   * indices that are used via the 'KHR_draco_mesh_compression' extension
   *
   * This will fall back to empty objects and arrays everywhere, and return
   * only the indices that are definitely known to be used.
   *
   * @param gltf - The glTF JSON object
   * @returns The buffer view indices that are used by the
   * KHR_draco_mesh_compression extension
   */
  private static computeUsedBufferViewIndices(gltf: any): number[] {
    const bufferViewIndices: number[] = [];
    const meshes = gltf.meshes ?? [];
    for (const mesh of meshes) {
      const primitives = mesh.primitives ?? [];
      for (const primitive of primitives) {
        const extensions = primitive.extensions ?? {};
        const extension = extensions["KHR_draco_mesh_compression"];
        if (extension) {
          const bufferViewIndex = extension.bufferView;
          if (bufferViewIndex !== undefined) {
            bufferViewIndices.push(bufferViewIndex);
          }
        }
      }
    }
    return bufferViewIndices;
  }
}
