'use strict';
const Cesium = require('cesium');
const getBufferPadded = require('./getBufferPadded');
const getJsonBufferPadded = require('./getJsonBufferPadded');

const defaultValue = Cesium.defaultValue;

module.exports = createB3dm;

/**
 * Create a Batched 3D Model (b3dm) tile from a binary glTF and per-feature metadata.
 *
 * @param {Object} options An object with the following properties:
 * @param {Buffer} options.glb The binary glTF buffer.
 * @param {Object} [options.featureTableJson] Feature table JSON.
 * @param {Buffer} [options.featureTableBinary] Feature table binary.
 * @param {Object} [options.batchTableJson] Batch table describing the per-feature metadata.
 * @param {Buffer} [options.batchTableBinary] The batch table binary.
 * @param {Boolean} [options.deprecated1=false] Save the b3dm with the deprecated 20-byte header.
 * @param {Boolean} [options.deprecated2=false] Save the b3dm with the deprecated 24-byte header.
 * @returns {Buffer} The generated b3dm tile buffer.
 */
function createB3dm(options) {
    const glb = options.glb;
    const defaultFeatureTable = {
        BATCH_LENGTH : 0
    };
    const featureTableJson = defaultValue(options.featureTableJson, defaultFeatureTable);
    const batchLength = featureTableJson.BATCH_LENGTH;

    const headerByteLength = 28;
    const featureTableJsonBuffer = getJsonBufferPadded(featureTableJson, headerByteLength);
    const featureTableBinary = getBufferPadded(options.featureTableBinary);
    const batchTableJsonBuffer = getJsonBufferPadded(options.batchTableJson);
    const batchTableBinary = getBufferPadded(options.batchTableBinary);

    const deprecated1 = defaultValue(options.deprecated1, false);
    const deprecated2 = defaultValue(options.deprecated2, false);

    if (deprecated1) {
        return createB3dmDeprecated1(glb, batchLength, batchTableJsonBuffer);
    } else if (deprecated2) {
        return createB3dmDeprecated2(glb, batchLength, batchTableJsonBuffer, batchTableBinary);
    }

    return createB3dmCurrent(glb, featureTableJsonBuffer, featureTableBinary, batchTableJsonBuffer, batchTableBinary);
}

function createB3dmCurrent(glb, featureTableJson, featureTableBinary, batchTableJson, batchTableBinary) {
    const version = 1;
    const headerByteLength = 28;
    const featureTableJsonByteLength = featureTableJson.length;
    const featureTableBinaryByteLength = featureTableBinary.length;
    const batchTableJsonByteLength = batchTableJson.length;
    const batchTableBinaryByteLength = batchTableBinary.length;
    const gltfByteLength = glb.length;
    const byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + gltfByteLength;

    const header = Buffer.alloc(headerByteLength);
    header.write('b3dm', 0);
    header.writeUInt32LE(version, 4);
    header.writeUInt32LE(byteLength, 8);
    header.writeUInt32LE(featureTableJsonByteLength, 12);
    header.writeUInt32LE(featureTableBinaryByteLength, 16);
    header.writeUInt32LE(batchTableJsonByteLength, 20);
    header.writeUInt32LE(batchTableBinaryByteLength, 24);

    return Buffer.concat([header, featureTableJson, featureTableBinary, batchTableJson, batchTableBinary, glb]);
}

function createB3dmDeprecated1(glb, batchLength, batchTableJson) {
    const version = 1;
    const headerByteLength = 20;
    const batchTableJsonByteLength = batchTableJson.length;
    const gltfByteLength = glb.length;
    const byteLength = headerByteLength + batchTableJsonByteLength + gltfByteLength;

    const header = Buffer.alloc(headerByteLength);
    header.write('b3dm', 0);
    header.writeUInt32LE(version, 4);
    header.writeUInt32LE(byteLength, 8);
    header.writeUInt32LE(batchLength, 12);
    header.writeUInt32LE(batchTableJsonByteLength, 16);

    return Buffer.concat([header, batchTableJson, glb]);
}

function createB3dmDeprecated2(glb, batchLength, batchTableJson, batchTableBinary) {
    const version = 1;
    const headerByteLength = 24;
    const batchTableJsonByteLength = batchTableJson.length;
    const batchTableBinaryByteLength = batchTableBinary.length;
    const gltfByteLength = glb.length;
    const byteLength = headerByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + gltfByteLength;

    const header = Buffer.alloc(headerByteLength);
    header.write('b3dm', 0);
    header.writeUInt32LE(version, 4);
    header.writeUInt32LE(byteLength, 8);
    header.writeUInt32LE(batchTableJsonByteLength, 12);
    header.writeUInt32LE(batchTableBinaryByteLength, 16);
    header.writeUInt32LE(batchLength, 20);

    return Buffer.concat([header, batchTableJson, batchTableBinary, glb]);
}
