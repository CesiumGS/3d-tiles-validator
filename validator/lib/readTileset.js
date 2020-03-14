'use strict';
const fsExtra = require('fs-extra');
const zlib = require('zlib');

const isGzipped = require('./isGzipped');

module.exports = readTileset;

/**
 * Reads the tileset JSON from a file.
 *
 * @param {String} filePath The file path.
 * @returns {Promise} A promise that resolves to an object containing the tileset JSON.
 */
async function readTileset(filePath) {
    let buffer = await fsExtra.readFile(filePath);
    if (isGzipped(buffer)) {
        buffer = zlib.gunzipSync(buffer);
    }
    return JSON.parse(buffer.toString());
}
