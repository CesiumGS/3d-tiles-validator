/* eslint-disable */
"use strict";

/**
 * An interface for classes that can create tileset archives.
 */
class TilesetArchiveBuilder {
  /**
   * Creates a new instance
   */
  constructor() {}

  /**
   * Start the creation of an archive with the given
   * output file name.
   *
   * @param {String} fullOutputName The name of the output file or directory
   * @param {Boolean} overwrite Whether output files should be overwritten
   * when they already exists
   *
   * @throws {Error} If the output is a file that already exists,
   * and `overwrite` was not truthy.
   */
  begin(fullOutputName, overwrite) {
    throw new Error("This function should be implemented by subclasses");
  }

  /**
   * Add the given entry to the archive that is being built.
   *
   * @param {String} key The key for the entry
   * @param {Buffer} content The value for the entry
   * @throws {Error} If `begin` was not called yet
   */
  addEntry(key, content) {
    throw new Error("This function should be implemented by subclasses");
  }

  /**
   * Finalize the creation of the archive.
   *
   * @throws {Error} If `begin` was not called yet
   */
  async end() {
    throw new Error("This function should be implemented by subclasses");
  }
}

module.exports = TilesetArchiveBuilder;
