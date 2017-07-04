'use strict';
var Cesium = require('cesium');
var validateB3dm = require('../lib/validateB3dm');
var validateI3dm = require('../lib/validateI3dm');
var validatePnts = require('../lib/validatePnts');

var defined = Cesium.defined;

module.exports = validateCmpt;

/**
 * Checks if the provided buffer has valid cmpt tile content.
 *
 * @param {Buffer} content A buffer containing the contents of a cmpt tile.
 * @returns {String} An error message if validation fails, otherwise undefined.
 */
function validateCmpt(content) {
    var headerByteLength = 16;
    if (content.length < headerByteLength) {
        return 'header must be 16 bytes';
    }

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);
    var tilesLength = content.readUInt32LE(12);

    if (magic !== 'cmpt') {
        return 'Invalid magic: ' + magic;
    }

    if (version !== 1) {
        return 'Invalid version: ' + version;
    }

    if (byteLength !== content.length) {
        return 'byteLength of ' + byteLength + ' does not equal the tile\'s actual byte length of ' + content.length + '.';
    }

    var byteOffset = headerByteLength;
    for (var i = 0; i < tilesLength; ++i) {
        if (byteOffset + 12 > byteLength) {
            return 'Cannot read byte length from inner tile, exceeds cmpt tile\'s byte length.';
        }
        if (byteOffset % 8 > 0) {
            return 'Inner tile must be aligned to an 8-byte boundary';
        }

        var innerTileMagic = content.toString('utf8', byteOffset, byteOffset + 4);
        var innerTileByteLength = content.readUInt32LE(byteOffset + 8);
        var innerTile = content.slice(byteOffset, byteOffset + innerTileByteLength);

        var message;
        if (innerTileMagic === 'b3dm') {
            message = validateB3dm(innerTile);
        } else if (innerTileMagic === 'i3dm') {
            message = validateI3dm(innerTile);
        } else if (innerTileMagic === 'pnts') {
            message = validatePnts(innerTile);
        } else if (innerTileMagic === 'cmpt') {
            message = validateCmpt(innerTile);
        }

        if (defined(message)) {
            return message;
        }

        byteOffset += innerTileByteLength;
    }
}
