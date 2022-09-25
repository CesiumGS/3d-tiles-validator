import { defined } from "../base/defined";

import { AvailabilityInfo } from "./AvailabilityInfo";
import { BufferAvailabilityInfo } from "./BufferAvailabilityInfo";
import { ConstantAvailabilityInfo } from "./ConstantAvailabilityInfo";
import { ImplicitTilings } from "./ImplicitTilings";

import { Availability } from "../structure/Availability";
import { TileImplicitTiling } from "../structure/TileImplicitTiling";
import { ImplicitTilingError } from "./ImplicitTilingError";

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
   * @throws ImplicitTilingError If the given data is structurally
   * invalid.
   */
  static createTileOrContent(
    availability: Availability,
    bufferViewDatas: Buffer[],
    implicitTiling: TileImplicitTiling
  ): AvailabilityInfo {
    const length =
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling);
    return AvailabilityInfos.create(availability, bufferViewDatas, length);
  }

  /**
   * Creates a new `AvailabilityInfo` for the given availability
   * information, for child subtree availability
   *
   * @param availability The `Availability` object
   * @param bufferViewDatas The `BufferView` data chunks
   * @param implicitTiling The `TileImplicitTiling` object
   * @returns The `AvailabilityInfo` object
   * @throws ImplicitTilingError If the given data is structurally
   * invalid.
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
    return AvailabilityInfos.create(availability, bufferViewDatas, length);
  }

  /**
   * Creates a new `AvailabilityInfo` for the given availability
   * information, for child subtree availability
   *
   * @param availability The `Availability` object
   * @param bufferViewDatas The `BufferView` data chunks
   * @param length The length of the availability info
   * @returns The `AvailabilityInfo` object
   */
  private static create(
    availability: Availability,
    bufferViewDatas: Buffer[],
    length: number
  ): AvailabilityInfo {
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
