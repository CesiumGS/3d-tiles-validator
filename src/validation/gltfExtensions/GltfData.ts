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
   * The glTF-Transform document
   */
  gltfDocument: Document;
};
