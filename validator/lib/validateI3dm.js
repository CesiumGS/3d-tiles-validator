'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = validateI3dm;

/**
 * Checks if provided buffer has valid i3dm tile content
 *
 * @param {Buffer} content - A buffer containing the contents of a i3dm tile.
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

    if (magic !== 'i3dm') {
        return {
            result : false,
            message: 'Header has an invalid magic field. Expected version = \'i3dm\'. Found magic = ' + magic
        };
    }

    if (version !== 1) {
        return {
            result : false,
            message: 'Header has an invalid version field. Expected version = 1. Found version = ' + version
        };
    }

    if (byteLength !== content.length) {
        return {
            result : false,
            message: 'Header has an invalid byteLength field. Expected byteLength = ' + content.length + '. Found byteLength = ' + byteLength
        };
    }

    if (gltfFormat !== 0 && gltfFormat !== 1) {
        return {
            result : false,
            message: 'Header has an invalid gltfFormat field. Expected gltfFormat = 0 or 1. Found gltfFormat = ' + gltfFormat
        };
    }

    return {
        result : true,
        message: 'valid'
    };
}
