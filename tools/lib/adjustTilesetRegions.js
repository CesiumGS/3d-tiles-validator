'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var readFile = require('./readFile');

var Check = Cesium.Check;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = adjustTilesetRegions;

/**
 * Adjust the regions of a tileset.
 *
 * @param {Object} options Object with the following properties:
 * @param {String} options.inputDirectory Path to the input directory.
 * @param {String} [options.outputDirectory] Path to the output directory.
 * @param {Number} [options.longitudeOffset=0.0] Longitude offset to apply.
 * @param {Number} [options.latitudeOffset=0.0] Latitude offset to apply.
 * @param {WriteCallback} [options.writeCallback] A callback function that writes files after they have been processed.
 * @param {LogCallback} [options.logCallback] A callback function that logs messages.
 *
 * @returns {Promise} A promise that resolves when the operation completes.
 */
function adjustTilesetRegions(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var inputDirectory = options.inputDirectory;
    var outputDirectory = options.outputDirectory;
    var longitudeOffset = defaultValue(options.longitudeOffset, 0.0);
    var latitudeOffset = defaultValue(options.latitudeOffset, 0.0);

    Check.typeOf.string('options.inputDirectory', inputDirectory);

    inputDirectory = path.normalize(inputDirectory);
    outputDirectory = path.normalize(defaultValue(outputDirectory,
        path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-offset')));

    var tilesetJson = path.join(inputDirectory, 'tileset.json');
    var outputTilesetJson = path.join(outputDirectory, 'tileset.json');
    return readFile(tilesetJson, 'json')
        .then(function(json) {
            adjust(json.root, longitudeOffset, latitudeOffset);
            return fsExtra.copy(inputDirectory, outputDirectory)
                .then(function() {
                    return fsExtra.outputJson(outputTilesetJson, json);
                })
        });
}

function adjust(tile, longitudeOffset, latitudeOffset) {
    var region = tile.boundingVolume.region;
    region[0] += longitudeOffset;
    region[1] += latitudeOffset;
    region[2] += longitudeOffset;
    region[3] += latitudeOffset;
    var children = tile.children;
    if (defined(children) && children.length > 0) {
        for (var i = 0; i < children.length; ++i) {
            adjust(children[i], longitudeOffset, latitudeOffset);
        }
    }
}
