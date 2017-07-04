'use strict';
var fsExtra = require('fs-extra');
var zlib = require('zlib');
var isGzipped = require('./isGzipped');

module.exports = readTile;

/**
 * Reads tile content from a file.
 *
 * @param {String} filePath The file path.
 * @returns {Promise} A promise that resolves with a Buffer containing the tile's content.
 */
function readTile(filePath) {
    return fsExtra.readFile(filePath)
        .then(function(buffer) {
            if (isGzipped(buffer)) {
                buffer = zlib.gunzipSync(buffer);
            }
            return buffer;
        });
}
