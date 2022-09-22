import { defined } from "../base/defined";

import { AvailabilityInfo } from "./AvailabilityInfo";
import { BufferAvailabilityInfo } from "./BufferAvailabilityInfo";
import { ConstantAvailabilityInfo } from "./ConstantAvailabilityInfo";
import { ImplicitTilings } from "./ImplicitTilings";

import { Availability } from "../structure/Availability";
import { TileImplicitTiling } from "../structure/TileImplicitTiling";

/**
 * Methods for creating `AvailabilityInfo` instances
 *
 * @private
 */
export class AvailabilityInfos {
  /**
   * Creates a new `AvailabilityInfo` for the given availability
   * information, for tile- or content availability.
   *
   * @param availability The `Availability` object
   * @param bufferViewDatas The `BufferView` data chunks
   * @param implicitTiling The `TileImplicitTiling` object
   * @returns The `AvailabilityInfo` object
   */
  static createTileOrContent(
    availability: Availability,
    bufferViewDatas: Buffer[],
    implicitTiling: TileImplicitTiling
  ): AvailabilityInfo {
    const length =
    ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling);
    const constant = availability.constant;
    if (defined(constant)) {
      const available = constant === 1;
      return new ConstantAvailabilityInfo(available, length);
    }
    // The bitstream MUST be defined when constant is undefined
    const bitstream = availability.bitstream!;
    const bufferViewData = bufferViewDatas[bitstream];
    return new BufferAvailabilityInfo(bufferViewData, length);
  }

  /**
   * Creates a new `AvailabilityInfo` for the given availability
   * information, for child subtree availability
   *
   * @param availability The `Availability` object
   * @param bufferViewDatas The `BufferView` data chunks
   * @param implicitTiling The `TileImplicitTiling` object
   * @returns The `AvailabilityInfo` object
   */
  static createChildSubtree(
    availability: Availability,
    bufferViewDatas: Buffer[],
    implicitTiling: TileImplicitTiling
  ): AvailabilityInfo {
    const length = ImplicitTilings.computeNumberOfNodesInLevel(
      implicitTiling,
      implicitTiling.subtreeLevels
    );
    const constant = availability.constant;
    if (defined(constant)) {
      const available = constant === 1;
      return new ConstantAvailabilityInfo(available, length);
    }
    // The bitstream MUST be defined when constant is undefined
    const bitstream = availability.bitstream!;
    const bufferViewData = bufferViewDatas[bitstream];
    return new BufferAvailabilityInfo(bufferViewData, length);
  }
}