'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var Extensions = require ('./Extensions');
var batchTableExtensionName = 'CESIUM_3dtiles_batch_table';

function sortByByteOffset(a, b) {
    if (a.byteOffset < b.byteOffset ){
        return -1;
    }

    if (a.byteOffset > b.byteOffset) {
        return 1;
    }

    return 0;
}

function assertHumanReadableBatchTableValueArraysHaveIdenticalLength(humanBatchTables) {
    if (humanBatchTables.length <= 0) {
        return 0;
    }

    var firstLength = humanBatchTables[0].value.length;
    for (var i = 1; i < humanBatchTables.length; ++i) {
        if (humanBatchTables[i].value.length !== firstLength) {
            var badBatchTable = humanBatchTables[i].name;
            var badLength = humanBatchTables[i].value.length;
            throw new Error(badBatchTable + ' has incorrect length of: '  + badLength + ', should match the first length: ' + firstLength);
        }
    }

    return firstLength;
}

/**
 * @typedef humanReadableBatchTableValue
 * @type {Array} values An array of arbitrary values in human readable form (e.g ["A", "B", "C"] or [1.3, 4.3, 1.5])
 */

/**
 * @typedef binaryReadableBatchTableValue
 * @type {String} name Name of the batchTableAttribute (e.g to be placed into the accessor)
 * @type {Number} byteoffset ByteOffset of the batchTableAttribute
 * @type {Number} byteLength Length of the attribute in bytes
 * @type {Number} count Count of logical number of elements in the attribute (eg 9 floating point numbers with a vec3 type means count = 3)
 * @type {Number} componentType WebGL enum of the component type (e.g GL_UNSIGNED_BYTE / 0x1401)
 */

/**
 * @typedef batchTableAttribute
 * @type {Object.<string, humanReadableBatchTableValue|binaryReadableBatchTableValue>} batchTableAttribute;
 */

/**
 * Iterates over batchTableAttributes and adorns the provided gltf object with them via
 * the CESIUM_3dtiles_batch_table extension
 *
 * @param {Object} gltf The gltf object to edit
 * @param {batchTableAttribute} batchTableAttributes List of batch table attributes. The function will intelligently try to detect
 *                                                   if the attribute is a human readable value (a key value where the value is
 *                                                   just an array of non-binary data) or if the values are more keys describing the
 *                                                   layout of binary data in a binary buffer.
 * @param {Buffer}              sharedBinaryBuffer   Binary buffer. Must be defined if using at least 1 binary batch attribute.
 *                                                   This function currently assumes that all of the binary batch attributes in
 *                                                   batchTableAttributes are directly referring to this buffer.
 */

function create3dtilesBatchTableExt(gltf, batchTableAttributes, sharedBinaryBuffer) {
    Extensions.addExtensionsUsed(gltf, batchTableExtensionName);
    Extensions.addExtension(gltf, batchTableExtensionName, {
        batchTables: [{
            properties: {}
        }]
    });

    var humanReadable = [];
    var binaryReadable = [];
    var i = 0;

    var batchTableIndex = 0; // TODO: This will change when we add multiple batch table support
    var activeBatchTable = gltf.extensions[batchTableExtensionName].batchTables[batchTableIndex];

    var attributeNames = Object.keys(batchTableAttributes);
    for (i = 0; i < attributeNames.length; ++i) {
        if (batchTableAttributes[attributeNames[i]] instanceof Array) {
            humanReadable.push({name: attributeNames[i], value: batchTableAttributes[attributeNames[i]]});
        } else {
            binaryReadable.push(batchTableAttributes[attributeNames[i]]);
        }
    }

    activeBatchTable.batchLength = assertHumanReadableBatchTableValueArraysHaveIdenticalLength(humanReadable);
    for (i = 0; i < humanReadable.length; ++i) {
        var attribute = humanReadable[i];
        activeBatchTable.properties[attribute.name] = {values: attribute.value};
    }

    if (binaryReadable.length > 0 && !defined(sharedBinaryBuffer)) {
        throw new Error('Detected a binary attribute, but function called without binary buffer');
    }

    binaryReadable.sort(sortByByteOffset);
    if (binaryReadable.length > 0) {
        gltf.buffers.push({
            byteLength: sharedBinaryBuffer.length,
            uri: 'data:application/octet-stream;base64,' + sharedBinaryBuffer.toString('base64')
        });

        var newBufferIndex = gltf.buffers.length - 1;
        var accessorBufferViewIndex = gltf.bufferViews.length;

        for (i = 0; i < binaryReadable.length; ++i, ++accessorBufferViewIndex) {
            var batchAttribute = binaryReadable[i];

            gltf.bufferViews.push({
                buffer : newBufferIndex,
                byteLength : batchAttribute.byteLength,
                byteOffset : batchAttribute.byteOffset,
                target : 0x8892 // ARRAY_BUFFER
            });

            gltf.accessors.push({
                bufferView : accessorBufferViewIndex,
                byteOffset : 0,
                componentType : batchAttribute.componentType,
                type : batchAttribute.type,
                count : batchAttribute.count,
            });

            activeBatchTable.properties[batchAttribute.name] = {accessor: accessorBufferViewIndex};
        }
    }

    return gltf;
}

module.exports = create3dtilesBatchTableExt;
