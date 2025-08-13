import { defined } from "3d-tiles-tools";

import { ValidationContext } from "../../ValidationContext";
import { BasicValidator } from "../../BasicValidator";

import { GltfData } from "../GltfData";

import { GltfExtensionValidationIssues } from "../../../issues/GltfExtensionValidationIssues";

/**
 * A class for validating the `MAXAR_nonvisual_geometry` extension in
 * glTF assets.
 *
 * This class assumes that the structure of the glTF asset itself
 * has already been validated (e.g. with the glTF Validator).
 *
 * @internal
 */
export class MaxarNonvisualGeometryValidator {
  /**
   * Performs the validation to ensure that the `MAXAR_nonvisual_geometry`
   * extensions in the given glTF are valid
   *
   * @param path - The path for validation issues
   * @param gltfData - The glTF data, containing the parsed JSON and the
   * (optional) binary buffer
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  static async validateGltf(
    path: string,
    gltfData: GltfData,
    context: ValidationContext
  ): Promise<boolean> {
    const gltf = gltfData.gltf;
    let result = true;

    // Validate node extensions
    const nodes = gltf.nodes || [];
    for (let n = 0; n < nodes.length; n++) {
      const node = nodes[n];
      if (!node) {
        continue;
      }
      const extensions = node.extensions;
      if (!extensions) {
        continue;
      }
      const nonvisualGeometry = extensions["MAXAR_nonvisual_geometry"];
      if (defined(nonvisualGeometry)) {
        const nodePath =
          path + "/nodes/" + n + "/extensions/MAXAR_nonvisual_geometry";
        const objectIsValid =
          MaxarNonvisualGeometryValidator.validateNodeExtension(
            nodePath,
            nonvisualGeometry,
            gltf,
            context
          );
        if (!objectIsValid) {
          result = false;
        }
      }
    }

    // Validate mesh primitive extensions
    const meshes = gltf.meshes || [];
    for (let m = 0; m < meshes.length; m++) {
      const mesh = meshes[m];
      if (!mesh) {
        continue;
      }
      const primitives = mesh.primitives;
      if (!primitives || !Array.isArray(primitives)) {
        continue;
      }
      for (let p = 0; p < primitives.length; p++) {
        const primitive = primitives[p];
        if (!primitive) {
          continue;
        }
        const extensions = primitive.extensions;
        if (!extensions) {
          continue;
        }
        const nonvisualGeometry = extensions["MAXAR_nonvisual_geometry"];
        if (defined(nonvisualGeometry)) {
          const primitivePath =
            path +
            "/meshes/" +
            m +
            "/primitives/" +
            p +
            "/extensions/MAXAR_nonvisual_geometry";
          const objectIsValid =
            MaxarNonvisualGeometryValidator.validatePrimitiveExtension(
              primitivePath,
              nonvisualGeometry,
              primitive,
              context
            );
          if (!objectIsValid) {
            result = false;
          }
        }
      }
    }

    return result;
  }

  /**
   * Validate the given MAXAR_nonvisual_geometry extension object that was
   * found in a glTF node.
   *
   * @param path - The path for validation issues
   * @param nodeExtension - The MAXAR_nonvisual_geometry extension object
   * @param gltf - The glTF root object
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validateNodeExtension(
    path: string,
    nodeExtension: any,
    gltf: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "nodeExtension",
        nodeExtension,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the mesh property
    const mesh = nodeExtension.mesh;
    const meshPath = path + "/mesh";

    const meshes = gltf.meshes || [];
    // The mesh must be a valid glTF ID (non-negative integer)
    if (
      !BasicValidator.validateIntegerRange(
        meshPath,
        "mesh",
        mesh,
        0,
        true,
        meshes.length,
        false,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate the given MAXAR_nonvisual_geometry extension object that was
   * found in a mesh primitive.
   *
   * @param path - The path for validation issues
   * @param primitiveExtension - The MAXAR_nonvisual_geometry extension object
   * @param primitive - The mesh primitive that contains the extension
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the object was valid
   */
  private static validatePrimitiveExtension(
    path: string,
    primitiveExtension: any,
    primitive: any,
    context: ValidationContext
  ): boolean {
    // Make sure that the given value is an object
    if (
      !BasicValidator.validateObject(
        path,
        "primitiveExtension",
        primitiveExtension,
        context
      )
    ) {
      return false;
    }

    let result = true;

    // Validate the shape property
    const shape = primitiveExtension.shape;
    const shapePath = path + "/shape";

    // The shape must be one of the allowed enum values
    const allowedShapes = ["points", "path", "surface", "volume"];
    if (
      !BasicValidator.validateEnum(
        shapePath,
        "shape",
        shape,
        allowedShapes,
        context
      )
    ) {
      result = false;
    } else {
      // Validate shape-to-primitive-mode compatibility
      const shapeCompatibilityValid =
        MaxarNonvisualGeometryValidator.validateShapeCompatibility(
          path,
          shape,
          primitive,
          context
        );
      if (!shapeCompatibilityValid) {
        result = false;
      }
    }

    // Validate the type property
    const type = primitiveExtension.type;
    const typePath = path + "/type";

    // The type property is required and must be a non-empty string
    if (
      !BasicValidator.validateStringLength(
        typePath,
        "type",
        type,
        1,
        undefined,
        context
      )
    ) {
      result = false;
    }

    return result;
  }

  /**
   * Validate that the shape is compatible with the primitive mode.
   *
   * @param path - The path for validation issues
   * @param shape - The shape value from the extension
   * @param primitive - The mesh primitive
   * @param context - The `ValidationContext` that any issues will be added to
   * @returns Whether the shape is compatible with the primitive mode
   */
  private static validateShapeCompatibility(
    path: string,
    shape: string,
    primitive: any,
    context: ValidationContext
  ): boolean {
    const mode = primitive.mode !== undefined ? primitive.mode : 4; // Default to TRIANGLES (4)

    let allowedModes: number[] = [];
    let shapeDescription = "";

    switch (shape) {
      case "points":
        allowedModes = [0]; // POINTS
        shapeDescription = "Points shape requires primitive mode 0 (POINTS)";
        break;
      case "path":
        allowedModes = [1, 2, 3]; // LINES, LINE_LOOP, LINE_STRIP
        shapeDescription =
          "Path shape requires primitive mode 1 (LINES), 2 (LINE_LOOP), or 3 (LINE_STRIP)";
        break;
      case "surface":
        allowedModes = [4, 5, 6]; // TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN
        shapeDescription =
          "Surface shape requires primitive mode 4 (TRIANGLES), 5 (TRIANGLE_STRIP), or 6 (TRIANGLE_FAN)";
        break;
      case "volume":
        allowedModes = [4, 5]; // TRIANGLES, TRIANGLE_STRIP
        shapeDescription =
          "Volume shape requires primitive mode 4 (TRIANGLES) or 5 (TRIANGLE_STRIP)";
        break;
    }

    if (!allowedModes.includes(mode)) {
      const message =
        `Shape '${shape}' is not compatible with primitive mode ${mode}. ` +
        shapeDescription;
      const issue = GltfExtensionValidationIssues.INVALID_GLTF_STRUCTURE(
        path,
        message
      );
      context.addIssue(issue);
      return false;
    }

    return true;
  }
}
