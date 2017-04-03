'use strict';
var Cesium = require('cesium');
var batchTableSchema = require('../specs/data/schema/batchTable.schema.json');
var validateBatchTable = require('../lib/validateBatchTable');

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
        throw new DeveloperError('i3dm content must be of type buffer');
    }

    if (content.length < 32) {
        return {
            result : false,
            message: 'i3dm tile header must be 28 bytes'
        };
    }

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);
    var gltfFormat = content.readUInt32LE(28);

    if (magic !== 'i3dm') {
        return {
            result : false,
            message: 'i3dm tile has an invalid magic field. Expected version = \'i3dm\'. Found magic = ' + magic
        };
    }

    if (version !== 1) {
        return {
            result : false,
            message: 'i3dm tile has an invalid version field. Expected version = 1. Found version = ' + version
        };
    }

    if (byteLength !== content.length) {
        return {
            result : false,
            message: 'i3dm tile has an invalid byteLength field. Expected byteLength = ' + content.length + '. Found byteLength = ' + byteLength
        };
    }

    if (gltfFormat !== 0 && gltfFormat !== 1) {
        return {
            result : false,
            message: 'i3dm tile has an invalid gltfFormat field. Expected gltfFormat = 0 or 1. Found gltfFormat = ' + gltfFormat
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
        message: 'valid'
    };
}

function extractBatchTable(tile) {
    var byteLength = tile.length;
    var batchTableJSONByteOffset = 20;
    var batchTableOffset = 32;

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