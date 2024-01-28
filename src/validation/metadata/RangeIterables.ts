import { DeveloperError } from "@3d-tiles-tools/base";

/**
 * Methods to create iterables over ranges
 */
export class RangeIterables {
  /**
   * Creates an iterable over the given 1D range
   *
   * @param size - The size
   * @returns The iterable
   * @throws DeveloperError if the size is negative
   */
  static range1D(size: number): Iterable<number> {
    if (size < 0) {
      throw new DeveloperError(`The size may not be negative, but is ${size}`);
    }
    const resultIterable = {
      [Symbol.iterator]: function* (): Iterator<number> {
        for (let x = 0; x < size; x++) {
          yield x;
        }
      },
    };
    return resultIterable;
  }
  /**
   * Creates an iterable over the given 2D range
   *
   * @param sizeX - The size in x-direction
   * @param sizeY - The size in y-direction
   * @returns The iterable
   * @throws DeveloperError if any size is negative
   */
  static range2D(sizeX: number, sizeY: number): Iterable<[number, number]> {
    if (sizeX < 0) {
      throw new DeveloperError(
        `The sizeX may not be negative, but is ${sizeX}`
      );
    }
    if (sizeY < 0) {
      throw new DeveloperError(
        `The sizeY may not be negative, but is ${sizeX}`
      );
    }
    const resultIterable = {
      [Symbol.iterator]: function* (): Iterator<[number, number]> {
        for (let y = 0; y < sizeY; y++) {
          for (let x = 0; x < sizeX; x++) {
            yield [x, y];
          }
        }
      },
    };
    return resultIterable;
  }
}
