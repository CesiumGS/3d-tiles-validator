import { BinaryBufferData } from "3d-tiles-tools";
import { Document } from "@gltf-transform/core";

/**
 * A simple combination of a (parsed) glTF JSON object,
 * the optional binary buffer of a glTF asset, and
 * the glTF-Transform document for this data.
 *
 * @internal
 */
export type GltfData = {
  /**
   * The parsed glTF JSON object
   */
  gltf: any;

  /**
   * The binary buffer, if the glTF was read from a GLB
   */
  binary: Buffer | undefined;

  /**
   * The binary buffer data, containing the buffers for
   * the glTF buffer- and buffer view objects, resolved
   * from the binary data.
   */
  binaryBufferData: BinaryBufferData;

  /**
   * The glTF-Transform document, or `undefined` if the document could
   * not be read.
   *
   * If the document could not be read, then this was caused by the glTF
   * being "structurally invalid", causing the glTF-Transform IO classes
   * to bail out at one point or another. Details about the reason
   * should be captured by the manual validation of the glTF JSON object.
   *
   * Specifically: If the glTF structure is 'invalid', then one cannot
   * expect this gltfDocument to be defined. If the glTF structure is
   * valid, then it _should_ be defined. Cases where the validator and
   * the glTF-Transform IO classes disagree should be considered to be
   * a bug in either of them, and reported as an internal validation
   * error.
   */
  gltfDocument: Document | undefined;
};
