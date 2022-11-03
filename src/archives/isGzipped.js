/* eslint-disable */
"use strict";

/**
 * Returns whether the given buffer starts with the two magic bytes
 * that indicate that it contains GZIPped data.
 *
 * @param {Buffer} The buffer
 * @return Whether the buffer is GZIPped data
 */
function isGzipped(buffer) {
  if (buffer.length < 2) {
    return false;
  }
  const result = buffer[0] === 0x1f && buffer[1] === 0x8b;
  return result;
}

module.exports = isGzipped;
