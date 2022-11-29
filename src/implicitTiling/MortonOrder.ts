// Ported from https://github.com/CesiumGS/cesium/blob/4b333bc145fa9f7aed0c7ad7e0f46cb001a94ddd/Source/Core/MortonOrder.js

import { defined } from "../base/defined";

/**
 * Morton Order (aka Z-Order Curve) helper functions.
 * @see {@link https://en.wikipedia.org/wiki/Z-order_curve}
 *
 * @internal
 */
export class MortonOrder {
  /**
   * Inserts one 0 bit of spacing between a number's bits. This is the opposite of removeOneSpacing.
   *
   * Example:
   *  input: 6
   *  input (binary):  110
   *  output (binary): 10100
   *                    ^ ^ (added)
   *  output: 20
   *
   * @param v - A 16-bit unsigned integer.
   * @returns A 32-bit unsigned integer.
   * @see {@link https://fgiesen.wordpress.com/2009/12/13/decoding-morton-codes/}
   */
  private static insertOneSpacing(v: number): number {
    v = (v ^ (v << 8)) & 0x00ff00ff;
    v = (v ^ (v << 4)) & 0x0f0f0f0f;
    v = (v ^ (v << 2)) & 0x33333333;
    v = (v ^ (v << 1)) & 0x55555555;
    return v;
  }

  /**
   * Inserts two 0 bits of spacing between a number's bits. This is the opposite of removeTwoSpacing.
   *
   * Example:
   *  input: 6
   *  input (binary):  110
   *  output (binary): 1001000
   *                    ^^ ^^ (added)
   *  output: 72
   *
   * @internal
   * @param v - A 10-bit unsigned integer.
   * @returns A 30-bit unsigned integer.
   * @see {@link https://fgiesen.wordpress.com/2009/12/13/decoding-morton-codes/}
   */
  private static insertTwoSpacing(v: number): number {
    v = (v ^ (v << 16)) & 0x030000ff;
    v = (v ^ (v << 8)) & 0x0300f00f;
    v = (v ^ (v << 4)) & 0x030c30c3;
    v = (v ^ (v << 2)) & 0x09249249;
    return v;
  }

  /**
   * Removes one bit of spacing between bits. This is the opposite of insertOneSpacing.
   *
   * Example:
   *  input: 20
   *  input (binary):  10100
   *                    ^ ^ (removed)
   *  output (binary): 110
   *  output: 6
   *
   * @param v - A 32-bit unsigned integer.
   * @returns A 16-bit unsigned integer.
   * @see {@link https://fgiesen.wordpress.com/2009/12/13/decoding-morton-codes/}
   */
  private static removeOneSpacing(v: number): number {
    v &= 0x55555555;
    v = (v ^ (v >> 1)) & 0x33333333;
    v = (v ^ (v >> 2)) & 0x0f0f0f0f;
    v = (v ^ (v >> 4)) & 0x00ff00ff;
    v = (v ^ (v >> 8)) & 0x0000ffff;
    return v;
  }

  /**
   * Removes two bits of spacing between bits. This is the opposite of insertTwoSpacing.
   *
   * Example:
   *  input: 72
   *  input (binary):  1001000
   *                    ^^ ^^ (removed)
   *  output (binary): 110
   *  output: 6
   *
   * @param v - A 30-bit unsigned integer.
   * @returns A 10-bit unsigned integer.
   * @see {@link https://fgiesen.wordpress.com/2009/12/13/decoding-morton-codes/}
   */
  private static removeTwoSpacing(v: number): number {
    v &= 0x09249249;
    v = (v ^ (v >> 2)) & 0x030c30c3;
    v = (v ^ (v >> 4)) & 0x0300f00f;
    v = (v ^ (v >> 8)) & 0xff0000ff;
    v = (v ^ (v >> 16)) & 0x000003ff;
    return v;
  }

  /**
   * Computes the Morton index from 2D coordinates. This is equivalent to interleaving their bits.
   * The inputs must be 16-bit unsigned integers (resulting in 32-bit Morton index) due to 32-bit bitwise operator limitation in JavaScript.
   *
   * @param x - The X coordinate in the range [0, (2^16)-1].
   * @param y - The Y coordinate in the range [0, (2^16)-1].
   * @returns The Morton index.
   * @internal
   */
  static encode2D(x: number, y: number): number {
    //>>includeStart('debug', pragmas.debug);
    if (x < 0 || x > 65535 || y < 0 || y > 65535) {
      throw new Error("inputs must be 16-bit unsigned integers");
    }
    //>>includeEnd('debug');

    // Note: JavaScript bitwise operations return signed 32-bit integers, so the
    // final result needs to be reintepreted as an unsigned integer using >>> 0.
    // This is not needed for encode3D because the result is guaranteed to be at most
    // 30 bits and thus will always be interpreted as an unsigned value.
    return (
      (MortonOrder.insertOneSpacing(x) |
        (MortonOrder.insertOneSpacing(y) << 1)) >>>
      0
    );
  }

  /**
   * Computes the 2D coordinates from a Morton index. This is equivalent to deinterleaving their bits.
   * The input must be a 32-bit unsigned integer (resulting in 16 bits per coordinate) due to 32-bit bitwise operator limitation in JavaScript.
   *
   * @param mortonIndex - The Morton index in the range [0, (2^32)-1].
   * @param result - The array onto which to store the result.
   * @returns An array containing the 2D coordinates correspoding to the Morton index.
   * @internal
   */
  static decode2D(mortonIndex: number, result: number[]): number[] {
    //>>includeStart('debug', pragmas.debug);
    if (mortonIndex < 0 || mortonIndex > 4294967295) {
      throw new Error("input must be a 32-bit unsigned integer");
    }
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Array(2);
    }

    result[0] = MortonOrder.removeOneSpacing(mortonIndex);
    result[1] = MortonOrder.removeOneSpacing(mortonIndex >> 1);
    return result;
  }

  /**
   * Computes the Morton index from 3D coordinates. This is equivalent to interleaving their bits.
   * The inputs must be 10-bit unsigned integers (resulting in 30-bit Morton index) due to 32-bit bitwise operator limitation in JavaScript.
   *
   * @param x - The X coordinate in the range [0, (2^10)-1].
   * @param y - The Y coordinate in the range [0, (2^10)-1].
   * @param z - The Z coordinate in the range [0, (2^10)-1].
   * @returns The Morton index.
   * @internal
   */
  static encode3D(x: number, y: number, z: number): number {
    //>>includeStart('debug', pragmas.debug);
    if (x < 0 || x > 1023 || y < 0 || y > 1023 || z < 0 || z > 1023) {
      throw new Error("inputs must be 10-bit unsigned integers");
    }
    //>>includeEnd('debug');

    return (
      MortonOrder.insertTwoSpacing(x) |
      (MortonOrder.insertTwoSpacing(y) << 1) |
      (MortonOrder.insertTwoSpacing(z) << 2)
    );
  }

  /**
   * Computes the 3D coordinates from a Morton index. This is equivalent to deinterleaving their bits.
   * The input must be a 30-bit unsigned integer (resulting in 10 bits per coordinate) due to 32-bit bitwise operator limitation in JavaScript.
   *
   * @param mortonIndex - The Morton index in the range [0, (2^30)-1].
   * @param result - The array onto which to store the result.
   * @returns An array containing the 3D coordinates corresponding to the Morton index.
   * @internal
   */
  static decode3D(mortonIndex: number, result: number[]): number[] {
    //>>includeStart('debug', pragmas.debug);
    if (mortonIndex < 0 || mortonIndex > 1073741823) {
      throw new Error("input must be a 30-bit unsigned integer");
    }
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = new Array(3);
    }

    result[0] = MortonOrder.removeTwoSpacing(mortonIndex);
    result[1] = MortonOrder.removeTwoSpacing(mortonIndex >> 1);
    result[2] = MortonOrder.removeTwoSpacing(mortonIndex >> 2);
    return result;
  }
}
