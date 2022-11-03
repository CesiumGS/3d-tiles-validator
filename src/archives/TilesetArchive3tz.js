/* eslint-disable */
"use strict";

const fs = require("fs");

const TilesetArchive = require("./TilesetArchive");
const archiveFunctions = require("./archiveFunctions");

const defined = require("./defined");

/**
 * Implementation of a TilesetArchive based on a 3TZ file.
 */
class TilesetArchive3tz extends TilesetArchive {
  constructor() {
    super();

    /**
     * The file descriptor that was created from the input file
     *
     * @type {Number}
     * @default undefined
     */
    this.fd = undefined;

    /**
     * The ZIP index.
     *
     * This is created from the `"@3dtilesIndex1@"` file of an archive.
     *
     * It is an array that contains entries of the form
     * {'md5hash': hash, 'offset': offset}
     * where `md5hash` is a buffer with the MD5 hash of the entry,
     * and `offset` is a number that is the Local File Offset for
     * the entry, sorted by the MD5 hash, in ascending order.
     *
     * @type {Array<Object>}
     * @default undefined
     */
    this.zipIndex = undefined;
  }

  open(fullInputName) {
    if (defined(this.fd)) {
      throw new Error("Archive already opened");
    }

    this.fd = fs.openSync(fullInputName, "r");
    this.zipIndex = archiveFunctions.readZipIndex(this.fd);
  }

  getKeys() {
    if (!defined(this.fd)) {
      throw new Error("Archive is not opened. Call 'open' first.");
    }
    let index = 0;
    const that = this;
    return {
      [Symbol.iterator]: function () {
        return this;
      },
      next: function () {
        if (index >= that.zipIndex.length) {
          return { done: true };
        }
        const entry = that.zipIndex[index];
        const offset = entry.offset;
        const fileName = archiveFunctions.readFileName(that.fd, offset);
        const result = {
          value: fileName,
          done: false,
        };
        index++;
        return result;
      },
    };
  }

  getEntry(key) {
    if (!defined(this.fd)) {
      throw new Error("Archive is not opened. Call 'open' first.");
    }
    const entryData = archiveFunctions.readEntryData(
      this.fd,
      this.zipIndex,
      key
    );
    return entryData;
  }

  close() {
    if (!defined(this.fd)) {
      throw new Error("Archive is not opened. Call 'open' first.");
    }
    fs.closeSync(this.fd);

    this.fd = undefined;
    this.zipIndex = undefined;
  }
}

module.exports = TilesetArchive3tz;
