/* eslint-disable */
"use strict";

const zlib = require("zlib");

const shouldGzip = require("./shouldGzip");

/**
 * Creates a function that may apply compression to certain entries
 * for a 3D Tiles archive.
 *
 * The function will receive entries of the form
 * {
 *    key: PathLike
 *    value: Buffer
 * }
 * and return entries with the same structure, but with the
 * buffer potentially containing a compressed version of the
 * original data.
 *
 * The exact criteria for compressing files are not specified.
 *
 * @returns {Function} The compression function
 */
function createEntryCompressor() {
  const entryCompressor = (entry) => {
    const key = entry.key;
    let value = entry.value;
    if (shouldGzip(entry.key, entry.value)) {
      value = zlib.gzipSync(entry.value);
    }
    return {
      key: key,
      value: value,
    };
  };
  return entryCompressor;
}

module.exports = createEntryCompressor;
