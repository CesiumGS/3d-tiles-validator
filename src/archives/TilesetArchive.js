/* eslint-disable */
"use strict";

/**
 * An interface for a 3D Tiles tileset archive
 */
class TilesetArchive {
  /**
   * Creates a new instance
   */
  constructor() {}

  /**
   * Open an an archive from the given file
   *
   * @param {String} fullInputName The full input file- or directory name
   *
   * @throws {Error} If the archive cannot be opened
   */
  open(fullInputName) {
    throw new Error("This function should be implemented by subclasses");
  }

  /**
   * Returns an iterable over all keys of this archive
   *
   * @return {Iterable<String>} The iterable
   * @throws {Error} If `open` was not called yet
   */
  getKeys() {
    throw new Error("This function should be implemented by subclasses");
  }

  /**
   * Returns the entry that is identified by the given key.
   *
   * @param {String} key The key for the entry
   * @returns A buffer containing the data for the specified entry, or
   * `undefined` if there is no entry for the given key
   * @throws {Error} If `open` was not called yet
   */
  getEntry(key) {
    throw new Error("This function should be implemented by subclasses");
  }

  /**
   * Close this archive
   *
   * @throws {Error} If `open` was not called yet
   */
  close() {
    throw new Error("This function should be implemented by subclasses");
  }
}

module.exports = TilesetArchive;
