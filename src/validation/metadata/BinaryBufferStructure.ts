import { BufferObject } from "3d-tiles-tools";
import { BufferView } from "3d-tiles-tools";

/**
 * A basic class holding information about the structure of
 * buffers that are split into buffer views, for example,
 * from a `Subtree` object.
 */
export interface BinaryBufferStructure {
  buffers?: BufferObject[];
  bufferViews?: BufferView[];
}
