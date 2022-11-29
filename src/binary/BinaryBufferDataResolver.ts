import { defined } from "../base/defined";
import { defaultValue } from "../base/defaultValue";
import { ResourceError } from "../base/ResourceError";

import { ResourceResolver } from "../io/ResourceResolver";

import { BinaryBufferData } from "./BinaryBufferData";
import { BinaryBufferStructure } from "../validation/metadata/BinaryBufferStructure";

/**
 * A class for resolving binary buffer data.
 */
export class BinaryBufferDataResolver {
  /**
   * Resolves the buffer data that is defined in the given structure.
   *
   * It receives a `BinaryBufferStructure` that contains the
   * `BufferObject` and `BufferView` definitions, resolves the
   * data from the buffer URIs using the given resource resolver,
   * and returns a `BinaryBufferData` that contains the actual
   * binary buffer data.
   *
   * The given `binaryBuffer` will be used as the buffer data
   * for any buffer that does not have a URI (intended for
   * binary subtree files))
   *
   * @param binaryBufferStructure - The `BinaryBufferStructure`
   * @param binaryBuffer - The optional binary buffer
   * @param resourceResolver - The `ResourceResolver`
   * @returns The `BinaryBufferData`
   * @throws ResourceError If the data could not be resolved
   */
  static async resolve(
    binaryBufferStructure: BinaryBufferStructure,
    binaryBuffer: Buffer | undefined,
    resourceResolver: ResourceResolver
  ): Promise<BinaryBufferData> {
    // Obtain the buffer data objects: One `Buffer` for
    // each `BufferObject`
    const buffersData: Buffer[] = [];
    const buffers = defaultValue(binaryBufferStructure.buffers, []);
    for (const buffer of buffers) {
      if (!defined(buffer.uri)) {
        if (!defined(binaryBuffer)) {
          throw new ResourceError(
            "Expected a binary buffer, but got undefined"
          );
        }
        buffersData.push(binaryBuffer!);
      } else {
        //console.log("Obtaining buffer data from " + buffer.uri);
        const bufferData = await resourceResolver.resolveData(buffer.uri!);
        if (!defined(bufferData)) {
          const message = `Could not resolve buffer ${buffer.uri}`;
          throw new ResourceError(message);
        }
        buffersData.push(bufferData!);
      }
    }

    // Obtain the buffer view data objects: One `Buffer` for
    // each `BufferView`
    const bufferViewsData = [];
    const bufferViews = defaultValue(binaryBufferStructure.bufferViews, []);
    for (const bufferView of bufferViews) {
      const bufferData = buffersData[bufferView.buffer];
      const start = bufferView.byteOffset;
      const end = start + bufferView.byteLength;
      const bufferViewData = bufferData!.subarray(start, end);
      bufferViewsData.push(bufferViewData);
    }

    const binarybBufferData: BinaryBufferData = {
      buffersData: buffersData,
      bufferViewsData: bufferViewsData,
    };
    return binarybBufferData;
  }
}
