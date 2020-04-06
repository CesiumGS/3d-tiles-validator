'use strict';
var Cesium = require('cesium');
var defined = Cesium.defined;
var typeConversion = require('./typeConversion');
module.exports = createGltfFromPnts;

function isImplicitBufferView(attributeBuffer) {
    return (
        !defined(attributeBuffer.buffer) || attributeBuffer.buffer.length === 0
    );
}

/**
 @typedef attributeBufferType
 @type {Object}
 @property {Buffer} buffer BufferAttribute data
 @property {String} componentType BufferAttribute componentType
 (FLOAT, UNSIGNED_BYTE, DOUBLE)
 @property {String} propertyName BufferAttribute property name
 (POSITION, NORMAL, COLOR, WEIGHT)
 @property {String} type (SCALAR, VEC2, VEC3, VEC4)
 @property {String} target WebGL rendering target, like ARRAY_BUFFER, or
 ELEMENT_ARRAY_BUFFER (e.g 0x8892, 0x8893)
 @property {Array.<Number>} min Minimum value for each component in the
 bufferAttribute
 @property {Array.<Number>} max Maximum value for each component in the
 bufferAttribute
 */

function createAmalgamatedGltfBuffer(attributeBuffers, indexBuffer) {
    var megaBuffer = Buffer.concat(
        attributeBuffers.map(function (ab) {
            return ab.buffer;
        })
    );
    if (defined(indexBuffer)) {
        megaBuffer = Buffer.concat([megaBuffer, indexBuffer.buffer]);
    }

    return [
        {
            uri:
                'data:application/octet-stream;base64,' +
                Buffer.from(megaBuffer).toString('base64'),
            byteLength: megaBuffer.length
        }
    ];
}

/**
 * Generates a list of bufferViews. Buffer is currently hardcoded to 0, as
 * this module will only ever generate 1 buffer when converting pointcloud data
 * into a GLTF
 *
 * @param {Array<attributeBufferType>} attributeBuffers A list of buffer
 * attributes to convert to GLTF
 * @param {attributeBufferType} [indexBuffer] An optional indexBuffer.
 * @returns {Object} a buffer views array
 */
function createBufferViewsFromAttributeBuffers(attributeBuffers, indexBuffer) {
    var result = [];
    var byteOffset = 0;

    for (var i = 0; i < attributeBuffers.length; ++i) {
        if (isImplicitBufferView(attributeBuffers[i])) {
            continue;
        }

        var bufferView = {
            buffer: 0,
            byteLength: attributeBuffers[i].buffer.byteLength,
            byteOffset: byteOffset,
            target: attributeBuffers[i].target
        };

        if (defined(attributeBuffers[i].byteStride)) {
            bufferView.byteStride = attributeBuffers[i].byteStride;
        }

        result.push(bufferView);

        // All attribute data is tightly packed
        byteOffset += attributeBuffers[i].buffer.byteLength;
    }

    if (defined(indexBuffer)) {
        result.push({
            buffer: 0,
            byteLength: indexBuffer.buffer.byteLength,
            byteOffset: byteOffset,
            target: indexBuffer.target
        });
    }

    return result;
}

/**
 * Create a meshes singleton using bufferAttributes
 * @param {Array.<attributeBufferType>} attributeBuffers A list of buffer
 * attributes to convert to GLTF
 * @param {attributeBufferType} [indexBuffer] An optional indexBuffer.
 * @returns {Array.<Object>} A GLTF meshes array
 */
function createMeshFromAttributeBuffers(attributeBuffers, indexBuffer) {
    // the index of the attribute in the inputted bufferAttributes array directly
    // corresponds to the accessor ID
    var primitives = {
        attributes: {},
        mode: 0
    };

    var i;
    for (i = 0; i < attributeBuffers.length; ++i) {
        primitives.attributes[attributeBuffers[i].propertyName] = i;
    }

    if (defined(indexBuffer)) {
        primitives.indices = i;
    }

    return [
        {
            primitives: [primitives]
        }
    ];
}

/**
 * Creates accessors from attributeBuffers
 * @param {Array.<attributeBufferType>} bufferAttributes A list of buffer
 * attributes to convert to GLTF
 * @param {attributeBufferType} [indexBuffer] An optional indexBuffer.
 * @returns {Object} a buffer views array
 */

function createAccessorsFromAttributeBuffers(attributeBuffers, indexBuffer) {
    var componentType;
    var validComponentType;
    var normalizedComponentType;
    var accessors = [];
    var i;

    for (i = 0; i < attributeBuffers.length; ++i) {
        componentType = attributeBuffers[i].componentType;
        validComponentType = typeConversion.isValidWebGLDataTypeEnum(
            componentType
        );
        normalizedComponentType = validComponentType
            ? componentType
            : typeConversion.componentTypeStringToInteger(componentType);

        var accessor = {
            componentType: normalizedComponentType,
            type: attributeBuffers[i].type,
            count: attributeBuffers[i].count,
            min: attributeBuffers[i].min,
            max: attributeBuffers[i].max
        };

        if (defined(attributeBuffers[i].normalized)) {
            accessor.normalized = attributeBuffers[i].normalized;
        }

        // detect accessors with implicit buffer views
        if (!isImplicitBufferView(attributeBuffers[i])) {
            accessor.bufferView = i;
            accessor.byteOffset = 0;
        }

        accessors.push(accessor);
    }

    if (defined(indexBuffer)) {
        componentType = indexBuffer.componentType;
        validComponentType = typeConversion.isValidWebGLDataTypeEnum(
            componentType
        );
        normalizedComponentType = validComponentType
            ? componentType
            : typeConversion.componentTypeStringToInteger(componentType);
        accessors.push({
            bufferView: i,
            byteOffset: 0,
            componentType: normalizedComponentType,
            count: indexBuffer.count,
            type: indexBuffer.type,
            min: indexBuffer.min,
            max: indexBuffer.max
        });
    }

    return accessors;
}

/**
 * Create a GLTF from PNTS data
 *
 * @param {Array.<attributeBufferType>} attributeBuffers An object where each
 * key is the name of a bufferAttribute,
 * and each value is another js object with the following keys:
 * @param {attributeBufferType} [indexBuffer] An optional indexBuffer.
 * @param {Object} [rtc] Optional RTC vec3. Will be inserted into the node hierarchy.
 *
 * @returns {Object} a GLTF object
 */

function createGltfFromPnts(attributeBuffers, indexBuffer, rtc) {
    var gltf = {
        asset: {
            generator: '3d-tiles-samples-generator',
            version: '2.0'
        }
    };

    // z-up to y-up transform.
    var rootMatrix = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1];

    gltf.buffers = createAmalgamatedGltfBuffer(attributeBuffers, indexBuffer);
    gltf.bufferViews = createBufferViewsFromAttributeBuffers(
        attributeBuffers,
        indexBuffer
    );
    gltf.meshes = createMeshFromAttributeBuffers(attributeBuffers, indexBuffer);
    gltf.accessors = createAccessorsFromAttributeBuffers(
        attributeBuffers,
        indexBuffer
    );
    gltf.nodes = [{ matrix: rootMatrix, mesh: 0, name: 'rootNode' }];
    if (defined(rtc)) {
        delete gltf.nodes[0].mesh;
        gltf.nodes[0].children = [1];
        gltf.nodes.push({ name: 'RTC_CENTER', mesh: 0, translation: rtc });
    }
    gltf.scenes = [{ nodes: [0] }];

    return gltf;
}
