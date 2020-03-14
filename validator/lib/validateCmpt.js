'use strict';
const Cesium = require('cesium');

const validateB3dm = require('./validateB3dm');
const validateI3dm = require('./validateI3dm');
const validatePnts = require('./validatePnts');

const clone = Cesium.clone;
const defined = Cesium.defined;

module.exports = validateCmpt;

/**
 * Checks if the provided buffer has valid cmpt tile content.
 *
 * @param {Object} options An object with the following properties:
 * @param {Buffer} options.content A buffer containing the contents of a cmpt tile.
 * @param {String} options.filePath The tile's file path.
 * @param {String} options.directory The tile's directory.
 * @param {Boolean} [options.writeReports=false] Write glTF error report next to the glTF file in question.
 * @returns {Promise} A promise that resolves when the validation completes. If the validation fails, the promise will resolve to an error message.
 */
async function validateCmpt(options) {
    options = clone(options, false);
    const content = options.content;

    const headerByteLength = 16;
    if (content.length < headerByteLength) {
        return 'Header must be 16 bytes.';
    }

    const magic = content.toString('utf8', 0, 4);
    const version = content.readUInt32LE(4);
    const byteLength = content.readUInt32LE(8);
    const tilesLength = content.readUInt32LE(12);

    if (magic !== 'cmpt') {
        return `Invalid magic: ${magic}`;
    }

    if (version !== 1) {
        return `Invalid version: ${version}. Version must be 1.`;
    }

    if (byteLength !== content.length) {
        return `byteLength of ${byteLength} does not equal the tile\'s actual byte length of ${content.length}.`;
    }

    let byteOffset = headerByteLength;
    for (let i = 0; i < tilesLength; i++) {
        if (byteOffset + 12 > byteLength) {
            return 'Cannot read byte length from inner tile, exceeds cmpt tile\'s byte length.';
        }
        if (byteOffset % 8 > 0) {
            return 'Inner tile must be aligned to an 8-byte boundary';
        }

        const innerTileMagic = content.toString('utf8', byteOffset, byteOffset + 4);
        const innerTileByteLength = content.readUInt32LE(byteOffset + 8);
        const innerTile = content.slice(byteOffset, byteOffset + innerTileByteLength);

        options.content = innerTile;

        let message;
        if (innerTileMagic === 'b3dm') {
            message = await validateB3dm(options);
        } else if (innerTileMagic === 'i3dm') {
            message = await validateI3dm(options);
        } else if (innerTileMagic === 'pnts') {
            message = await validatePnts(options);
        } else if (innerTileMagic === 'cmpt') {
            message = await validateCmpt(options);
        } else {
            return `Invalid inner tile magic: ${innerTileMagic}`;
        }

        if (defined(message)) {
            return `Error in inner ${innerTileMagic} tile: ${message}`;
        }

        byteOffset += innerTileByteLength;
    }
}
