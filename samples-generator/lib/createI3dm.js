'use strict';
var Cesium = require('cesium');
var getJsonBufferPadded = require('./getJsonBufferPadded');
var getBufferPadded = require('./getBufferPadded');

var defined = Cesium.defined;

module.exports = createI3dm;

/**
 * Create an Instanced 3D Model (i3dm) tile from a feature table, batch table, and gltf buffer or uri.
 *
 * @param {Object} options An object with the following properties:
 * @param {Object} options.featureTableJson The feature table JSON.
 * @param {Buffer} options.featureTableBinary The feature table binary.
 * @param {Object} [options.batchTableJson] Batch table describing the per-feature metadata.
 * @param {Buffer} [options.batchTableBinary] The batch table binary.
 * @param {Buffer} [options.glb] The binary glTF buffer.
 * @param {String} [options.uri] Uri to an external glTF model when options.glb is not specified.
 * @returns {Buffer} The generated i3dm tile buffer.
 */
function createI3dm(options) {
    var featureTableJson = getJsonBufferPadded(options.featureTableJson);
    var featureTableBinary = getBufferPadded(options.featureTableBinary);
    var batchTableJson = getJsonBufferPadded(options.batchTableJson);
    var batchTableBinary = getBufferPadded(options.batchTableBinary);

    var gltfFormat = defined(options.glb) ? 1 : 0;
    var gltfBuffer = defined(options.glb) ? options.glb : getGltfUriBuffer(options.uri);

    var version = 1;
    var headerByteLength = 32;
    var featureTableJsonByteLength = featureTableJson.length;
    var featureTableBinaryByteLength = featureTableBinary.length;
    var batchTableJsonByteLength = batchTableJson.length;
    var batchTableBinaryByteLength = batchTableBinary.length;
    var gltfByteLength = gltfBuffer.length;
    var byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + gltfByteLength;

    var header = Buffer.alloc(headerByteLength);
    header.write('i3dm', 0);
    header.writeUInt32LE(version, 4);
    header.writeUInt32LE(byteLength, 8);
    header.writeUInt32LE(featureTableJsonByteLength, 12);
    header.writeUInt32LE(featureTableBinaryByteLength, 16);
    header.writeUInt32LE(batchTableJsonByteLength, 20);
    header.writeUInt32LE(batchTableBinaryByteLength, 24);
    header.writeUInt32LE(gltfFormat, 28);

    return Buffer.concat([header, featureTableJson, featureTableBinary, batchTableJson, batchTableBinary, gltfBuffer]);
}

function getGltfUriBuffer(uri) {
    uri = uri.replace(/\\/g, '/');
    return Buffer.from(uri);
}
