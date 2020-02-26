'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var getBufferPadded = require('./getBufferPadded');
var getJsonBufferPadded = require('./getJsonBufferPadded');

var cesium3dTilesBatch = 'CESIUM_3dtiles_batch_table';
var defaultValue = Cesium.defaultValue;

module.exports = {createB3dm: createB3dm , createB3dmGltf: createB3dmGltf };

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
    var glb = options.glbOrGltf;
    var defaultFeatureTable = {
        BATCH_LENGTH : 0
    };
    var featureTableJson = defaultValue(options.featureTableJson, defaultFeatureTable);
    var batchLength = featureTableJson.BATCH_LENGTH;

    var headerByteLength = 28;
    var featureTableJsonBuffer = getJsonBufferPadded(featureTableJson, headerByteLength);
    var featureTableBinary = getBufferPadded(options.featureTableBinary);
    var batchTableJsonBuffer = getJsonBufferPadded(options.batchTableJson);
    var batchTableBinary = getBufferPadded(options.batchTableBinary);

    var deprecated1 = defaultValue(options.deprecated1, false);
    var deprecated2 = defaultValue(options.deprecated2, false);

    if (deprecated1) {
        return createB3dmDeprecated1(glb, batchLength, batchTableJsonBuffer);
    } else if (deprecated2) {
        return createB3dmDeprecated2(glb, batchLength, batchTableJsonBuffer, batchTableBinary);
    }

    return createB3dmCurrent(glb, featureTableJsonBuffer, featureTableBinary, batchTableJsonBuffer, batchTableBinary);
}

function sortByByteOffset(a, b) {
    if (a.byteOffset < b.byteOffset ){
        return -1;
    }

    if (a.byteOffset < b.byteOffset) {
        return 1;
    }

    return 0;
}

function createB3dmGltf(gltf, b3dmOptions, batchTableJsonAndBinary) {
    gltf['extensionsUsed'] = [cesium3dTilesBatch];

    if (!defined(gltf['extensionsUsed'])) {
        gltf['extensionsUsed'] = [];
    }

    if (!defined(gltf['extensions'])) {
        gltf['extensions'] = {};
    }


    // update extensions
    gltf['extensions'][cesium3dTilesBatch] = {
        batchTables: []
    };

    var batchAttributes = Object.keys(b3dmOptions['batchTableJson']);
    var i=0;

    // TODO: Ugly, but `cartographic` and `code` can show up in both
    //       objects. Causing us to erroneously add those batch table attributes
    //       as human readable values in the properties section, and create accessors
    //       / bufferviews / a buffer for them.
    //       Ideally we fix the input data, this is a temporary workaround.
    for (i = batchAttributes.length - 1; i >= 0; --i) {
        if (batchAttributes[i] in batchTableJsonAndBinary.json) {
            batchAttributes.splice(i, 1);
        }
    }

    var newBufferIndex = gltf.buffers.length;

    if (defined(b3dmOptions.batchTableBinary)) {
        var binaryBatchAttributes = [];
        for (var key in batchTableJsonAndBinary.json) {
            if (batchTableJsonAndBinary.json.hasOwnProperty(key)) {
                binaryBatchAttributes.push(batchTableJsonAndBinary.json[key]);
            }
        }

        gltf.buffers.push({
            byteLength: batchTableJsonAndBinary.binary.length,
            uri: 'data:application/octet-stream;base64,' + batchTableJsonAndBinary.binary.toString('base64')
        });

        binaryBatchAttributes.sort(sortByByteOffset);

        //var alreadyHasAccessorForBinary = new Set();
        var bufferViewIndex = gltf.bufferViews.length;
        for (i = 0; i < binaryBatchAttributes.length; ++i, ++bufferViewIndex) {
            var batchAttribute = binaryBatchAttributes[i];
            //alreadyHasAccessorForBinary.add(batchAttribute.name);

            gltf.bufferViews.push({
                buffer : newBufferIndex,
                byteLength : batchAttribute.byteLength,
                byteOffset : batchAttribute.byteOffset,
                // TODO: target ?
            });

            gltf.accessors.push({
                bufferView : bufferViewIndex,
                byteOffset : 0,
                componentType : batchAttribute.componentType,
                type : batchAttribute.type,
                count : batchAttribute.count,
            });
        }
    }

    if (defined(b3dmOptions.batchTableJson)) {
        var batchLength = batchAttributes.length > 0  ? b3dmOptions.batchTableJson[batchAttributes[0]].length : 0;
        var newBatchTable = {batchLength: batchLength, properties: {}};

        for (i = 0; i < batchAttributes.length; ++i) {
            var values = b3dmOptions.batchTableJson[batchAttributes[i]];
            // TODO: Should we hardcode a if batchAttributes[i] === 'id' here?
            //       It could fail if we have an batch attribute named id that doesn't use
            //       an implicit indexing structure (i.e 2, 4, 8, 1, 9, 30...);
            newBatchTable.properties[batchAttributes[i]] = {
                values: values
            };
        }

        gltf.extensions[cesium3dTilesBatch].batchTables.push(newBatchTable);
        return gltf;
    }
}

function createB3dmCurrent(glb, featureTableJson, featureTableBinary, batchTableJson, batchTableBinary) {
    var version = 1;
    var headerByteLength = 28;
    var featureTableJsonByteLength = featureTableJson.length;
    var featureTableBinaryByteLength = featureTableBinary.length;
    var batchTableJsonByteLength = batchTableJson.length;
    var batchTableBinaryByteLength = batchTableBinary.length;
    var gltfByteLength = glb.length;
    var byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + gltfByteLength;

    var header = Buffer.alloc(headerByteLength);
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
    var version = 1;
    var headerByteLength = 20;
    var batchTableJsonByteLength = batchTableJson.length;
    var gltfByteLength = glb.length;
    var byteLength = headerByteLength + batchTableJsonByteLength + gltfByteLength;

    var header = Buffer.alloc(headerByteLength);
    header.write('b3dm', 0);
    header.writeUInt32LE(version, 4);
    header.writeUInt32LE(byteLength, 8);
    header.writeUInt32LE(batchLength, 12);
    header.writeUInt32LE(batchTableJsonByteLength, 16);

    return Buffer.concat([header, batchTableJson, glb]);
}

function createB3dmDeprecated2(glb, batchLength, batchTableJson, batchTableBinary) {
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
