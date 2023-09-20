/**
 * A simple combination of a (parsed) glTF JSON object,
 * and the optional binary buffer of a glTF asset.
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
};
