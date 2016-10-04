'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var fs = require('fs-extra');
var zlib = require('zlib');

var defaultValue = Cesium.defaultValue;

var fsOutputFile = Promise.promisify(fs.outputFile);

module.exports = writeTile;

/**
 * Writes the tile data to a file.
 *
 * @param {String} filePath The file path where the tile should be written.
 * @param {Buffer} tileData A buffer containing the tile data to write.
 * @param {Object} [options] Defines custom behavior for writing.
 * @param {Boolean} [options.gzip=false] Flag to gzip the buffer data before writing.
 * @returns {Promise} A promise that resolves when the write operation completes.
 */
function writeTile(filePath, tileData, options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var gzip = defaultValue(options.gzip, false);
    if (gzip) {
        tileData = zlib.gzipSync(tileData);
    }
    return fsOutputFile(filePath, tileData);
}
