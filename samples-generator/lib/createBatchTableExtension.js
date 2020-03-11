'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var Extensions = require('./Extensions');
var batchTableExtensionName = 'CESIUM_3dtiles_batch_table';
var typeConversion = require('./typeConversion');
module.exports = createBatchTableExtension;

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
    if (humanBatchTables.length === 0) {
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

function assertBinaryHasIdenticalCount(binaryBatchTables) {
    if (binaryBatchTables.length === 0) {
        return 0;
    }

    var firstLength = binaryBatchTables[0].count;
    for (var i = 1; i < binaryBatchTables.length; ++i) {
        if (binaryBatchTables[i].count !== firstLength) {
            var badBatchTable = binaryBatchTables[i].name;
            var badLength = binaryBatchTables[i].count;
            throw new Error(badBatchTable + ' has incorrect length of: '  + badLength + ', should match the first length: ' + firstLength);
        }
    }

    return firstLength;
}

function isCandidateForImplicitBufferView(batchAttribute) {
    var min = batchAttribute.min;
    var max = batchAttribute.max;
    var count = batchAttribute.count;
    var minExists = defined(batchAttribute.min);
    var maxExists = defined(batchAttribute.max);
    var minPasses = minExists && min.length === 1 && min[0] === 0;
    var maxPasses = maxExists && max.length === 1 && max[0] === count - 1;
    return minPasses && maxPasses;
}

/**
 * @typedef humanReadableBatchTableValue
 * @type {Object}
 * @property {Array} values An array of arbitrary values in human readable form (e.g ["A", "B", "C"] or [1.3, 4.3, 1.5])
 */

/**
 * @typedef binaryReadableBatchTableValue
 * @type {Object}
 * @property {String} name Name of the batchTableAttribute (e.g to be placed into the accessor)
 * @property {Number} byteoffset ByteOffset of the batchTableAttribute
 * @property {Number} byteLength Length of the attribute in bytes
 * @property {Number} count Count of logical number of elements in the attribute (eg 9 floating point numbers with a vec3 property means count = 3)
 * @property {Number} componentType WebGL enum of the component property (e.g GL_UNSIGNED_BYTE / 0x1401)
 */

/**
 * @typedef batchTableAttribute
 * @type {Object.<string, humanReadableBatchTableValue|binaryReadableBatchTableValue>}
 */

/**
 * @typedef attributeBufferType
 * @type {Object}
 * @property {Buffer} buffer BufferAttribute data
 * @property {String} componentType BufferAttribute componentType (FLOAT, UNSIGNED_BYTE, DOUBLE)
 * @property {String} propertyName BufferAttribute property name (POSITION, NORMAL, COLOR, WEIGHT)
 * @property {String} type (SCALAR, VEC2, VEC3, VEC4)
 * @property {String} target WebGL rendering target, like ARRAY_BUFFER, or ELEMENT_ARRAY_BUFFE (e.g 0x8892, 0x8893)
 * @property {Array.<Number>} min Minimum value for each component in the bufferAttribute
 * @property {Array.<Number>} max Maximum value for each component in the bufferAttribute
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
function createBatchTableExtension(gltf, batchTableAttributes, sharedBinaryBuffer) {
    Extensions.addExtensionsUsed(gltf, batchTableExtensionName);
    Extensions.addExtension(gltf, batchTableExtensionName, {
        batchTables: [{
            properties: {}
        }]
    });

    var humanReadable = [];
    var binaryReadable = [];
    var i;

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

    var humanBatchLength = assertHumanReadableBatchTableValueArraysHaveIdenticalLength(humanReadable);
    var binaryBatchLength = assertBinaryHasIdenticalCount(binaryReadable);

    if (humanBatchLength === 0 && binaryBatchLength === 0) {
        throw new Error('Must have at least one binary or human readable batch table attribute');
    }

    if (humanBatchLength > 0 && binaryBatchLength > 0 && binaryBatchLength !== humanBatchLength) {
        throw new Error('Count must be identical across all batch table properties (binary or human readable)');
    }

    activeBatchTable.batchLength = Math.max(humanBatchLength, binaryBatchLength);

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
        var bufferViewIndex = gltf.bufferViews.length;
        var accessorIndex = gltf.accessors.length;

        for (i = 0; i < binaryReadable.length; ++i, ++accessorIndex) {
            var batchAttribute = binaryReadable[i];

            var componentType = batchAttribute.componentType;
            var validComponentType = typeConversion.isValidWebGLDataTypeEnum(componentType);
            var normalizedComponentType = validComponentType ? componentType : typeConversion.componentTypeStringToInteger(componentType);

            var implicitBufferView = isCandidateForImplicitBufferView(batchAttribute);
            if (!implicitBufferView) {
                gltf.bufferViews.push({
                    buffer : newBufferIndex,
                    byteLength : batchAttribute.byteLength,
                    byteOffset : batchAttribute.byteOffset,
                    target : 0x8892 // ARRAY_BUFFER
                });
            }

            var accessor = {
                componentType : normalizedComponentType,
                type : batchAttribute.type,
                count : batchAttribute.count,
                min : batchAttribute.min,
                max : batchAttribute.max
            };

            if (!implicitBufferView) {
                accessor.bufferView = bufferViewIndex++;
                accessor.byteOffset = 0;
            }

            gltf.accessors.push(accessor);
            activeBatchTable.properties[batchAttribute.name] = {accessor: accessorIndex};
        }
    }

    return gltf;
}
