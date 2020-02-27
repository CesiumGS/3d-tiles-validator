'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var batchTableExtensionName = 'CESIUM_3dtiles_batch_table';

function sortByByteOffset(a, b) {
    if (a.byteOffset < b.byteOffset ){
        return -1;
    }

    if (a.byteOffset < b.byteOffset) {
        return 1;
    }

    return 0;
}

/**
 * @param {Object} gltf The gltf object to edit
 * @param {Object} humanAttributes  Key value object, where each key corresponds to the name of the
 *                                  attribute, and each value corresponds to a non-binary array
 *                                  of values corresponding to this key. e.g {"Names": ["A", "B"]}
 *                                  These will be stored directly in the `properties`
 *                                  section of the modified GLTF.
 * @param {Object} binaryAttributes Key value object, where each key corresponds to the name of the
 *                                  binary attribute, and the value in object with the following keys:
 *                                  'byteLength', 'byteOffset', 'componentType', 'type', 'name'
 *
 * @param {Buffer} sharedBinaryBuffer Currently the samples generator only supports creating
 *                                    ONE additional Buffer with all the binary attributes inside of it.
 *                                    Each value in `binaryAttributes` must correspond to this buffer. It
 *                                    is an error to call this function using binaryAttributes without also
 *                                    providing this value.
 */

function create3dtilesBatchTableExt(gltf, humanAttributes, binaryAttributes, sharedBinaryBuffer) {
    gltf['extensionsUsed'] = [batchTableExtensionName];

    if (!defined(humanAttributes) && !defined(binaryAttributes)) {
        throw new Error('humanAttributes or binaryAttributes must be defined');
    }

    if (defined(binaryAttributes) && !defined(sharedBinaryBuffer)) {
        throw new Error('sharedBinaryBuffer must be defined if binaryAttributes is defined');
    }

    if (!defined(gltf['extensionsUsed'])) {
        gltf['extensionsUsed'] = [];
    }

    if (!defined(gltf['extensions'])) {
        gltf['extensions'] = {};
    }

    gltf['extensions'][batchTableExtensionName] = { batchTables: [] };

    var humanAttributeNames = Object.keys(humanAttributes);
    var i=0;

    var newBufferIndex = gltf.buffers.length;
    var batchTableIndex = 0; // TODO: This will change when we add multiple batch table support

    if (defined(humanAttributes)) {
        var batchLength = humanAttributeNames.length > 0 ? humanAttributes[humanAttributeNames[0]].length : 0;
        var newBatchTable = {batchLength: batchLength, properties: {}};

        for (i = 0; i < humanAttributeNames.length; ++i) {
            var values = humanAttributes[humanAttributeNames[i]];
            newBatchTable.properties[humanAttributeNames[i]] = {
                values: values
            };
        }

        gltf.extensions[batchTableExtensionName].batchTables.push(newBatchTable);
    }

    if (defined(binaryAttributes)) {
        var sortedBinaryAttributes = [];
        for (var key in binaryAttributes) {
            if (binaryAttributes.hasOwnProperty(key)) {
                sortedBinaryAttributes.push(binaryAttributes[key]);
            }
        }
        sortedBinaryAttributes.sort(sortByByteOffset);
        gltf.buffers.push({
            byteLength: sharedBinaryBuffer.length,
            uri: 'data:application/octet-stream;base64,' + sharedBinaryBuffer.toString('base64')
        });

        var accessorBufferViewIndex = gltf.bufferViews.length;
        for (i = 0; i < sortedBinaryAttributes.length; ++i, ++accessorBufferViewIndex) {
            var batchAttribute = sortedBinaryAttributes[i];

            gltf.bufferViews.push({
                buffer : newBufferIndex,
                byteLength : batchAttribute.byteLength,
                byteOffset : batchAttribute.byteOffset,
                // TODO: target ?
            });

            gltf.accessors.push({
                bufferView : accessorBufferViewIndex,
                byteOffset : 0,
                componentType : batchAttribute.componentType,
                type : batchAttribute.type,
                count : batchAttribute.count,
            });

            var batchTable = gltf.extensions.CESIUM_3dtiles_batch_table.batchTables[batchTableIndex].properties;
            batchTable[batchAttribute.name] = {accessor: accessorBufferViewIndex};
        }
    }

    return gltf;
}

module.exports = create3dtilesBatchTableExt;