'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = validateI3dm;

/**
 * Checks if provided buffer has valid i3dm tile content
 *
 * @param {Buffer} content A buffer containing the contents of a i3dm tile.
 * @returns {Object} An object with two parameters - (1) a boolean for whether the tile is a valid i3dm tile
 *                                                   (2) a message to indicate which tile field is invalid, if any
 */
function validateI3dm(content) {
    if (!defined(content)) {
        throw new DeveloperError('i3dm content must be defined');
    }

    if (!Buffer.isBuffer(content)) {
        throw new DeveloperError('content must be of type buffer');
    }

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);
    var gltfFormat = content.readUInt32LE(28);

    var gltfFormatMsg = "";

    if (magic !== 'i3dm') {
        return {
            result : false,
            message: 'Tile has an invalid magic'
        };
    }

    if (version !== 1) {
        return {
            result : false,
            message: 'Tile has an invalid version'
        };
    }

    if (byteLength !== content.length) {
        return {
            result : false,
            message: 'Tile has the wrong byteLength'
        };
    }

    if (gltfFormat === 0) {
        gltfFormatMsg = "with gltf format as a url";
    } else if (gltfFormat === 1) {
        gltfFormatMsg = "with gltf format as an embedded binary gITF";
    } else {
        return {
            result : false,
            message: 'Tile has an invalid gltfFormat'
        };
    }

    return {
        result : true,
        message: 'Tile is a valid ib3m tile ' + gltfFormatMsg
    };
}
