'use strict';
var Cesium = require('cesium');
var extractBatchTable = require('../lib/extractBatchTable');
var validateBatchTable = require('../lib/validateBatchTable');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = validateB3dm;

/**
 * Checks if provided buffer has valid b3dm tile content
 *
 * @param {Object} batchTableSchema - A JSON object containing the schema for the batch table.
 * @param {Buffer} content - A buffer containing the contents of a b3dm tile.
 * @returns {Object} An object with two parameters - (1) a boolean for whether the tile is a valid b3dm tile
 *                                                   (2) a message to indicate which tile field is invalid, if any
 */
function validateB3dm(content, batchTableSchema) {
    if (!defined(content)) {
        throw new DeveloperError('b3dm content must be defined');
    }

    if (!Buffer.isBuffer(content)) {
        throw new DeveloperError('content must be of type buffer');
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

    var batchTable = extractBatchTable(magic, content);
    if(defined(batchTable.batchTableJSON)) {
        //validateBatch returns boolean or promise?
        var validBatchTable = validateBatchTable(batchTableSchema, batchTable.batchTableJSON, batchTable.batchTableBinary);
        if(!validBatchTable.validation) {
            return {
                result : false,
                message: validBatchTable.message
            };
        }
    }

    return {
        result : true,
        message: 'b3dm tile is a valid b3dm tile'
    };

}