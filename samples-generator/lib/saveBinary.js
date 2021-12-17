'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var zlib = require('zlib');

var defaultValue = Cesium.defaultValue;

module.exports = saveBinary;

/**
 * Save a binary file to disk. (Optionally using gzip)
 *
 * @param {String} path The object destination path.
 * @param {Buffer} contents A binary blob to write.
 * @param {Boolean} [gzip=false] Whether to gzip the tile.
 *
 * @returns {Promise} A promise that resolves when the tile is saved.
 */

function saveBinary(path, contents, gzip) {
    gzip = defaultValue(gzip, false);
    if (gzip) {
        contents = zlib.gzipSync(contents);
    }
    return fsExtra.outputFile(path, contents);
}
