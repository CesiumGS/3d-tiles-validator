import { BufferObject } from "../../structure/BufferObject";
import { BufferView } from "../../structure/BufferView";

/**
 * A basic structure holding the binary part of binary metadata.
 * This is just the buffers and buffer views, for example, from
 * a `SubtreeObject`.
 */
export interface BinaryMetadata {
    buffers?: BufferObject[];
    bufferViews?: BufferView[];
}