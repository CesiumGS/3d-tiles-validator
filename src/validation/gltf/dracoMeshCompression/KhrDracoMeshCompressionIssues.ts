import { GltfData } from "../GltfData";

import { ValidationIssue } from "../../ValidationIssue";
import { GltfExtensionIssues } from "../GltfExtensionIssues";

/**
 * Functions for implementing filters on lists of validation issues,
 * related to the KHR_draco_mesh_compression extension
 *
 * @internal
 */
export class KhrDracoMeshCompressionIssues {
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

    const isAboutUnsupportedExtension =
      GltfExtensionIssues.isAboutUnsupportedExtension(
        "KHR_draco_mesh_compression"
      );

    const usedBufferViewIndices =
      KhrDracoMeshCompressionIssues.computeUsedBufferViewIndices(gltfData.gltf);
    const isAboutUnusedBufferView = GltfExtensionIssues.isAboutUnusedObject(
      "bufferViews",
      usedBufferViewIndices
    );

    const processedCauses = GltfExtensionIssues.processCausesWith(
      causes,
      isAboutUnsupportedExtension,
      isAboutUnusedBufferView
    );
    return processedCauses;
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
  private static computeUsedBufferViewIndices(gltf: any): Set<number> {
    const bufferViewIndices = new Set<number>();
    const meshes = gltf.meshes ?? [];
    for (const mesh of meshes) {
      const primitives = mesh.primitives ?? [];
      for (const primitive of primitives) {
        const extensions = primitive.extensions ?? {};
        const extension = extensions["KHR_draco_mesh_compression"];
        if (extension) {
          const bufferViewIndex = extension.bufferView;
          if (bufferViewIndex !== undefined) {
            bufferViewIndices.add(bufferViewIndex);
          }
        }
      }
    }
    return bufferViewIndices;
  }
}
