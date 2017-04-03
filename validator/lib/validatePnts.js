'use strict';
var Cesium = require('cesium');
var batchTableSchema = require('../specs/data/schema/batchTable.schema.json');
var validateBatchTable = require('../lib/validateBatchTable');

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
        throw new DeveloperError('pnts content must be of type buffer');
    }

    if (content.length < 28) {
        return {
            result : false,
            message: 'pnts tile header must be 28 bytes'
        };
    }

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);

    if (magic !== 'pnts') {
        return {
            result : false,
            message: 'pnts tile has an invalid magic'
        };
    }

    if (version !== 1) {
        return {
            result : false,
            message: 'pnts tile has an invalid version'
        };
    }

    if (byteLength !== content.length) {
        return {
            result : false,
            message: 'pnts tile has the wrong byteLength'
        };
    }

    var batchTableJSONByteLength = content.readUInt32LE(20);
    var batchTable;
    if (batchTableJSONByteLength > 0) {
        batchTable = extractBatchTable(content);
    }

    if ((defined(batchTable)) && (defined(batchTable.batchTableJSON))) {
        var validBatchTable = validateBatchTable(batchTableSchema, batchTable.batchTableJSON, batchTable.batchTableBinary);
        if (!validBatchTable.validation) {
            return {
                result : false,
                message: validBatchTable.message
            };
        }
    }

    return {
        result : true,
        message: 'Tile is a valid pnts tile'
    };
}

/**
 * Extracts the batch table from the provided tile
 *
 * @param {Buffer} tile - A buffer containing the contents of the tile
 * @returns {Object}  - A JSON object representing the batch table, containing (1) the batch table JSON,
 *                     (2)batch table binary, (3) message for error or success
 */

function extractBatchTable(tile) {
    var byteLength = tile.length;
    var batchTableJSONByteOffset = 20;
    var batchTableOffset = 28;

    var batchTableJSONByteLength = tile.readUInt32LE(batchTableJSONByteOffset);
    var batchTableBinaryByteLength = tile.readUInt32LE(batchTableJSONByteOffset + 4);
    var message = '';
    var batchTableJSON, batchTableBinary;

    if (batchTableJSONByteLength > 0) {
        if ((batchTableOffset + batchTableJSONByteLength) > byteLength) {
            message += 'batchTableJSONByteLength is out of bounds at ' + batchTableOffset + batchTableJSONByteLength;
        } else {
            var batchTableJSONHeader = tile.slice(batchTableOffset, batchTableOffset + batchTableJSONByteLength);
            batchTableJSON = JSON.parse(batchTableJSONHeader.toString());
        }

        batchTableOffset += batchTableJSONByteLength;

        if ((batchTableOffset + batchTableBinaryByteLength) > byteLength) {
            message += '\nbatchTableBinaryByteLength is out of bounds at ' + batchTableOffset + batchTableBinaryByteLength;
        } else {
            batchTableBinary = tile.slice(batchTableOffset, batchTableOffset + batchTableBinaryByteLength);
        }
    } else {
        message = 'Error: trying to extract batch table with length <= 0';
    }

    if (message === '') {
        message = 'successfully extracted batch table'
    }

    return {
        batchTableJSON: batchTableJSON,
        batchTableBinary: batchTableBinary,
        message: message
    };
}
