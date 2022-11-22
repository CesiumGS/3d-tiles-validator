/**
 * An interface for a 3D Tiles tileset archive
 */
export interface TilesetArchive {
  /**
   * Open an an archive from the given file or directory
   *
   * @param fullInputName The full input file- or directory name
   *
   * @throws {TilesetArchiveError} If the archive cannot be opened
   */
  open(fullInputName: string): void;

  /**
   * Returns an iterable over all keys of this archive
   *
   * @return The iterable
   * @throws {TilesetArchiveError} If `open` was not called yet
   */
  getKeys(): IterableIterator<string>;

  /**
   * Returns the entry that is identified by the given key.
   *
   * @param key The key for the entry
   * @returns A buffer containing the data for the specified entry, or
   * `undefined` if there is no entry for the given key
   * @throws {TilesetArchiveError} If `open` was not called yet
   */
  getEntry(key: string): Buffer | undefined;

  /**
   * Close this archive
   *
   * @throws {TilesetArchiveError} If `open` was not called yet
   */
  close(): void;
}
