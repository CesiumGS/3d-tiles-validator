'use strict';
var Cesium = require('cesium');
var batchTableSchema = require('../specs/data/schema/batchTable.schema.json');
var validateBatchTable = require('../lib/validateBatchTable');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = validateB3dm;

/**
 * Checks if provided buffer has valid b3dm tile content
 *
 * @param {Buffer} content - A buffer containing the contents of a b3dm tile.
 * @returns {Object} An object with two parameters - (1) a boolean for whether the tile is a valid b3dm tile
 *                                                   (2) a message to indicate which tile field is invalid, if any
 */
function validateB3dm(content) {
    if (!defined(content)) {
        throw new DeveloperError('b3dm content must be defined');
    }

    if (!Buffer.isBuffer(content)) {
        throw new DeveloperError('b3dm content must be of type buffer');
    }

    if (content.length < 28) {
        return {
            result : false,
            message: 'b3dm tile header must be 28 bytes'
        };
    }

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);

    if (magic !== 'b3dm') {
        return {
            result : false,
            message: 'b3dm tile has an invalid magic'
        };
    }

    if (version !== 1) {
        return {
            result : false,
            message: 'b3dm tile has an invalid version'
        };
    }

    if (byteLength !== content.length) {
        return {
            result : false,
            message: 'b3dm tile has the wrong byteLength'
        };
    }

    var offset = 28;
    var batchTableJSONByteLength = content.readUInt32LE(20);
    var batchTableBinaryByteLength = content.readUInt32LE(24);
    if (batchTableJSONByteLength > 0) {
        var batchTableJSONHeader = content.slice(offset, offset + batchTableJSONByteLength);
        offset +=  batchTableJSONByteLength;
        var batchTableBinary = content.slice(offset, offset + batchTableBinaryByteLength);

        if((batchTableJSONHeader.length == batchTableJSONByteLength) && (batchTableBinary.length == batchTableBinaryByteLength))  {
            var batchTableJSON = JSON.parse(batchTableJSONHeader.toString());
            var validBatchTable = validateBatchTable(batchTableSchema, batchTableJSON, batchTableBinary);
            if (!validBatchTable.validation) {
                return {
                    result : false,
                    message: validBatchTable.message
                };
            }
        } else {
            return {
                result: false,
                message: 'b3dm has invalid batch table lengths'
            }
        }
    }

    return {
        result : true,
        message: 'b3dm tile is a valid b3dm tile'
    };
}