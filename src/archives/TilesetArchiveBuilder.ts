/**
 * An interface for classes that can create tileset archives.
 */
export interface TilesetArchiveBuilder {
  /**
   * Start the creation of an archive with the given
   * output file name.
   *
   * @param fullOutputName - The name of the output file or directory
   * @param overwrite - Whether output files should be overwritten
   * when they already exists
   *
   * @throws {TilesetArchiveError} If the output is a file that already
   * exists, and `overwrite` was not true.
   */
  begin(fullOutputName: string, overwrite: boolean): void;

  /**
   * Add the given entry to the archive that is being built.
   *
   * @param key - The key for the entry
   * @param content - The value for the entry
   * @throws {TilesetArchiveError} If `begin` was not called yet
   */
  addEntry(key: string, content: Buffer): void;

  /**
   * Finalize the creation of the archive.
   *
   * @throws {TilesetArchiveError} If `begin` was not called yet
   */
  end(): Promise<void>;
}
