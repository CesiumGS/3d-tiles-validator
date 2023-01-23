/**
 * An interface for a 3D Tiles tileset package
 */
export interface TilesetPackage {
  /**
   * Open an a package from the given file or directory
   *
   * @param fullInputName - The full input file- or directory name
   *
   * @throws {@link TilesetPackageError} If the package cannot be opened
   */
  open(fullInputName: string): void;

  /**
   * Returns an iterable over all keys of this package
   *
   * @returns The iterable
   * @throws {@link TilesetPackageError} If `open` was not called yet
   */
  getKeys(): IterableIterator<string>;

  /**
   * Returns the entry that is identified by the given key.
   *
   * @param key - The key for the entry
   * @returns A buffer containing the data for the specified entry, or
   * `undefined` if there is no entry for the given key
   * @throws {@link TilesetPackageError} If `open` was not called yet
   */
  getEntry(key: string): Buffer | undefined;

  /**
   * Close this package
   *
   * @throws {@link TilesetPackageError} If `open` was not called yet
   */
  close(): void;
}
