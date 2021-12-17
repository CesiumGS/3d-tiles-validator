'use strict';
const fsExtra = require('fs-extra');
const zlib = require('zlib');

const isGzipped = require('./isGzipped');

module.exports = readTile;

/**
 * Reads tile content from a file.
 *
 * @param {String} filePath The file path.
 * @returns {Promise} A promise that resolves to a buffer containing the tile's content.
 */
async function readTile(filePath) {
    let buffer = await fsExtra.readFile(filePath);
    if (isGzipped(buffer)) {
        buffer = zlib.gunzipSync(buffer);
    }
    return buffer;
}
