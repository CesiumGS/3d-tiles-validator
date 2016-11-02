'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = validatePnts;

/**
 * Checks if provided buffer has valid pnts tile content
 *
 * @param {Buffer} content - A buffer containing the contents of a pnts tile.
 * @returns {Object} An object with two parameters - (1) a boolean for whether the tile is a valid pnts tile
 *                                                   (2) a message to indicate which tile field is invalid, if any
 */
function validatePnts(content) {
    if (!defined(content)) {
        throw new DeveloperError('pnts content must be defined');
    }

    if (!Buffer.isBuffer(content)) {
        throw new DeveloperError('content must be of type buffer');
    }

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);

    if (magic !== 'pnts') {
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

    return {
        result : true,
        message: 'Tile is a valid pnts tile'
    };
}