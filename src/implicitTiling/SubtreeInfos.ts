import { defined } from "../base/defined";
import { defaultValue } from "../base/defaultValue";
import { bufferToJson } from "../base/bufferToJson";

import { SubtreeInfo } from "./SubtreeInfo";
import { AvailabilityInfos } from "./AvailabilityInfos";

import { ResourceResolver } from "../io/ResourceResolver";

import { ImplicitTilingError } from "./ImplicitTilingError";

import { Subtree } from "../structure/Subtree";
import { TileImplicitTiling } from "../structure/TileImplicitTiling";

/**
 * Methods to create `SubtreeInfo` instances.
 */
export class SubtreeInfos {
  /**
   * Creates a new `SubtreeInfo` from the given binary subtree data.
   *
   * This method assumes that the given binary data is consistent
   * and valid. This can be checked with the `SubtreeValidator`
   * class.
   *
   * @param input The whole buffer of a binary subtree file
   * @param implicitTiling The `TileImplicitTiling` that
   * defines the expected structure of the subtree data
   * @param resourceResolver The `ResourceResolver` that
   * will be used to resolve buffer URIs
   * @returns A promise with the `SubtreeInfo`
   * @throws An ImplicitTilingError when the subtree JSON could
   * not be parsed, or there was a buffer without a URI
   * and no binary buffer was given, or one of the requested
   * buffers could not be resolved.
   */
  static async createFromBuffer(
    input: Buffer,
    implicitTiling: TileImplicitTiling,
    resourceResolver: ResourceResolver
  ): Promise<SubtreeInfo> {
    const headerByteLength = 24;
    const jsonByteLength = input.readBigUint64LE(8);
    const binaryByteLength = input.readBigUint64LE(16);

    // Extract the JSON data
    const jsonStartByteOffset = headerByteLength;
    const jsonEndByteOffset = jsonStartByteOffset + Number(jsonByteLength);
    const jsonBuffer = input.subarray(jsonStartByteOffset, jsonEndByteOffset);
    let subtreeJson: any;
    let subtree: Subtree;
    try {
      subtreeJson = bufferToJson(jsonBuffer);
      subtree = subtreeJson;
    } catch (error) {
      throw new ImplicitTilingError("Could not parse subtree JSON data");
    }

    // Extract the binary buffer
    const binaryStartByteOffset = jsonEndByteOffset;
    const binaryEndByteOffset =
      binaryStartByteOffset + Number(binaryByteLength);
    const binaryBufferSlice = input.subarray(
      binaryStartByteOffset,
      binaryEndByteOffset
    );
    const binaryBuffer =
      binaryBufferSlice.length > 0 ? binaryBufferSlice : undefined;

    return SubtreeInfos.create(
      subtree,
      binaryBuffer,
      implicitTiling,
      resourceResolver
    );
  }

  /**
   * Creates a new `SubtreeInfo` from the given `Subtree` object
   * and the (optional) binary buffer.
   *
   * This method assumes that the given data is consistent
   * and valid. This can be checked with the `SubtreeValidator`
   * class.
   *
   * @param subtree The `Subtree` object
   * @param binaryBuffer The optional binary buffer
   * @param implicitTiling The `TileImplicitTiling` that
   * defines the expected structure of the subtree data
   * @param resourceResolver The `ResourceResolver` that
   * will be used to resolve buffer URIs
   * @returns A promise with the `SubtreeInfo`
   * @throws A ImplicitTilingError when there was a buffer without
   * a URI and no binary buffer was given, or the requested buffer
   * data could not be resolved.
   */
  static async create(
    subtree: Subtree,
    binaryBuffer: Buffer | undefined,
    implicitTiling: TileImplicitTiling,
    resourceResolver: ResourceResolver
  ): Promise<SubtreeInfo> {
    // Obtain the buffer data objects: One `Buffer` for
    // each `BufferObject` of the subtree
    const bufferDatas = [];
    const buffers = defaultValue(subtree.buffers, []);
    for (const buffer of buffers) {
      if (!defined(buffer.uri)) {
        if (!defined(buffer)) {
          throw new ImplicitTilingError(
            "Expected a binary buffer, but got undefined"
          );
        }
        bufferDatas.push(binaryBuffer);
      } else {
        //console.log("Obtaining buffer data from " + buffer.uri);
        const bufferData = await resourceResolver.resolve(buffer.uri!);
        if (!defined(bufferData)) {
          const message = `Could not resolve subtree buffer ${buffer.uri}`;
          throw new ImplicitTilingError(message);
        }
        bufferDatas.push(bufferData);
      }
    }

    // Obtain the buffer view data objects: One `Buffer` for
    // each `BufferView` of the subtree
    const bufferViewDatas = [];
    const bufferViews = defaultValue(subtree.bufferViews, []);
    for (const bufferView of bufferViews) {
      const bufferData = bufferDatas[bufferView.buffer];
      const start = bufferView.byteOffset;
      const end = start + bufferView.byteLength;
      const bufferViewData = bufferData!.subarray(start, end);
      bufferViewDatas.push(bufferViewData);
    }

    // Create the `AvailabilityInfo` for the tile availability
    const tileAvailability = subtree.tileAvailability;
    const tileAvailabilityInfo = AvailabilityInfos.createTileOrContent(
      tileAvailability,
      bufferViewDatas,
      implicitTiling
    );

    // Create the `AvailabilityInfo` objects, one for
    // each content availability
    const contentAvailabilityInfos = [];
    const contentAvailabilities = subtree.contentAvailability;
    if (defined(contentAvailabilities)) {
      for (const contentAvailability of contentAvailabilities!) {
        const contentAvailabilityInfo = AvailabilityInfos.createTileOrContent(
          contentAvailability,
          bufferViewDatas,
          implicitTiling
        );
        contentAvailabilityInfos.push(contentAvailabilityInfo);
      }
    }

    // Create the `AvailabilityInfo` for the child subtree availability
    const childSubtreeAvailability = subtree.childSubtreeAvailability;
    const childSubtreeAvailabilityInfo = AvailabilityInfos.createChildSubtree(
      childSubtreeAvailability,
      bufferViewDatas,
      implicitTiling
    );

    const result = new SubtreeInfo(
      tileAvailabilityInfo,
      contentAvailabilityInfos,
      childSubtreeAvailabilityInfo
    );
    return result;
  }
}
