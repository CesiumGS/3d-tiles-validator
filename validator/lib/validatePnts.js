'use strict';
var Cesium = require('cesium');
var bufferToJson = require('../lib/bufferToJson');
var validateBatchTable = require('../lib/validateBatchTable');
var validateFeatureTable = require('../lib/validateFeatureTable');
var Promise = require('bluebird');

var batchTableSchema = require('../specs/data/schema/batchTable.schema.json');
var featureTableSchema = require('../specs/data/schema/featureTable.schema.json');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var Cesium3DTileFeatureTable = Cesium.Cesium3DTileFeatureTable;
var ComponentDatatype = Cesium.ComponentDatatype;

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
    var message;
    var headerByteLength = 28;
    if (content.length < headerByteLength) {
        message = 'Header must be 28 bytes.';
        return Promise.resolve(message);
    }

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);
    var featureTableJsonByteLength = content.readUInt32LE(12);
    var featureTableBinaryByteLength = content.readUInt32LE(16);
    var batchTableJsonByteLength = content.readUInt32LE(20);
    var batchTableBinaryByteLength = content.readUInt32LE(24);

    if (magic !== 'pnts') {
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

    var featureTableJsonByteOffset = headerByteLength;
    var featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
    var batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
    var batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;

    if (featureTableBinaryByteOffset % 8 > 0) {
        message = 'Feature table binary must be aligned to an 8-byte boundary.';
        return Promise.resolve(message);
    }

    if (batchTableBinaryByteOffset % 8 > 0) {
        message = 'Batch table binary must be aligned to an 8-byte boundary.';
        return Promise.resolve(message);
    }

    if (headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength > byteLength) {
        message = 'Feature table and batch table exceed the tile\'s byte length.';
        return Promise.resolve(message);
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
        message = 'Feature table JSON could not be parsed: ' + error.message;
        return Promise.resolve(message);
    }

    try {
        batchTableJson = bufferToJson(batchTableJsonBuffer);
    } catch(error) {
        message = 'Batch table JSON could not be parsed: ' + error.message;
        return Promise.resolve(message);
    }

    var batchLength = defaultValue(featureTableJson.BATCH_LENGTH, 0);
    var pointsLength = featureTableJson.POINTS_LENGTH;
    if (!defined(pointsLength)) {
        message = 'Feature table must contain a POINTS_LENGTH property.';
        return Promise.resolve(message);
    }

    if (!defined(featureTableJson.POSITION) && !defined(featureTableJson.POSITION_QUANTIZED)) {
        message = 'Feature table must contain either the POSITION or POSITION_QUANTIZED property.';
        return Promise.resolve(message);
    }

    if (defined(featureTableJson.POSITION_QUANTIZED) && (!defined(featureTableJson.QUANTIZED_VOLUME_OFFSET) || !defined(featureTableJson.QUANTIZED_VOLUME_SCALE))) {
        message = 'Feature table properties QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE are required when POSITION_QUANTIZED is present.';
        return Promise.resolve(message);
    }

    if (defined(featureTableJson.BATCH_ID) && !defined(featureTableJson.BATCH_LENGTH)) {
        message = 'Feature table property BATCH_LENGTH is required when BATCH_ID is present.';
        return Promise.resolve(message);
    }

    if (!defined(featureTableJson.BATCH_ID) && defined(featureTableJson.BATCH_LENGTH)) {
        message = 'Feature table property BATCH_ID is required when BATCH_LENGTH is present.';
        return Promise.resolve(message);
    }

    if (batchLength > pointsLength) {
        message = 'Feature table property BATCH_LENGTH must be less than or equal to POINTS_LENGTH.';
        return Promise.resolve(message);
    }

<<<<<<< HEAD
    if (defined(featureTableJson.BATCH_ID)) {
        var featureTable = new Cesium3DTileFeatureTable(featureTableJson, featureTableBinary);
        featureTable.featuresLength = pointsLength;
        var componentDatatype = ComponentDatatype.fromName(defaultValue(featureTableJson.BATCH_ID.componentType, 'UNSIGNED_SHORT'));
        var batchIds = featureTable.getPropertyArray('BATCH_ID', componentDatatype, 1);
        var length = batchIds.length;
        for (var i = 0; i < length; i++) {
            if (batchIds[i] >= featureTableJson.BATCH_LENGTH) {
                return 'All the BATCH_IDs must have values less than feature table property BATCH_LENGTH.';
            }
        }
    }

=======
    // incorrect promise handeling
>>>>>>> 88ce503... Conversion to Promise in progress
    var featureTableMessage = validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, pointsLength, featureTableSemantics);
    var temp = 'yo';
    Promise.resolve(featureTableMessage).then(function(data) {
        if (defined(data)) {
            temp = data;
            console.log('temp: ' + temp);
        }
    });
    console.log(temp);
    // incorrect promise handeling
    var batchTableMessage = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, batchLength);
    message = Promise.resolve(batchTableMessage).then(function(data) {
        if (defined(data)) {
            Promise.resolve(data);
        }
    });

    console.log(message);
    if (!defined(message)) {
        return Promise.resolve(message);
    }
}