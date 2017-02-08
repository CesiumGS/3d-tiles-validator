'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
var zlib = require('zlib');

var fsExtraOutputFile = Promise.promisify(fsExtra.outputFile);

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
    return fsExtraOutputFile(path, contents);
}
