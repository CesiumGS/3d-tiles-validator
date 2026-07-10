import { ValidationIssue } from "../../ValidationIssue";

import { GltfData } from "../GltfData";

import { GltfExtensionIssues } from "../GltfExtensionIssues";

/**
 * Methods related to filtering the list of issues that is generated
 * by the glTF validator, to omit the issues that are obsolete due
 * to the support of the `MAXAR_nonvisual_geometry` extension in
 * the 3D Tiles validator.
 *
 * This class assumes that the structure of the glTF asset itself
 * has already been validated (e.g. with the glTF Validator).
 *
 * @internal
 */
export class MaxarNonvisualGeometryIssues {
  /**
   * Process the given list of issues in view of MAXAR_nonvisual_geometry.
   *
   * This will omit the issues that are considered obsolete due to
   * the lack of support for MAXAR_nonvisual_geometry validation.
   *
   * @param path - The path for validation issues
   * @param keepObsoleteIssues - Whether issues should be retained even
   * when they are obsolete.
   * @param gltfData - The GltfData
   * @param causes - The causes
   * @returns The filtered causes
   */
  static async processCauses(
    path: string,
    keepObsoleteIssues: boolean,
    gltfData: GltfData,
    causes: ValidationIssue[]
  ): Promise<ValidationIssue[]> {
    if (keepObsoleteIssues) {
      return causes;
    }
    const gltf = gltfData.gltf;
    const usedMeshIndices =
      MaxarNonvisualGeometryIssues.computeUsedMeshIndices(gltf);

    // Remove the issue about the extension not being supported
    const isAboutUnsupportedExtension =
      GltfExtensionIssues.isAboutUnsupportedExtension(
        "MAXAR_nonvisual_geometry"
      );

    // Remove the issue about the unused mesh if the mesh is used
    const isAboutUnusedMesh = GltfExtensionIssues.isAboutUnusedObject(
      "meshes",
      usedMeshIndices
    );

    const processedCauses: ValidationIssue[] =
      await GltfExtensionIssues.processCausesWith(
        causes,
        isAboutUnsupportedExtension,
        isAboutUnusedMesh
      );
    return processedCauses;
  }

  /**
   * Compute the indices of all meshes that appear as any
   * <code>gltf.nodes[i].extensions["MAXAR_nonvisual_geometry"].mesh</code>.
   *
   * @param gltf - The glTF JSON object
   * @returns The mesh indices
   */
  private static computeUsedMeshIndices(gltf: any): Set<number> {
    const meshIndices = new Set<number>();
    const nodes = gltf.nodes ?? [];
    for (const node of nodes) {
      const extensions = node.extensions ?? {};
      const extension = extensions["MAXAR_nonvisual_geometry"] ?? {};
      const meshIndex = extension.mesh;
      if (typeof meshIndex === "number") {
        meshIndices.add(meshIndex);
      }
    }
    return meshIndices;
  }
}
