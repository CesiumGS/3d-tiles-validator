'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var fs = require('fs-extra');
var zlib = require('zlib');
var isGzipped = require('./isGzipped');

var DeveloperError = Cesium.DeveloperError;
var defined = Cesium.defined;

var fsReadFile = Promise.promisify(fs.readFile);
var zlibGunzip = Promise.promisify(zlib.gunzip);

module.exports = readTile;

/**
 * Reads tile data from a file.
 *
 * @param {String} filePath The file path to read from.
 * @returns {Promise} A promise that resolves with the data when the read operation completes.
 */
function readTile(filePath) {
    if (!defined(filePath)) {
        throw new DeveloperError('filePath must be defined');
    }
    return fsReadFile(filePath)
        .then(function(buffer) {
            if (isGzipped(buffer)) {
                return zlibGunzip(buffer);
            }
            return buffer;
        });
}