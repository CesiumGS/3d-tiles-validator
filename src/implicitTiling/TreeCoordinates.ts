/**
 * An interface for coordinates within a tree structure.
 */
export interface TreeCoordinates {
  /**
   * Returns the level of the coordinates, with 0 being
   * the root node.
   *
   * @returns The level
   */
  get level(): number;

  /**
   * Returns the parent coordinates of these coordinates,
   * or `null` if this is the root.
   *
   * @returns The parent coordinates
   */
  parent(): TreeCoordinates | null;

  /**
   * Returns a generator for the child coordinates of these coordinates
   *
   * @returns The child coordinates
   */
  children(): IterableIterator<TreeCoordinates>;

  /**
   * Returns a generator for all coordinates that are descendants
   * of these coordinates, up to the given level, **inclusive!**.
   *
   * @param maxLevelInclusive The maximum level, **inclusive**
   * @returns The child coordinates
   */
  descendants(maxLevelInclusive: number): IterableIterator<TreeCoordinates>;

  /**
   * Preliminary:
   *
   * Returns the index that corresponds to these coordinates.
   *
   * This returns the (stacked) Morton index. This could be considered
   * as an implementation detail, but is frequently used in implicit
   * tiling, and therefore, part of this interface.
   */
  toIndex(): number;

  /**
   * Preliminary:
   *
   * Returns the index that corresponds to these coordinates, within
   * their level.
   *
   * This returns the local Morton index. This could be considered
   * as an implementation detail, but is frequently used in implicit
   * tiling, and therefore, part of this interface.
   */
  toIndexInLevel(): number;
}
