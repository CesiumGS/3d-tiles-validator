'use strict';
const Cesium = require('cesium');

const bufferToJson = require('./bufferToJson');
const isDataUri = require('./isDataUri');
const utility = require('./utility');
const validateBatchTable = require('./validateBatchTable');
const validateFeatureTable = require('./validateFeatureTable');
const validateGlb = require('./validateGlb');

const defined = Cesium.defined;

const isBufferValidUtf8 = utility.isBufferValidUtf8;

module.exports = validateI3dm;

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
    NORMAL_UP: {
        global: false,
        type: 'VEC3',
        componentType: 'FLOAT'
    },
    NORMAL_RIGHT: {
        global: false,
        type: 'VEC3',
        componentType: 'FLOAT'
    },
    NORMAL_UP_OCT32P: {
        global: false,
        type: 'VEC2',
        componentType: 'UNSIGNED_SHORT'
    },
    NORMAL_RIGHT_OCT32P: {
        global: false,
        type: 'VEC2',
        componentType: 'UNSIGNED_SHORT'
    },
    SCALE: {
        global: false,
        type: 'SCALAR',
        componentType: 'FLOAT'
    },
    SCALE_NON_UNIFORM: {
        global: false,
        type: 'VEC3',
        componentType: 'FLOAT'
    },
    BATCH_ID: {
        global: false,
        type: 'SCALAR',
        componentType: 'UNSIGNED_SHORT',
        componentTypeOptions: ['UNSIGNED_BYTE', 'UNSIGNED_SHORT', 'UNSIGNED_INT']
    },
    INSTANCES_LENGTH: {
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
    EAST_NORTH_UP: {
        global: true,
        type: 'boolean'
    }
};

/**
 * Checks if the provided buffer has valid i3dm tile content.
 *
 * @param {Object} options An object with the following properties:
 * @param {Buffer} options.content A buffer containing the contents of an i3dm tile.
 * @param {String} options.filePath The tile's file path.
 * @param {String} options.directory The tile's directory.
 * @param {Boolean} [options.writeReports=false] Write glTF error report next to the glTF file in question.
 * @returns {Promise} A promise that resolves when the validation completes. If the validation fails, the promise will resolve to an error message.
 */
async function validateI3dm(options) {
    const content = options.content;
    const headerByteLength = 32;
    if (content.length < headerByteLength) {
        return 'Header must be 32 bytes.';
    }

    const magic = content.toString('utf8', 0, 4);
    const version = content.readUInt32LE(4);
    const byteLength = content.readUInt32LE(8);
    const featureTableJsonByteLength = content.readUInt32LE(12);
    const featureTableBinaryByteLength = content.readUInt32LE(16);
    const batchTableJsonByteLength = content.readUInt32LE(20);
    const batchTableBinaryByteLength = content.readUInt32LE(24);
    const gltfFormat = content.readUInt32LE(28);

    if (magic !== 'i3dm') {
        return `Invalid magic: ${magic}`;
    }

    if (version !== 1) {
        return `Invalid version: ${version}. Version must be 1.`;
    }

    if (byteLength !== content.length) {
        return `byteLength of ${byteLength} does not equal the tile\'s actual byte length of ${content.length}.`;
    }

    if (gltfFormat > 1) {
        return `invalid gltfFormat "${gltfFormat}". Must be 0 or 1.`;
    }

    const featureTableJsonByteOffset = headerByteLength;
    const featureTableBinaryByteOffset = featureTableJsonByteOffset + featureTableJsonByteLength;
    const batchTableJsonByteOffset = featureTableBinaryByteOffset + featureTableBinaryByteLength;
    const batchTableBinaryByteOffset = batchTableJsonByteOffset + batchTableJsonByteLength;
    const glbByteOffset = batchTableBinaryByteOffset + batchTableBinaryByteLength;
    const glbByteLength = Math.max(byteLength - glbByteOffset, 0);

    if (featureTableBinaryByteOffset % 8 > 0) {
        return 'Feature table binary must be aligned to an 8-byte boundary.';
    }

    if (batchTableBinaryByteOffset % 8 > 0) {
        return 'Batch table binary must be aligned to an 8-byte boundary.';
    }

    const embeddedGlb = (gltfFormat === 1);
    if (embeddedGlb && glbByteOffset % 8 > 0) {
        return 'Glb must be aligned to an 8-byte boundary.';
    }

    if (headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + glbByteLength > byteLength) {
        return 'Feature table, batch table, and glb byte lengths exceed the tile\'s byte length.';
    }

    const featureTableJsonBuffer = content.slice(featureTableJsonByteOffset, featureTableBinaryByteOffset);
    const featureTableBinary = content.slice(featureTableBinaryByteOffset, batchTableJsonByteOffset);
    const batchTableJsonBuffer = content.slice(batchTableJsonByteOffset, batchTableBinaryByteOffset);
    const batchTableBinary = content.slice(batchTableBinaryByteOffset, glbByteOffset);
    const glb = content.slice(glbByteOffset, byteLength);

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

    const featuresLength = featureTableJson.INSTANCES_LENGTH;
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

    const featureTableMessage = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
    if (defined(featureTableMessage)) {
        return featureTableMessage;
    }

    const batchTableMessage = validateBatchTable(batchTableJson, batchTableBinary, featuresLength);
    if (defined(batchTableMessage)) {
        return batchTableMessage;
    }

    if (embeddedGlb) {
        const filePath = isDataUri(options.filePath) ? options.filePath : `${options.filePath}.glb`;
        const glbMessage = await validateGlb({
            glb: glb,
            filePath: filePath,
            directory: options.directory,
            writeReports: options.writeReports
        });
        if (defined(glbMessage)) {
            return glbMessage;
        }
    } else if (!isBufferValidUtf8(glb)) {
        return 'glTF uri is not a valid utf-8 string';
    }
}
