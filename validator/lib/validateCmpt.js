'use strict';
var Cesium = require('cesium');
var validateB3dm = require('../lib/validateB3dm.js');
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
        var innerTileMagic = content.toString('utf8', byteOffset, byteOffset + sizeOfUint32);
        var innerTileByteLength = content.readUInt32LE(byteOffset + 2 * sizeOfUint32);

        var innerTile;
        var validatorResult;

        if (innerTileMagic === 'b3dm') {
            innerTile = new Buffer(24);
            content.copy(innerTile, 0, byteOffset, byteOffset + innerTileByteLength);
            validatorResult = validateB3dm(innerTile);
            isValid = isValid && validatorResult.result;
        }

        else if (innerTileMagic === 'i3dm'){
            innerTile = new Buffer(32);
            content.copy(innerTile, 0, byteOffset, byteOffset + innerTileByteLength);
            validatorResult = validateI3dm(innerTile);
            isValid = isValid && validatorResult.result;
        }

        else if (innerTileMagic === 'pnts'){
            innerTile = new Buffer(28);
            content.copy(innerTile, 0, byteOffset, byteOffset + innerTileByteLength);
            validatorResult = validatePnts(innerTile);
            isValid = isValid && validatorResult.result;
        }

        else if (innerTileMagic === 'cmpt') {
            innerTile = new Buffer(innerTileByteLength);
            content.copy(innerTile, 0, byteOffset, byteOffset + innerTileByteLength);
            validatorResult = validateCmpt(innerTile);
            isValid = isValid && validatorResult.result;
        }

        else {
            isValid = false;
            errorAddon += 'Inner tile header magic cannot be identified';
        }

        byteOffset = byteOffset + innerTileByteLength; // skip over this tile

        if( (byteOffset + 12 > byteLength) && (i + 1 !== tilesLength) ) {
            isValid = false;
            errorAddon += 'Cmpt header given tilesLength = ' + tilesLength + '. Found number of inner tiles = ' + (i + 1);
        }

        if (!isValid) {
            var errorMessage = 'Cmpt header has an invalid inner tile:\n';
            errorMessage += 'Invalid inner tile index = ' + i + ' starting at byte = ' + (byteOffset - innerTileByteLength) + '\n';
            errorMessage += 'Invalid inner tile has magic = ' + innerTileMagic;
            if (defined(validatorResult)) {
                errorMessage += '\n' + validatorResult.message;
            }

            if(errorAddon.length !== 0) {
                errorMessage += '\n' + errorAddon;
            }

            return {
                result : false,
                message: errorMessage
            };
        }
    }

    if (byteOffset !== byteLength) {
        return {
            result : false,
            message: 'Header has invalid inner tile formats or tileLength field. Expected end of tile = ' + byteLength + '. Found end of tile = ' + byteOffset
        };
    }

    return {
        result : isValid,
        message: 'valid'
    };
}
