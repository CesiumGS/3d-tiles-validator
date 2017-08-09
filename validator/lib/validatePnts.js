'use strict';
var Cesium = require('cesium');
var bufferToJson = require('../lib/bufferToJson');
var validateBatchTable = require('../lib/validateBatchTable');
var validateFeatureTable = require('../lib/validateFeatureTable');

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

    if (magic !== 'pnts') {
        return 'Invalid magic: ' + magic;
    }

    if (version !== 1) {
        return 'Invalid version: ' + version + '. Version must be 1.';
    }

    if (byteLength !== content.length) {
        return 'byteLength of ' + byteLength + ' does not equal the tile\'s actual byte length of ' + content.length + '.';
    }

    var featureTableJsonByteOffset = headerByteLength;
    var featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
    var batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
    var batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;

    if (featureTableBinaryByteOffset % 8 > 0) {
        return 'Feature table binary must be aligned to an 8-byte boundary.';
    }

    if (batchTableBinaryByteOffset % 8 > 0) {
        return 'Batch table binary must be aligned to an 8-byte boundary.';
    }

    if (headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength > byteLength) {
        return 'Feature table and batch table exceed the tile\'s byte length.';
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
        return 'Feature table JSON could not be parsed: ' + error.message;
    }

    try {
        batchTableJson = bufferToJson(batchTableJsonBuffer);
    } catch(error) {
        return 'Batch table JSON could not be parsed: ' + error.message;
    }

    var batchLength = defaultValue(featureTableJson.BATCH_LENGTH, 0);
    var pointsLength = featureTableJson.POINTS_LENGTH;
    if (!defined(pointsLength)) {
        return 'Feature table must contain a POINTS_LENGTH property.';
    }

    if (!defined(featureTableJson.POSITION) && !defined(featureTableJson.POSITION_QUANTIZED)) {
        return 'Feature table must contain either the POSITION or POSITION_QUANTIZED property.';
    }

    if (defined(featureTableJson.POSITION_QUANTIZED) && (!defined(featureTableJson.QUANTIZED_VOLUME_OFFSET) || !defined(featureTableJson.QUANTIZED_VOLUME_SCALE))) {
        return 'Feature table properties QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE are required when POSITION_QUANTIZED is present.';
    }

    if (defined(featureTableJson.BATCH_ID) && !defined(featureTableJson.BATCH_LENGTH)) {
        return 'Feature table property BATCH_LENGTH is required when BATCH_ID is present.';
    }

    if (!defined(featureTableJson.BATCH_ID) && defined(featureTableJson.BATCH_LENGTH)) {
        return 'Feature table property BATCH_ID is required when BATCH_LENGTH is present.';
    }

    if (batchLength > pointsLength) {
        return 'Feature table property BATCH_LENGTH must be less than or equal to POINTS_LENGTH.';
    }

    var featureTable = new Cesium3DTileFeatureTable(featureTableJson, featureTableBinary);
    featureTable.featuresLength = pointsLength;
    var i;
    var componentDatatype;

    if (defined(featureTableJson.BATCH_ID)) {
        componentDatatype = ComponentDatatype.fromName(defaultValue(featureTableJson.BATCH_ID.componentType, 'UNSIGNED_SHORT'));
        var batchIds = featureTable.getPropertyArray('BATCH_ID', componentDatatype, 1);
        var length = batchIds.length;
        for (i = 0; i < length; i++) {
            if (batchIds[i] >= featureTableJson.BATCH_LENGTH) {
                return 'All the BATCH_IDs must have values less than feature table property BATCH_LENGTH.';
            }
        }
    }

    if (defined(featureTableJson.RGBA)) {
        featureTable.featuresLength = pointsLength * 4;
        componentDatatype = ComponentDatatype.fromName(defaultValue(featureTableJson.RGBA.componentType, 'UNSIGNED_SHORT', 4)); // UNSIGNED_BYTE
        var rgba = featureTable.getPropertyArray('RGBA', componentDatatype, 1);
        var max = Math.max(...rgba);
        var min = Math.min(...rgba);
        if (min < 0 || max > 255) {
            return 'values of RGBA must be in the range 0-255 inclusive';
        }
    } else if (defined(featureTableJson.RGB)) {
        featureTable.featuresLength = pointsLength * 3;
        componentDatatype = ComponentDatatype.fromName(defaultValue(featureTableJson.RGB.componentType, 'UNSIGNED_SHORT', 3)); // UNSIGNED_BYTE
        var rgb = featureTable.getPropertyArray('RGB', componentDatatype, 1);
        var max = Math.max(...rgb);
        var min = Math.min(...rgb);
        if (min < 0 || max > 255) {
            return 'values of RGB must be in the range 0-255 inclusive';
        }
    } else if (defined(featureTableJson.RGB565)) {
        featureTable.featuresLength = pointsLength;
        componentDatatype = ComponentDatatype.fromName(defaultValue(featureTableJson.RGB565.componentType, 'UNSIGNED_INT', 1)); // UNSIGNED_BYTE
        var rgb565 = featureTable.getPropertyArray('RGB565', componentDatatype, 1);
        //console.log(rgb565);
        var max = Math.max(...rgb565);
        var min = Math.min(...rgb565);
        if (min < 0 || max > 65535) {
            return 'value of RGB565 must be in the range 0-65535 inclusive';
        }
    } else if (defined(featureTableJson.CONSTANT_RGBA)) {
        var rgba = featureTableJson.CONSTANT_RGBA;
        var max = Math.max(...rgba);
        var min = Math.min(...rgba);
        if (min < 0 || max > 255) {
            return 'values of CONSTANT_RGBA must be in the range 0-255 inclusive';
        }
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
