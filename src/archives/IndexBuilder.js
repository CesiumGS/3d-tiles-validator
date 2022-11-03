/* eslint-disable */
"use strict";

const crypto = require("crypto");

/**
 * A class that can build an index for a 3TZ file that will be stored
 * as the `"@3dtilesIndex1@"` file.
 */
class IndexBuilder {
  /**
   * Creates a new instance
   */
  constructor() {
    /**
     * The entries that have been added.
     *
     * Each of them has a
     * key : String
     * offset : Number
     * The key is the 'file path', and the offset is the ZIP Local File
     * Offset, as of the 3TZ specification
     *
     * @type {Object}
     * @default []
     */
    this.entries = [];

    /**
     * The current Local File Offset. This is the accumulated offset
     * for all entries that have been added, plus the size for
     * the ZIP Local File Headers for these entries
     *
     * @type {Number}
     * @default 0
     */
    this.currentEntryOffset = 0;
  }

  /**
   * Add the given entry to the index.
   *
   * This assumes that the given path is already normalized, as described
   * in the 3TZ specification: It is the relative path of the file, with
   * slashes `/`, and no leading slash.
   *
   * @param {String} key The key (path) for the entry
   * @param {Number} size The size of the content for this entry
   */
  addEntry(key, size) {
    const offset = this.currentEntryOffset;
    this.entries.push({
      key: key,
      offset: offset,
    });

    // Add the size for the header for this entry, which is the fixed
    // size of the ZIP header (30), plus the length of the file name
    const zipLocalHeaderSize = 30;
    this.currentEntryOffset += key.length + zipLocalHeaderSize + size;
  }

  /**
   * Compares two buffers that contain MD5 hashes.
   *
   * Returns a number that is
   * - 0 when b0==b1
   * - negative when b0<b1
   * - positive when b0>b1
   *
   * @param {Buffer} b0
   * @param {Buffer} b1
   * @returns {Number} The comparison result
   */
  static compareMd5HashBuffers(b0, b1) {
    const lo0 = b0.readBigUInt64LE();
    const lo1 = b1.readBigUInt64LE();
    if (lo0 === lo1) {
      const hi0 = b0.readBigUInt64LE(8);
      const hi1 = b1.readBigUInt64LE(8);
      return Number(hi0 - hi1);
    }
    return Number(lo0 - lo1);
  }

  /**
   * Create the buffer that contains the actual data that can be written
   * into the `"@3dtilesIndex1@"` file.
   *
   * @returns {Buffer} The buffer containing the index data
   */
  createBuffer() {
    // Create the 'encoded' entries that additionally store the
    // buffer that contains the MD5 hash for the key
    const encodedEntries = this.entries.map((e) => {
      const hashBuffer = crypto.createHash("md5").update(e.key).digest();
      return {
        key: e.key,
        offset: e.offset,
        hashBuffer: hashBuffer,
      };
    });

    // Sort the encoded entries, in ascending order, by their MD5 hash
    encodedEntries.sort((e0, e1) => {
      return IndexBuilder.compareMd5HashBuffers(e0.hashBuffer, e1.hashBuffer);
    });

    // Write the sorted and encoded entries into the result buffer
    const entrySize = 24;
    const result = Buffer.alloc(encodedEntries.length * entrySize);
    let offset = 0;
    for (const entry of encodedEntries) {
      const source = entry.hashBuffer;
      source.copy(result, offset, 0, 16);
      offset += 16;
      result.writeBigUint64LE(BigInt(entry.offset), offset);
      offset += 8;
    }
    return result;
  }
}

module.exports = IndexBuilder;
