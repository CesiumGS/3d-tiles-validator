'use strict';

module.exports = extractBatchTable;

/**
 * Extracts the batch table from the provided tile
 *
 * @param {String} magic - A string representing the magic of the provided tile
 * @param {Buffer} tile - A buffer containing the contents of the tile
 * @returns {Object} A JSON object representing the batch table, containing the batch table JSON and batch table biinary
 */

function extractBatchTable(magic, tile) {
    var byteLength = tile.length;
    var featureTableJSONByteLength, featureTableBinaryByteLength, batchTableOffset, batchTableJSONByteOffset, tileBodyOffset,
    batchTableJSON, batchTableBinary;
    switch (magic) {
        case 'b3dm':
            batchTableJSONByteOffset = 12;
            tileBodyOffset = batchTableOffset = 24;
            break;
        case 'i3dm':
            batchTableJSONByteOffset = 20;
            tileBodyOffset = 32;
            featureTableJSONByteLength = tile.readUInt32LE(12);
            featureTableBinaryByteLength = tile.readUInt32LE(16);
            batchTableOffset = tileBodyOffset + featureTableJSONByteLength + featureTableBinaryByteLength;
            break;
        case 'pnts':
            batchTableJSONByteOffset = 20;
            tileBodyOffset = 28;
            featureTableJSONByteLength = tile.readUInt32LE(12);
            featureTableBinaryByteLength = tile.readUInt32LE(16);
            batchTableOffset = tileBodyOffset + featureTableJSONByteLength + featureTableBinaryByteLength;
            break;
    }

    var batchTableJSONByteLength = tile.readUInt32LE(batchTableJSONByteOffset);
    var batchTableBinaryByteLength = tile.readUInt32LE(batchTableJSONByteOffset + 4);

    if(batchTableJSONByteLength > 0) {

        if((batchTableOffset + batchTableJSONByteLength) > byteLength) {
            return {
                result: false,
                message: magic + ' tile\'s batchTableJSONByteLength is out of bounds'
            };
        }
        var batchTableJSONHeader = tile.slice(batchTableOffset, batchTableOffset + batchTableJSONByteLength);
        batchTableJSON = JSON.parse(batchTableJSONHeader.toString());
        batchTableOffset += batchTableJSONByteLength;

        if((batchTableOffset + batchTableJSONByteLength) > byteLength) {
            return {
                result: false,
                message: magic + ' tile\'s batchTableBinaryByteLength is out of bounds'
            };
        }

        batchTableBinary = tile.slice(batchTableOffset, batchTableOffset + batchTableBinaryByteLength);
    }

    return {
        batchTableJSON: batchTableJSON,
        batchTableBinary: batchTableBinary
    };
}
