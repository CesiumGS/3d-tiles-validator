'use strict';
var Cesium = require('cesium');
var bufferToJson = require('../lib/bufferToJson');
var validateBatchTable = require('../lib/validateBatchTable');
var validateFeatureTable = require('../lib/validateFeatureTable');

var batchTableSchema = require('../specs/data/schema/batchTable.schema.json');
var featureTableSchema = require('../specs/data/schema/featureTable.schema.json');

var defined = Cesium.defined;

module.exports = validatePnts;

var featureTableSemantics = {
    POSITION : {
        global : false,
        type : 'VEC3',
        componentType : 'FLOAT'
    },
    POSITION_QUANTIZED : {
        global : false,
        type : 'VEC3',
        componentType : 'UNSIGNED_SHORT'
    },
    RGBA : {
        global : false,
        type : 'VEC4',
        componentType : 'UNSIGNED_BYTE'
    },
    RGB : {
        global : false,
        type : 'VEC3',
        componentType : 'UNSIGNED_BYTE'
    },
    RGB565 : {
        global : false,
        type : 'SCALAR',
        componentType : 'UNSIGNED_SHORT'
    },
    NORMAL : {
        global : false,
        type : 'VEC3',
        componentType : 'FLOAT'
    },
    NORMAL_OCT16P : {
        global : false,
        type : 'VEC2',
        componentType : 'UNSIGNED_BYTE'
    },
    BATCH_ID : {
        global : false,
        type : 'SCALAR',
        componentType : 'UNSIGNED_SHORT',
        componentTypeOptions : ['UNSIGNED_BYTE', 'UNSIGNED_SHORT', 'UNSIGNED_INT']
    },
    POINTS_LENGTH : {
        global : true,
        type : 'SCALAR',
        componentType : 'UNSIGNED_INT'
    },
    RTC_CENTER : {
        global : true,
        type : 'VEC3',
        componentType : 'FLOAT'
    },
    QUANTIZED_VOLUME_OFFSET : {
        global : true,
        type : 'VEC3',
        componentType : 'FLOAT'
    },
    QUANTIZED_VOLUME_SCALE : {
        global : true,
        type : 'VEC3',
        componentType : 'FLOAT'
    },
    CONSTANT_RGBA : {
        global : true,
        type : 'VEC4',
        componentType : 'UNSIGNED_BYTE'
    },
    BATCH_LENGTH : {
        global : true,
        type : 'SCALAR',
        componentType : 'UNSIGNED_INT'
    }
};

/**
 * Checks if provided buffer has valid pnts tile content
 *
 * @param {Buffer} content A buffer containing the contents of a pnts tile.
 * @returns {String} An error message if validation fails, otherwise undefined.
 */
function validatePnts(content) {
    var headerByteLength = 28;
    if (content.length < headerByteLength) {
        return 'header must be 28 bytes';
    }

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);
    var featureTableJsonByteLength = content.readUInt32LE(12);
    var featureTableBinaryByteLength = content.readUInt32LE(16);
    var batchTableJsonByteLength = content.readUInt32LE(20);
    var batchTableBinaryByteLength = content.readUInt32LE(24);

    if (magic !== 'pnts') {
        return 'invalid magic: ' + magic;
    }

    if (version !== 1) {
        return 'invalid version: ' + version;
    }

    if (byteLength !== content.length) {
        return 'byteLength (' + byteLength + ') does not equal the tile\'s actual byte length (' + content.length + ')';
    }

    var featureTableJsonByteOffset = headerByteLength;
    var featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
    var batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
    var batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;

    if (featureTableBinaryByteOffset % 8 > 0) {
        return 'feature table binary must be aligned to an 8-byte boundary';
    }

    if (batchTableBinaryByteOffset % 8 > 0) {
        return 'batch table binary must be aligned to an 8-byte boundary';
    }

    if (headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength > byteLength) {
        return 'feature table and batch table exceed the tile\'s byte length';
    }

    var featureTableJsonBuffer = content.slice(featureTableJsonByteOffset, featureTableBinaryByteOffset);
    var featureTableBinary = content.slice(featureTableBinaryByteOffset, batchTableJsonByteOffset);
    var batchTableJsonBuffer = content.slice(batchTableJsonByteOffset, batchTableBinaryByteOffset);
    var batchTableBinary = content.slice(batchTableBinaryByteOffset, byteLength);

    var featureTableJson;
    var batchTableJson;

    try {
        featureTableJson = bufferToJson(featureTableJsonBuffer);
    } catch(error) {
        return 'feature table json could not be parsed: ' + error.message;
    }

    try {
        batchTableJson = bufferToJson(batchTableJsonBuffer);
    } catch(error) {
        return 'batch table json could not be parsed: ' + error.message;
    }

    var pointsLength = featureTableJson.POINTS_LENGTH;
    var batchLength = featureTableJson.BATCH_LENGTH;
    if (!defined(pointsLength)) {
        return 'feature table must contain a POINTS_LENGTH property';
    }

    var featureTableMessage = validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, pointsLength, featureTableSemantics);
    if (defined(featureTableMessage)) {
        return featureTableMessage;
    }

    var batchTableMessage = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, batchLength);
    if (defined(batchTableMessage)) {
        return batchTableMessage;
    }
}
