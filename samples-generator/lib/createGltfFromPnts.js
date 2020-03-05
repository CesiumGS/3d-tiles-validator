'use strict';
var Cesium = require('cesium');
var defined  = Cesium.defined;
var typeConversion = require('./typeConversion');
module.exports = createGltfFromPnts;

/*
 @typedef attributeBufferType
 @type {Object}:
 @property {Buffer} buffer BufferAttribute data
 @property {String} componentType BufferAttribute componentType (FLOAT, UNSIGNED_BYTE, DOUBLE)
 @property {String} propertyName BufferAttribute property name (POSITION, NORMAL, COLOR, WEIGHT)
 @property {String} type (SCALAR, VEC2, VEC3, VEC4)
 @property {String} target OpenGL / WebGL re:
 @property {Array.<Number>} min Minimum value for each component in the bufferAttribute
 @property {Array.<Number>} max Maximum value for each component in the bufferAttribute
 target  (e.g 0x8892, 0x8893)
 */


function createAmalgamatedGltfBuffer(attributeBuffers, indexBuffer) {
    var megaBuffer = Buffer.concat(attributeBuffers.map(function (ab) { return ab.buffer; }));
    if (defined(indexBuffer)) {
        megaBuffer = Buffer.concat([megaBuffer, indexBuffer.buffer]);
    }

    return [{
        'uri': 'data:application/octet-stream;base64,' + Buffer.from(megaBuffer).toString('base64'),
        'byteLength': megaBuffer.length
    }];
 }

/**
 * Generates a list of bufferViews. Buffer is currently hardcoded to 0, as
 * this module will only ever generate 1 buffer when converting pointcloud data
 * into a GLTF
 *
 * @param {Array.<attributeBufferType>} attributeBuffers A list of buffer attributes to convert to GLTF
 * @param {attributeBufferType=} indexBuffer An optional indexBuffer.
 * @returns {Object} a buffer views array
 */

 function createBufferViewsFromAttributeBuffers(attributeBuffers, indexBuffer) {
     var i = 0;
     var result = [];
     var byteOffset = 0;

     for (i = 0; i < attributeBuffers.length; ++i) {
         result.push({
             buffer: 0,
             byteLength: attributeBuffers[i].buffer.byteLength,
             byteOffset: byteOffset,
             target: attributeBuffers[i].target
         });

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
 * @param {Array.<attributeBufferType>} attributeBuffers A list of buffer attributes to convert to GLTF
 * @param {attributeBufferType=} indexBuffer An optional indexBuffer.
 * @returns {Array.Object} A GLTF meshes array
 */

 function createMeshFromAttributeBuffers(attributeBuffers, indexBuffer) {
     // the index of the attribute in the inputted bufferAttributes array directly
     // corresponds to the accessor ID
     var primitives = {
         attributes: {},
         'mode': 0
     };

     var i = 0;
     for (; i < attributeBuffers.length; ++i) {
         primitives.attributes[attributeBuffers[i].propertyName] = i;
     }

     if (defined(indexBuffer)) {
         primitives.indices = i;
     }

     return [{
         'primitives': [primitives],
    }];
 }

/**
 * Creates accessors from attributeBuffers
 * @param {Array.<attributeBufferType>} bufferAttributes A list of buffer attributes to convert to GLTF
 * @param {attributeBufferType=} indexBuffer An optional indexBuffer.
 * @returns {Object} a buffer views array
 */

function createAccessorsFromAttributeBuffers(attributeBuffers, indexBuffer) {
    var componentType;
    var validComponentType;
    var normalizedComponentType;
    var accessors = [];
    var i = 0;

    for (; i < attributeBuffers.length; ++i) {
        componentType = attributeBuffers[i].componentType;
        validComponentType = typeConversion.isValidWebGLDataTypeEnum(componentType);
        normalizedComponentType = validComponentType ? componentType : typeConversion.componentTypeStringToInteger(componentType);
        if (typeof attributeBuffers[i].count === 'undefined') {
          console.assert('oh no');
        }

        accessors.push({
            bufferView: i,
            byteOffset: 0,
            componentType: normalizedComponentType,
            type: attributeBuffers[i].type,
            count: attributeBuffers[i].count,
            min: attributeBuffers[i].min,
            max: attributeBuffers[i].max
        });
    }

    if (defined(indexBuffer)) {
        componentType = indexBuffer.componentType;
        validComponentType = typeConversion.isValidWebGLDataTypeEnum(componentType);
        normalizedComponentType = validComponentType ? componentType : typeConversion.componentTypeStringToInteger(componentType);
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
 * @param {Array.<attributeBufferType>} attributeBuffers An object where each key is the name of a bufferAttribute,
 *                                                       and each value is another js object with the following keys:
 * @param {attributeBufferType=} indexBuffer An optional indexBuffer.
 *
 * @returns {Object} a GLTF object
 */

function createGltfFromPnts(attributeBuffers, indexBuffer) {
    var gltf = {
        asset : {
            generator : '3d-tiles-samples-generator',
            version : '2.0'
        }
    };

    gltf.buffers = createAmalgamatedGltfBuffer(attributeBuffers, indexBuffer);
    gltf.bufferViews = createBufferViewsFromAttributeBuffers(attributeBuffers, indexBuffer);
    gltf.meshes = createMeshFromAttributeBuffers(attributeBuffers, indexBuffer);
    gltf.accessors = createAccessorsFromAttributeBuffers(attributeBuffers, indexBuffer);
    gltf.nodes = [{'mesh': 0}];
    gltf.scenes = [{'nodes': [0]}];
    return gltf;
}