'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var path = require('path');
var zlib = require('zlib');

var getDefaultWriteCallback = require('./getDefaultWriteCallback');
var getFilesInDirectory = require('./getFilesInDirectory');
var isTileFile = require('./isTileFile');
var readTile = require('./readTile');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

var zlibGzip = Promise.promisify(zlib.gzip);

module.exports = gzipTileset;

/**
 * gzips or ungzips the input tileset.
 *
 * @param {Object} options Object with the following properties:
 * @param {String} options.inputDirectory Path to the input directory.
 * @param {Object} [options.outputDirectory] Path to the output directory.
 * @param {Boolean} [options.gzip=true] Whether to gzip or ungzip the tileset.
 * @param {Boolean} [options.tilesOnly=false] Only gzip tiles, does not gzip tileset.json or other files.
 * @param {WriteCallback} [options.writeCallback] A callback function that writes files after they have been processed.
 * @param {LogCallback} [options.logCallback] A callback function that logs messages.
 */
function gzipTileset(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var inputDirectory = options.inputDirectory;
    var outputDirectory = options.outputDirectory;
    var gzip = defaultValue(options.gzip, true);
    var tilesOnly = defaultValue(options.tilesOnly, false);

    if (!defined(inputDirectory)) {
        throw new DeveloperError('inputDirectory is required');
    }
    inputDirectory = path.normalize(inputDirectory);
    outputDirectory = path.normalize(defaultValue(outputDirectory,
        path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-' + (gzip ? 'gzipped' : 'ungzipped'))));

    var writeCallback = defaultValue(options.writeCallback, getDefaultWriteCallback());
    var logCallback = options.logCallback;

    if (defined(logCallback)) {
        logCallback((gzip ? 'Compressing' : 'Uncompressing') + ' files...');
    }

    return getFilesInDirectory(inputDirectory, {
        recursive: true
    }).map(function (filename) {
        var writeFile = path.join(outputDirectory, path.relative(inputDirectory, filename));
        return readTile(filename)
            .then(function(data) {
                if (gzip && (!tilesOnly || isTileFile(writeFile))) {
                    return zlibGzip(data);
                }
                return Promise.resolve(data);
            })
            .then(function(data) {
                return writeCallback(writeFile, data);
            });
    });
}
