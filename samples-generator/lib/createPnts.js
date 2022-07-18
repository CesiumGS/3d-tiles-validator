'use strict';
const getJsonBufferPadded = require('./getJsonBufferPadded');
const getBufferPadded = require('./getBufferPadded');

module.exports = createPnts;

/**
 * Create a Point Cloud (pnts) tile from a feature table and batch table.
 *
 * @param {Object} options An object with the following properties:
 * @param {Object} options.featureTableJson The feature table JSON.
 * @param {Buffer} options.featureTableBinary The feature table binary.
 * @param {Object} [options.batchTableJson] Batch table describing the per-point metadata.
 * @param {Buffer} [options.batchTableBinary] The batch table binary.
 * @returns {Buffer} The generated pnts tile buffer.
 */
function createPnts(options) {
    const version = 1;
    const headerByteLength = 28;

    const featureTableJson = getJsonBufferPadded(options.featureTableJson, headerByteLength);
    const featureTableBinary = getBufferPadded(options.featureTableBinary);
    const batchTableJson = getJsonBufferPadded(options.batchTableJson);
    const batchTableBinary = getBufferPadded(options.batchTableBinary);

    const featureTableJsonByteLength = featureTableJson.length;
    const featureTableBinaryByteLength = featureTableBinary.length;
    const batchTableJsonByteLength = batchTableJson.length;
    const batchTableBinaryByteLength = batchTableBinary.length;
    const byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength;

    const header = Buffer.alloc(headerByteLength);
    header.write('pnts', 0);
    header.writeUInt32LE(version, 4);
    header.writeUInt32LE(byteLength, 8);
    header.writeUInt32LE(featureTableJsonByteLength, 12);
    header.writeUInt32LE(featureTableBinaryByteLength, 16);
    header.writeUInt32LE(batchTableJsonByteLength, 20);
    header.writeUInt32LE(batchTableBinaryByteLength, 24);

    return Buffer.concat([header, featureTableJson, featureTableBinary, batchTableJson, batchTableBinary]);
}
