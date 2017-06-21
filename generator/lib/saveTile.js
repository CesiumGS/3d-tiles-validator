'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var zlib = require('zlib');

var defaultValue = Cesium.defaultValue;

module.exports = saveTile;

/**
 * Save a tile to disk.
 *
 * @param {String} path The tile path.
 * @param {Buffer} contents The contents of the tile.
 * @param {Boolean} [gzip=false] Whether to gzip the tile.
 *
 * @returns {Promise} A promise that resolves when the tile is saved.
 */
function saveTile(path, contents, gzip) {
    gzip = defaultValue(gzip, false);
    if (gzip) {
        contents = zlib.gzipSync(contents);
    }
    return fsExtra.outputFile(path, contents);
}
