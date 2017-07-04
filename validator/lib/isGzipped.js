'use strict';
module.exports = isGzipped;

/**
 * Test if the provided buffer contains gzipped data.
 *
 * @param {Buffer} buffer The buffer.
 * @returns {Boolean} True if the data is gzipped, false if not.
 */
function isGzipped(buffer) {
    return buffer[0] === 0x1f && buffer[1] === 0x8b;
}
