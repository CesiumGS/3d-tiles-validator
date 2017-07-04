'use strict';
var fsExtra = require('fs-extra');
var zlib = require('zlib');
var isGzipped = require('./isGzipped');

module.exports = readTileset;

/**
 * Reads the tileset JSON from a file.
 *
 * @param {String} filePath The file path.
 * @returns {Promise} A promise that resolves with a JSON object of the tileset.
 */
function readTileset(filePath) {
    return fsExtra.readFile(filePath)
        .then(function (buffer) {
            if (isGzipped(buffer)) {
                buffer = zlib.gunzipSync(buffer);
            }
            return JSON.parse(buffer.toString());
        });
}
