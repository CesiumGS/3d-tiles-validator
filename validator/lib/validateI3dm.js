'use strict';
var Cesium = require('cesium');
var bufferToJson = require('../lib/bufferToJson');
var utility = require('../lib/utility');
var validateBatchTable = require('../lib/validateBatchTable');
var validateFeatureTable = require('../lib/validateFeatureTable');
var validateGlb = require('../lib/validateGlb');

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
function validateI3dm(content, filePath) {
    var headerByteLength = 32;
    if (content.length < headerByteLength) {
        return 'Header must be 32 bytes.';
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
        return 'Invalid magic: ' + magic;
    }

    if (version !== 1) {
        return 'Invalid version: ' + version + '. Version must be 1.';
    }

    if (byteLength !== content.length) {
        return 'byteLength of ' + byteLength + ' does not equal the tile\'s actual byte length of ' + content.length + '.';
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
        return 'Feature table binary must be aligned to an 8-byte boundary.';
    }

    if (batchTableBinaryByteOffset % 8 > 0) {
        return 'Batch table binary must be aligned to an 8-byte boundary.';
    }

    var embeddedGlb = (gltfFormat === 1);
    if (embeddedGlb && glbByteOffset % 8 > 0) {
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

    var featuresLength = featureTableJson.INSTANCES_LENGTH;
    if (!defined(featuresLength)) {
        return 'Feature table must contain an INSTANCES_LENGTH property.';
    }

    if (!defined(featureTableJson.POSITION) && !defined(featureTableJson.POSITION_QUANTIZED)) {
        return 'Feature table must contain either the POSITION or POSITION_QUANTIZED property.';
    }

    if (defined(featureTableJson.NORMAL_UP) && !defined(featureTableJson.NORMAL_RIGHT)) {
        return 'Feature table property NORMAL_RIGHT is required when NORMAL_UP is present.';
    }

    if (!defined(featureTableJson.NORMAL_UP) && defined(featureTableJson.NORMAL_RIGHT)) {
        return 'Feature table property NORMAL_UP is required when NORMAL_RIGHT is present.';
    }

    if (defined(featureTableJson.NORMAL_UP_OCT32P) && !defined(featureTableJson.NORMAL_RIGHT_OCT32P)) {
        return 'Feature table property NORMAL_RIGHT_OCT32P is required when NORMAL_UP_OCT32P is present.';
    }

    if (!defined(featureTableJson.NORMAL_UP_OCT32P) && defined(featureTableJson.NORMAL_RIGHT_OCT32P)) {
        return 'Feature table property NORMAL_UP_OCT32P is required when NORMAL_RIGHT_OCT32P is present.';
    }

    if (defined(featureTableJson.POSITION_QUANTIZED) && (!defined(featureTableJson.QUANTIZED_VOLUME_OFFSET) || !defined(featureTableJson.QUANTIZED_VOLUME_SCALE))) {
        return 'Feature table properties QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE are required when POSITION_QUANTIZED is present.';
    }

    var featureTableMessage = validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
    if (defined(featureTableMessage)) {
        return featureTableMessage;
    }

    var batchTableMessage = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
    if (defined(batchTableMessage)) {
        return batchTableMessage;
    }

    if (embeddedGlb) {
        var glbMessage = validateGlb(glbBuffer);
        if (defined(glbMessage)) {
            return glbMessage;
        }
    } else {
        if (!isBufferValidUtf8(glbBuffer)) {
            return 'Gltf url is not a valid utf-8 string';
        }
    }
}
