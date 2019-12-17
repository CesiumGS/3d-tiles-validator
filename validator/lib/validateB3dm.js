'use strict';
var Cesium = require('cesium');
var bufferToJson = require('../lib/bufferToJson');
var validateBatchTable = require('../lib/validateBatchTable');
var validateFeatureTable = require('../lib/validateFeatureTable');
var validateGlb = require('../lib/validateGlb');

var batchTableSchema = require('../specs/data/schema/batchTable.schema.json');
var featureTableSchema = require('../specs/data/schema/featureTable.schema.json');

var defined = Cesium.defined;

module.exports = validateB3dm;

var featureTableSemantics = {
    BATCH_LENGTH : {
        global : true,
        type : 'SCALAR',
        componentType : 'UNSIGNED_INT'
    }
};

/**
 * Checks if provided buffer has valid b3dm tile content
 *
 * @param {Buffer} content A buffer containing the contents of a b3dm tile.
 * @returns {String} An error message if validation fails, otherwise undefined.
 */
function validateB3dm(content, filePath) {
    var headerByteLength = 28;
    if (content.length < headerByteLength) {
        return 'Header must be 28 bytes.';
    }

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);
    var featureTableJsonByteLength = content.readUInt32LE(12);
    var featureTableBinaryByteLength = content.readUInt32LE(16);
    var batchTableJsonByteLength = content.readUInt32LE(20);
    var batchTableBinaryByteLength = content.readUInt32LE(24);

    if (magic !== 'b3dm') {
        return 'Invalid magic: ' + magic;
    }

    if (version !== 1) {
        return 'Invalid version: ' + version + '. Version must be 1.';
    }

    if (byteLength !== content.length) {
        return 'byteLength of ' + byteLength + ' does not equal the tile\'s actual byte length of ' + content.length + '.';
    }

    // Legacy header #1: [batchLength] [batchTableByteLength]
    // Legacy header #2: [batchTableJsonByteLength] [batchTableBinaryByteLength] [batchLength]
    // Current header: [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength]
    // If the header is in the first legacy format 'batchTableJsonByteLength' will be the start of the JSON string (a quotation mark) or the glTF magic.
    // Accordingly its first byte will be either 0x22 or 0x67, and so the minimum uint32 expected is 0x22000000 = 570425344 = 570MB. It is unlikely that the batch table JSON will exceed this length.
    // The check for the second legacy format is similar, except it checks 'batchTableBinaryByteLength' instead
    if (batchTableJsonByteLength >= 570425344) {
        return 'Header is using the legacy format [batchLength] [batchTableByteLength]. The new format is [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength].';
    } else if (batchTableBinaryByteLength >= 570425344) {
        return 'Header is using the legacy format [batchTableJsonByteLength] [batchTableBinaryByteLength] [batchLength]. The new format is [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength].';
    }

    var featureTableJsonByteOffset = headerByteLength;
    var featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
    var batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
    var batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;
    var glbByteOffset = batchTableBinaryByteOffset + batchTableBinaryByteLength;
    var glbByteLength = Math.max(byteLength - glbByteOffset, 0);

    if (featureTableBinaryByteOffset % 8 > 0) {
        return 'Feature table binary must be aligned to an 8-byte boundary.';
    }

    if (batchTableBinaryByteOffset % 8 > 0) {
        return 'Batch table binary must be aligned to an 8-byte boundary.';
    }

    if (glbByteOffset % 8 > 0) {
        return 'Glb must be aligned to an 8-byte boundary.';
    }

    if (headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + glbByteLength > byteLength) {
        return 'Feature table, batch table, and glb byte lengths exceed the tile\'s byte length.';
    }

    var featureTableJsonBuffer = content.slice(featureTableJsonByteOffset, featureTableBinaryByteOffset);
    var featureTableBinary = content.slice(featureTableBinaryByteOffset, batchTableJsonByteOffset);
    var batchTableJsonBuffer = content.slice(batchTableJsonByteOffset, batchTableBinaryByteOffset);
    var batchTableBinary = content.slice(batchTableBinaryByteOffset, glbByteOffset);
    var glbBuffer = content.slice(glbByteOffset, byteLength);

    var featureTableJson;
    var batchTableJson;

    try {
        featureTableJson = bufferToJson(featureTableJsonBuffer);
    } catch(error) {
        return 'Feature table JSON could not be parsed: ' + error.message;
    }

    try {
        batchTableJson = bufferToJson(batchTableJsonBuffer);
    } catch(error) {
        return 'Batch table JSON could not be parsed: ' + error.message;
    }

    var featuresLength = featureTableJson.BATCH_LENGTH;
    if (!defined(featuresLength)) {
        return 'Feature table must contain a BATCH_LENGTH property.';
    }

    var featureTableMessage = validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
    if (defined(featureTableMessage)) {
        return featureTableMessage;
    }

    var batchTableMessage = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
    if (defined(batchTableMessage)) {
        return batchTableMessage;
    }

    var glbMessage = validateGlb(glbBuffer, filePath + ".glb");
    if (defined(glbMessage)) {
        return glbMessage;
    }
}
