'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var fs = require('fs-extra');
var zlib = require('zlib');

var DeveloperError = Cesium.DeveloperError;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var fsOutputFile = Promise.promisify(fs.outputFile);
var zlibGzip = Promise.promisify(zlib.gzip);

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
    if (!defined(filePath)) {
        throw new DeveloperError('filePath must be defined.');
    }
    if (!defined(tileData)) {
        throw new DeveloperError('tileData must be defined.');
    }
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var gzip = defaultValue(options.gzip, false);
    var promise;
    if (gzip) {
        promise = zlibGzip(tileData);
    } else {
        promise = Promise.resolve(tileData);
    }
    return promise.then(function(data) {
        return fsOutputFile(filePath, data);
    });
}