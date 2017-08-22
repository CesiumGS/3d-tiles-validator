'use strict';
var Cesium = require('cesium');
var validateB3dm = require('../lib/validateB3dm');
var validateI3dm = require('../lib/validateI3dm');
var validatePnts = require('../lib/validatePnts');
var Promise = require('bluebird');

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
    var message;
    if (content.length < headerByteLength) {
        message = 'Header must be 16 bytes.';
        return Promise.resolve(message);
    }

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);
    var tilesLength = content.readUInt32LE(12);

    if (magic !== 'cmpt') {
        message = 'Invalid magic: ' + magic;
        return Promise.resolve(message);
    }

    if (version !== 1) {
        message = 'Invalid version: ' + version + '. Version must be 1.';
        return Promise.resolve(message);
    }

    if (byteLength !== content.length) {
        message = 'byteLength of ' + byteLength + ' does not equal the tile\'s actual byte length of ' + content.length + '.';
        return Promise.resolve(message);
    }

    var byteOffset = headerByteLength;
    for (var i = 0; i < tilesLength; ++i) {
        if (byteOffset + 12 > byteLength) {
            message = 'Cannot read byte length from inner tile, exceeds cmpt tile\'s byte length.'
            return Promise.resolve(message);
        }
        if (byteOffset % 8 > 0) {
            message = 'Inner tile must be aligned to an 8-byte boundary'
            return Promise.resolve(message);
        }

        var innerTileMagic = content.toString('utf8', byteOffset, byteOffset + 4);
        var innerTileByteLength = content.readUInt32LE(byteOffset + 8);
        var innerTile = content.slice(byteOffset, byteOffset + innerTileByteLength);

        //How to return in this case?
        if (innerTileMagic === 'b3dm') {
            message = validateB3dm(innerTile);
        } else if (innerTileMagic === 'i3dm') {
            message = validateI3dm(innerTile);
        } else if (innerTileMagic === 'pnts') {
            message = validatePnts(innerTile);
        } else if (innerTileMagic === 'cmpt') {
            message = validateCmpt(innerTile);
        } else {
            message = 'Invalid inner tile magic: ' + innerTileMagic;
            return Promise.resolve(message);
        }

        // Want to return if the above functions return an error
        if (message.then.defined !== undefined) {
            var err = 'Error in inner ' + innerTileMagic + ' tile: ' + message
            return Promise.resolve(err);
        }

        byteOffset += innerTileByteLength;
    }
    
    if (!defined(message)) {
        return Promise.resolve(message);
    }
}