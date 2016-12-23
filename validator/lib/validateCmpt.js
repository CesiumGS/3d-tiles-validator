'use strict';
var Cesium = require('cesium');
var validateB3dm = require('../lib/validateB3dm');
var validateI3dm = require('../lib/validateI3dm');
var validatePnts = require('../lib/validatePnts');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = validateCmpt;

/**
 * Checks if provided buffer has valid cmpt tile content
 *
 * @param {Buffer} content - A buffer containing the contents of a cmpt tile.
 * @returns {Object} An object with two parameters - (1) a boolean for whether the tile is a valid cmpt tile
 *                                                   (2) a message to indicate which tile field is invalid, if any
 */
function validateCmpt(content) {
    if (!defined(content)) {
        throw new DeveloperError('cmpt content must be defined');
    }

    if (!Buffer.isBuffer(content)) {
        throw new DeveloperError('content must be of type buffer');
    }

    var headerByteLength = 16;

    if (content.length < headerByteLength) {
        return {
            result : false,
            message: 'Cmpt header must have min byte length of 16. Current header length = ' + content.length
        };
    }

    var byteOffset = 16;
    var sizeOfUint32 = 4;
    var isValid = true;

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);
    var tilesLength = content.readUInt32LE(12);

    if (magic !== 'cmpt') {
        return {
            result : false,
            message: 'Cmpt header has an invalid magic field. Expected magic = \'cmpt\'. Found magic = ' + magic
        };
    }

    if (version !== 1) {
        return {
            result : false,
            message: 'Cmpt header has an invalid version field. Expected version = 1. Found version = ' + version
        };
    }

    if (byteLength !== content.length) {
        return {
            result : false,
            message: 'Cmpt header has an invalid byteLength field. Expected byteLength = ' + content.length + '. Found byteLength = ' + byteLength
        };
    }

    for (var i = 0; i < tilesLength; i++) {
        var errorAddon = '';
        var validatorResult;

        if (byteOffset + 3 * sizeOfUint32 > byteLength) {
            return {
                result : false,
                message: 'Cmpt header given tilesLength = ' + tilesLength + '. Found number of inner tiles = ' + (i + 1)
            };
        }

        var innerTileMagic = content.toString('utf8', byteOffset, byteOffset + sizeOfUint32);
        var innerTileByteLength = content.readUInt32LE(byteOffset + 2 * sizeOfUint32);

        if (byteOffset + innerTileByteLength > byteLength) {
            return {
                result : false,
                message: 'Inner ' + innerTileMagic + ' tile exceeds provided buffer\'s length. Byte length = ' + byteLength + '. Inner tile\'s end = ' + byteOffset + innerTileByteLength
            };
        }

        var innerTile = content.slice(byteOffset, byteOffset + innerTileByteLength);

        if (innerTileMagic === 'b3dm') {
            validatorResult = validateB3dm(innerTile);
            isValid = isValid && validatorResult.result;
            errorAddon += validatorResult.message;
        } else if (innerTileMagic === 'i3dm') {
            validatorResult = validateI3dm(innerTile);
            isValid = isValid && validatorResult.result;
            errorAddon += validatorResult.message;
        } else if (innerTileMagic === 'pnts') {
            validatorResult = validatePnts(innerTile);
            isValid = isValid && validatorResult.result;
            errorAddon += validatorResult.message;
        } else if (innerTileMagic === 'cmpt') {
            validatorResult = validateCmpt(innerTile);
            isValid = isValid && validatorResult.result;
            errorAddon += validatorResult.message;
        } else {
            isValid = false;
            errorAddon += 'Inner tile header magic cannot be identified; header = ' + innerTileMagic;
        }

        byteOffset = byteOffset + innerTileByteLength; // skip over this tile

        if (!isValid) {
            var errorMessage = 'Cmpt header has an invalid inner tile:\n';
            errorMessage += 'Invalid inner tile index = ' + i + ' starting at byte = ' + (byteOffset - innerTileByteLength) + '\n';
            errorMessage += 'Invalid inner tile has magic = ' + innerTileMagic + '\n';
            errorMessage += errorAddon;

            return {
                result : false,
                message: errorMessage
            };
        }
    }

    return {
        result : true,
        message: 'valid cmpt'
    };
}
