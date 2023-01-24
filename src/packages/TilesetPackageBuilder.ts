/**
 * An interface for classes that can create tileset packages.
 */
export interface TilesetPackageBuilder {
  /**
   * Start the creation of an package with the given
   * output file name.
   *
   * @param fullOutputName - The name of the output file or directory
   * @param overwrite - Whether output files should be overwritten
   * when they already exists
   *
   * @throws {@link TilesetPackageError} If the output is a file that already
   * exists, and `overwrite` was not true.
   */
  begin(fullOutputName: string, overwrite: boolean): void;

  /**
   * Add the given entry to the package that is being built.
   *
   * @param key - The key for the entry
   * @param content - The value for the entry
   * @throws {@link TilesetPackageError} If `begin` was not called yet
   */
  addEntry(key: string, content: Buffer): void;

  /**
   * Finalize the creation of the package.
   *
   * @throws {@link TilesetPackageError} If `begin` was not called yet
   */
  end(): Promise<void>;
}
