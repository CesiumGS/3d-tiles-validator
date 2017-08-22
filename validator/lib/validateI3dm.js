'use strict';
var Cesium = require('cesium');
var bufferToJson = require('../lib/bufferToJson');
var utility = require('../lib/utility');
var validateBatchTable = require('../lib/validateBatchTable');
var validateFeatureTable = require('../lib/validateFeatureTable');
var validateGlb = require('../lib/validateGlb');
var Promise = require('bluebird');

var batchTableSchema = require('../specs/data/schema/batchTable.schema.json');
var featureTableSchema = require('../specs/data/schema/featureTable.schema.json');

var isBufferValidUtf8 = utility.isBufferValidUtf8;

var defined = Cesium.defined;

module.exports = validateI3dm;

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
    NORMAL_UP : {
        global : false,
        type : 'VEC3',
        componentType : 'FLOAT'
    },
    NORMAL_RIGHT : {
        global : false,
        type : 'VEC3',
        componentType : 'FLOAT'
    },
    NORMAL_UP_OCT32P : {
        global : false,
        type : 'VEC2',
        componentType : 'UNSIGNED_SHORT'
    },
    NORMAL_RIGHT_OCT32P : {
        global : false,
        type : 'VEC2',
        componentType : 'UNSIGNED_SHORT'
    },
    SCALE : {
        global : false,
        type : 'SCALAR',
        componentType : 'FLOAT'
    },
    SCALE_NON_UNIFORM : {
        global : false,
        type : 'VEC3',
        componentType : 'FLOAT'
    },
    BATCH_ID : {
        global : false,
        type : 'SCALAR',
        componentType : 'UNSIGNED_SHORT',
        componentTypeOptions : ['UNSIGNED_BYTE', 'UNSIGNED_SHORT', 'UNSIGNED_INT']
    },
    INSTANCES_LENGTH : {
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
    EAST_NORTH_UP : {
        global : true,
        type : 'boolean'
    }
};

/**
 * Checks if the provided buffer has valid i3dm tile content.
 *
 * @param {Buffer} content A buffer containing the contents of an i3dm tile.
 * @returns {String} An error message if validation fails, otherwise undefined.
 */
function validateI3dm(content) {
    var headerByteLength = 32;
    var message;

    if (content.length < headerByteLength) {
        message = 'Header must be 32 bytes.';;
        return Promise.resolve(message);
    }

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);
    var featureTableJsonByteLength = content.readUInt32LE(12);
    var featureTableBinaryByteLength = content.readUInt32LE(16);
    var batchTableJsonByteLength = content.readUInt32LE(20);
    var batchTableBinaryByteLength = content.readUInt32LE(24);
    var gltfFormat = content.readUInt32LE(28);

    if (magic !== 'i3dm') {
        message = 'Invalid magic: ' + magic;;
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

    if (gltfFormat > 1) {
        return 'invalid gltfFormat "' + gltfFormat + '". Must be 0 or 1.';
    }

    var featureTableJsonByteOffset = headerByteLength;
    var featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
    var batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
    var batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;
    var glbByteOffset = batchTableBinaryByteOffset + batchTableBinaryByteLength;
    var glbByteLength = Math.max(byteLength - glbByteOffset, 0);

    if (featureTableBinaryByteOffset % 8 > 0) {
        message = 'Feature table binary must be aligned to an 8-byte boundary.';;
        return Promise.resolve(message);
    }

    if (batchTableBinaryByteOffset % 8 > 0) {
        message = 'Batch table binary must be aligned to an 8-byte boundary.';
        return Promise.resolve(message);
    }

    var embeddedGlb = (gltfFormat === 1);
    if (embeddedGlb && glbByteOffset % 8 > 0) {
        message = 'Glb must be aligned to an 8-byte boundary.';
        return Promise.resolve(message);
    }

    if (headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + glbByteLength > byteLength) {
        message = 'Feature table, batch table, and glb byte lengths exceed the tile\'s byte length.';
        return Promise.resolve(message);
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
        message = 'Feature table JSON could not be parsed: ' + error.message;
        return Promise.resolve(message);
    }

    try {
        batchTableJson = bufferToJson(batchTableJsonBuffer);
    } catch(error) {
        message = 'Batch table JSON could not be parsed: ' + error.message;
        return Promise.resolve(message);
    }

    var featuresLength = featureTableJson.INSTANCES_LENGTH;
    if (!defined(featuresLength)) {
        message = 'Feature table must contain an INSTANCES_LENGTH property.';
        return Promise.resolve(message);
    }

    if (!defined(featureTableJson.POSITION) && !defined(featureTableJson.POSITION_QUANTIZED)) {
        message = 'Feature table must contain either the POSITION or POSITION_QUANTIZED property.';
        return Promise.resolve(message);
    }

    if (defined(featureTableJson.NORMAL_UP) && !defined(featureTableJson.NORMAL_RIGHT)) {
        message = 'Feature table property NORMAL_RIGHT is required when NORMAL_UP is present.';
        return Promise.resolve(message);
    }

    if (defined(!featureTableJson.NORMAL_UP) && defined(featureTableJson.NORMAL_RIGHT)) {
        message = 'Feature table property NORMAL_UP is required when NORMAL_RIGHT is present.';
        return Promise.resolve(message);
    }

    if (defined(featureTableJson.NORMAL_UP_OCT32P) && !defined(featureTableJson.NORMAL_RIGHT_OCT32P)) {
        message = 'Feature table property NORMAL_RIGHT_OCT32P is required when NORMAL_UP_OCT32P is present.';
        return Promise.resolve(message);
    }

    if (defined(!featureTableJson.NORMAL_UP_OCT32P) && defined(featureTableJson.NORMAL_RIGHT_OCT32P)) {
        message = 'Feature table property NORMAL_UP_OCT32P is required when NORMAL_RIGHT_OCT32P is present.';
        return Promise.resolve(message);
    }

    if (defined(featureTableJson.POSITION_QUANTIZED) && (!defined(featureTableJson.QUANTIZED_VOLUME_OFFSET) || !defined(featureTableJson.QUANTIZED_VOLUME_SCALE))) {
        message = 'Feature table properties QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE are required when POSITION_QUANTIZED is present.';
        return Promise.resolve(message);
    }

    var featureTableMessage = validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
    if (defined(featureTableMessage)) {
        return Promise.resolve(featureTableMessage);
    }

    var batchTableMessage = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
    if (defined(batchTableMessage)) {
        return Promise.resolve(batchTableMessage);
    }

    // solve this problem
    // incorrect promise handeling
    if (embeddedGlb) {
        var glbMessage = validateGlb(glbBuffer);
        if (defined(glbMessage)) {
            return Promise.resolve(glbMessage);
        }
    } else {
        if (!isBufferValidUtf8(glbBuffer)) {
            message = 'Gltf url is not a valid utf-8 string';
            return Promise.resolve(message);
        }
    }
}
