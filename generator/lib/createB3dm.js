'use strict';
var Cesium = require('cesium');
var getBufferPadded = require('./getBufferPadded');
var getJsonBufferPadded = require('./getJsonBufferPadded');

var defaultValue = Cesium.defaultValue;

module.exports = createB3dm;

/**
 * Create a Batched 3D Model (b3dm) tile from a binary glTF and per-feature metadata.
 *
 * @param {Object} options An object with the following properties:
 * @param {Buffer} options.glb The binary glTF buffer.
 * @param {Number} [options.batchLength] The number of features in the tile.
 * @param {Object} [options.batchTableJson] Batch table describing the per-feature metadata.
 * @param {Buffer} [options.batchTableBinary] The batch table binary.
 * @returns {Buffer} The generated b3dm tile buffer.
 */
function createB3dm(options) {
    var glb = options.glb;
    var batchLength = defaultValue(options.batchLength, 0);
    var batchTableJson = getJsonBufferPadded(options.batchTableJson);
    var batchTableBinary = getBufferPadded(options.batchTableBinary);

    var version = 1;
    var headerByteLength = 24;
    var batchTableJsonByteLength = batchTableJson.length;
    var batchTableBinaryByteLength = batchTableBinary.length;
    var gltfByteLength = glb.length;
    var byteLength = headerByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + gltfByteLength;

    var header = Buffer.alloc(headerByteLength);
    header.write('b3dm', 0);
    header.writeUInt32LE(version, 4);
    header.writeUInt32LE(byteLength, 8);
    header.writeUInt32LE(batchTableJsonByteLength, 12);
    header.writeUInt32LE(batchTableBinaryByteLength, 16);
    header.writeUInt32LE(batchLength, 20);

    return Buffer.concat([header, batchTableJson, batchTableBinary, glb]);
}
