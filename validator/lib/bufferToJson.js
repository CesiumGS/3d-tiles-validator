'use strict';
module.exports = bufferToJson;

/**
 * Converts a buffer containing a utf-8 encoded JSON string to a JSON object.
 *
 * @param {Buffer} buffer The buffer.
 * @returns {Object} A JSON object.
 */
function bufferToJson(buffer) {
    if (buffer.length === 0) {
        return {};
    }
    return JSON.parse(buffer.toString());
}
