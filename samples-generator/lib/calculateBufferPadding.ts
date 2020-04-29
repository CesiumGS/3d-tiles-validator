/**
 * Typed version of `getBufferPadded.js
 * @param {Buffer} buffer The buffer.
 * @param {Number} [byteOffset=0] The byte offset on which the buffer starts.
 * @returns {Buffer} The padded buffer.
 * @todo Delete `getBufferPadded.js` once all its callers are converted to
 * .ts
 */

export function calculateBufferPadding(buffer: Buffer, byteOffset = 0): Buffer {
    var boundary = 8;
    var byteLength = buffer.length;
    var remainder = (byteOffset + byteLength) % boundary;
    var padding = (remainder === 0) ? 0 : boundary - remainder;
    var emptyBuffer = Buffer.alloc(padding);
    return Buffer.concat([buffer, emptyBuffer]);
}
