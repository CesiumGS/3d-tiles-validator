'use strict';
const Cesium = require('cesium');

const bufferToJson = require('./bufferToJson');
const validateBatchTable = require('./validateBatchTable');
const validateFeatureTable = require('./validateFeatureTable');

const Cesium3DTileFeatureTable = Cesium.Cesium3DTileFeatureTable;
const ComponentDatatype = Cesium.ComponentDatatype;
const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

module.exports = validatePnts;

const featureTableSemantics = {
    POSITION: {
        global: false,
        type: 'VEC3',
        componentType: 'FLOAT'
    },
    POSITION_QUANTIZED: {
        global: false,
        type: 'VEC3',
        componentType: 'UNSIGNED_SHORT'
    },
    RGBA: {
        global: false,
        type: 'VEC4',
        componentType: 'UNSIGNED_BYTE'
    },
    RGB: {
        global: false,
        type: 'VEC3',
        componentType: 'UNSIGNED_BYTE'
    },
    RGB565: {
        global: false,
        type: 'SCALAR',
        componentType: 'UNSIGNED_SHORT'
    },
    NORMAL: {
        global: false,
        type: 'VEC3',
        componentType: 'FLOAT'
    },
    NORMAL_OCT16P: {
        global: false,
        type: 'VEC2',
        componentType: 'UNSIGNED_BYTE'
    },
    BATCH_ID: {
        global: false,
        type: 'SCALAR',
        componentType: 'UNSIGNED_SHORT',
        componentTypeOptions: ['UNSIGNED_BYTE', 'UNSIGNED_SHORT', 'UNSIGNED_INT']
    },
    POINTS_LENGTH: {
        global: true,
        type: 'SCALAR',
        componentType: 'UNSIGNED_INT'
    },
    RTC_CENTER: {
        global: true,
        type: 'VEC3',
        componentType: 'FLOAT'
    },
    QUANTIZED_VOLUME_OFFSET: {
        global: true,
        type: 'VEC3',
        componentType: 'FLOAT'
    },
    QUANTIZED_VOLUME_SCALE: {
        global: true,
        type: 'VEC3',
        componentType: 'FLOAT'
    },
    CONSTANT_RGBA: {
        global: true,
        type: 'VEC4',
        componentType: 'UNSIGNED_BYTE'
    },
    BATCH_LENGTH: {
        global: true,
        type: 'SCALAR',
        componentType: 'UNSIGNED_INT'
    }
};

/**
 * Checks if provided buffer has valid pnts tile content
 *
 * @param {Object} options An object with the following properties:
 * @param {Buffer} options.content A buffer containing the contents of a pnts tile.
 * @returns {Promise} A promise that resolves when the validation completes. If the validation fails, the promise will resolve to an error message.
 */
async function validatePnts(options) {
    const content = options.content;

    const headerByteLength = 28;
    if (content.length < headerByteLength) {
        return 'Header must be 28 bytes.';
    }

    const magic = content.toString('utf8', 0, 4);
    const version = content.readUInt32LE(4);
    const byteLength = content.readUInt32LE(8);
    const featureTableJsonByteLength = content.readUInt32LE(12);
    const featureTableBinaryByteLength = content.readUInt32LE(16);
    const batchTableJsonByteLength = content.readUInt32LE(20);
    const batchTableBinaryByteLength = content.readUInt32LE(24);

    if (magic !== 'pnts') {
        return `Invalid magic: ${magic}`;
    }

    if (version !== 1) {
        return `Invalid version: ${version}. Version must be 1.`;
    }

    if (byteLength !== content.length) {
        return `byteLength of ${byteLength} does not equal the tile\'s actual byte length of ${content.length}.`;
    }

    const featureTableJsonByteOffset = headerByteLength;
    const featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
    const batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
    const batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;

    if (featureTableBinaryByteOffset % 8 > 0) {
        return 'Feature table binary must be aligned to an 8-byte boundary.';
    }

    if (batchTableBinaryByteOffset % 8 > 0) {
        return 'Batch table binary must be aligned to an 8-byte boundary.';
    }

    if (headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength > byteLength) {
        return 'Feature table and batch table exceed the tile\'s byte length.';
    }

    const featureTableJsonBuffer = content.slice(featureTableJsonByteOffset, featureTableBinaryByteOffset);
    const featureTableBinary = content.slice(featureTableBinaryByteOffset, batchTableJsonByteOffset);
    const batchTableJsonBuffer = content.slice(batchTableJsonByteOffset, batchTableBinaryByteOffset);
    const batchTableBinary = content.slice(batchTableBinaryByteOffset, byteLength);

    let featureTableJson;
    let batchTableJson;

    try {
        featureTableJson = bufferToJson(featureTableJsonBuffer);
    } catch (error) {
        return `Feature table JSON could not be parsed: ${error.message}`;
    }

    try {
        batchTableJson = bufferToJson(batchTableJsonBuffer);
    } catch (error) {
        return `Batch table JSON could not be parsed: ${error.message}`;
    }

    const batchLength = defaultValue(featureTableJson.BATCH_LENGTH, 0);
    const pointsLength = featureTableJson.POINTS_LENGTH;
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

    if (defined(featureTableJson.BATCH_ID)) {
        const featureTable = new Cesium3DTileFeatureTable(featureTableJson, featureTableBinary);
        featureTable.featuresLength = pointsLength;
        const componentDatatype = ComponentDatatype.fromName(defaultValue(featureTableJson.BATCH_ID.componentType, 'UNSIGNED_SHORT'));
        const batchIds = featureTable.getPropertyArray('BATCH_ID', componentDatatype, 1);
        const length = batchIds.length;
        for (let i = 0; i < length; i++) {
            if (batchIds[i] >= featureTableJson.BATCH_LENGTH) {
                return 'All the BATCH_IDs must have values less than feature table property BATCH_LENGTH.';
            }
        }
    }

    const featureTableMessage = validateFeatureTable(featureTableJson, featureTableBinary, pointsLength, featureTableSemantics);
    if (defined(featureTableMessage)) {
        return featureTableMessage;
    }

    const batchTableMessage = validateBatchTable(batchTableJson, batchTableBinary, batchLength);
    if (defined(batchTableMessage)) {
        return batchTableMessage;
    }
}
