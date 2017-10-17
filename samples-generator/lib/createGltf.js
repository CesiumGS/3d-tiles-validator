'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var gltfPipeline = require('gltf-pipeline');
var mime = require('mime');
var path = require('path');
var Promise = require('bluebird');

var Cartesian3 = Cesium.Cartesian3;
var combine = Cesium.combine;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

var addPipelineExtras = gltfPipeline.addPipelineExtras;
var getBinaryGltf = gltfPipeline.getBinaryGltf;
var loadGltfUris = gltfPipeline.loadGltfUris;
var processGltf = gltfPipeline.Pipeline.processJSON;

module.exports = createGltf;

var sizeOfUint16 = 2;
var sizeOfFloat32 = 4;

/**
 * Create a glTF from a Mesh.
 *
 * @param {Object} options An object with the following properties:
 * @param {Mesh} options.mesh The mesh.
 * @param {Boolean} [options.useBatchIds=true] Modify the glTF to include the batchId vertex attribute.
 * @param {Boolean} [options.optimizeForCesium=false] Optimize the glTF for Cesium by using the sun as a default light source.
 * @param {Boolean} [options.relativeToCenter=false] Use the Cesium_RTC extension.
 * @param {Boolean} [options.quantization=false] Save glTF with quantized attributes.
 * @param {Boolean} [options.deprecated=false] Save the glTF with the old BATCHID semantic.
 * @param {Object|Object[]} [options.textureCompressionOptions] Options for compressing textures in the glTF.
 * @param {String} [options.upAxis='Y'] Specifies the up-axis for the glTF model.
 *
 * @returns {Promise} A promise that resolves with the binary glTF buffer.
 */
function createGltf(options) {
    var useBatchIds = defaultValue(options.useBatchIds, true);
    var optimizeForCesium = defaultValue(options.optimizeForCesium, false);
    var relativeToCenter = defaultValue(options.relativeToCenter, false);
    var quantization = defaultValue(options.quantization, false);
    var deprecated = defaultValue(options.deprecated, false);
    var textureCompressionOptions = options.textureCompressionOptions;
    var upAxis = defaultValue(options.upAxis, 'Y');

    var mesh = options.mesh;
    var positions = mesh.positions;
    var normals = mesh.normals;
    var uvs = mesh.uvs;
    var batchIds = mesh.batchIds;
    var indices = mesh.indices;
    var views = mesh.views;

    // Get the center position in WGS84 coordinates
    var center;
    if (relativeToCenter) {
        center = mesh.getCenter();
        mesh.setPositionsRelativeToCenter();
    }

    var rootMatrix;
    if (upAxis === 'Y') {
        // Models are z-up, so add a z-up to y-up transform.
        // The glTF spec defines the y-axis as up, so this is the default behavior.
        // In Cesium a y-up to z-up transform is applied later so that the glTF and 3D Tiles coordinate systems are consistent
        rootMatrix = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1];
    } else if (upAxis === 'Z') {
        // No conversion needed - models are already z-up
        rootMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }

    var i;
    var positionsMinMax = getMinMax(positions, 3);
    var positionsLength = positions.length;
    var positionsBuffer = Buffer.alloc(positionsLength * sizeOfFloat32);
    for (i = 0; i < positionsLength; ++i) {
        positionsBuffer.writeFloatLE(positions[i], i * sizeOfFloat32);
    }

    var normalsMinMax = getMinMax(normals, 3);
    var normalsLength = normals.length;
    var normalsBuffer = Buffer.alloc(normalsLength * sizeOfFloat32);
    for (i = 0; i < normalsLength; ++i) {
        normalsBuffer.writeFloatLE(normals[i], i * sizeOfFloat32);
    }

    var uvsMinMax = getMinMax(uvs, 2);
    var uvsLength = uvs.length;
    var uvsBuffer = Buffer.alloc(uvsLength * sizeOfFloat32);
    for (i = 0; i < uvsLength; ++i) {
        uvsBuffer.writeFloatLE(uvs[i], i * sizeOfFloat32);
    }

    var batchIdsMinMax;
    var batchIdsLength = 9;
    var batchIdsBuffer = Buffer.alloc(0);
    var batchIdSemantic = deprecated ? 'BATCHID' : '_BATCHID';
    if (useBatchIds) {
        batchIdsMinMax = getMinMax(batchIds, 1);
        batchIdsLength = batchIds.length;
        batchIdsBuffer = Buffer.alloc(batchIdsLength * sizeOfUint16);
        for (i = 0; i < batchIdsLength; ++i) {
            batchIdsBuffer.writeUInt16LE(batchIds[i], i * sizeOfUint16);
        }
    }

    var indicesLength = indices.length;
    var indexBuffer = Buffer.alloc(indicesLength * sizeOfUint16);
    for (i = 0; i < indicesLength; ++i) {
        indexBuffer.writeUInt16LE(indices[i], i * sizeOfUint16);
    }

    var vertexBuffer = Buffer.concat([positionsBuffer, normalsBuffer, uvsBuffer, batchidsBuffer]);
    var vertexBufferByteOffset = 0;
    var vertexBufferByteLength = vertexBuffer.byteLength;
    var vertexCount = mesh.getVertexCount();

    var indexBufferByteOffset = vertexBufferByteLength;
    var indexBufferByteLength = indexBuffer.byteLength;

    var buffer = Buffer.concat([vertexBuffer, indexBuffer]);
    var bufferUri = 'data:application/octet-stream;base64,' + buffer.toString('base64');
    var byteLength = buffer.byteLength;

    var byteOffset = 0;
    var positionsByteOffset = byteOffset;
    byteOffset += positionsBuffer.length;
    var normalsByteOffset = byteOffset;
    byteOffset += normalsBuffer.length;
    var uvsByteOffset = byteOffset;
    byteOffset += uvsBuffer.length;
    var batchIdsByteOffset = byteOffset;
    byteOffset += batchIdsBuffer.length;

    var indexAccessors = [];
    var materials = [];
    var primitives = [];

    var images;
    var samplers;
    var textures;

    var indexBufferViewIndex = 0;
    var vertexBufferViewIndex = 1;
    var positionAccessorIndex = 0;
    var normalAccessorIndex = 1;
    var uvAccessorIndex = 2;
    var batchIdAccessorIndex = 3;

    var viewsLength = views.length;
    for (i = 0; i < viewsLength; ++i) {
        var view = views[i];
        var material = view.material;
        var indicesMinMax = getMinMax(indices, 1, view.indexOffset, view.indexCount);
        indexAccessors.push({
            bufferView : indexBufferViewIndex,
            byteOffset : sizeOfUint16 * view.indexOffset,
            componentType : 5123, // UNSIGNED_SHORT
            count : view.indexCount,
            type : 'SCALAR',
            min : indicesMinMax.min,
            max : indicesMinMax.max
        });

        var baseColor = material.baseColor;
        var baseColorFactor = baseColor;
        var baseColorTexture;
        var transparent = false;

        if (typeof baseColor === 'string') {
            if (!defined(images)) {
                images = [];
                textures = [];
                samplers = [{
                    magFilter : 9729, // LINEAR
                    minFilter : 9729, // LINEAR
                    wrapS : 10497, // REPEAT
                    wrapT : 10497 // REPEAT
                }];
            }
            baseColorFactor = [1.0, 1.0, 1.0, 1.0];
            baseColorTexture = baseColor;
            images.push({
                uri : baseColor
            });
            textures.push({
                sampler : 0,
                source : images.length - 1
            });
        } else {
            transparent = baseColor[3] < 1.0;
        }

        var doubleSided = transparent;
        var alphaMode = transparent ? 'BLEND' : 'OPAQUE';

        materials.push({
            pbrMetallicRoughness : {
                baseColorFactor : baseColorFactor,
                baseColorTexture : baseColorTexture
            },
            alphaMode : alphaMode,
            doubleSided : doubleSided
        });

        var attributes = {
            POSITION : positionAccessorIndex,
            NORMAL : normalAccessorIndex,
            TEXCOORD_0 : uvAccessorIndex
        };

        attributes[batchIdSemantic] = batchIdAccessorIndex;

        primitives.push({
            attributes : attributes,
            indices : i,
            material : i,
            mode : 4 // TRIANGLES
        });
    }

    var vertexAccessors = [
        {
            bufferView : vertexBufferViewIndex,
            byteOffset : positionsByteOffset,
            byteStride : 0,
            componentType : 5126, // FLOAT
            count : vertexCount,
            type : 'VEC3',
            min : positionsMinMax.min,
            max : positionsMinMax.max,
            name : 'positions'
        },
        {
            bufferView : vertexBufferViewIndex,
            byteOffset : normalsByteOffset,
            byteStride : 0,
            componentType : 5126, // FLOAT
            count : vertexCount,
            type : 'VEC3',
            min : normalsMinMax.min,
            max : normalsMinMax.max,
            name : 'normals'
        },
        {
            bufferView : vertexBufferViewIndex,
            byteOffset : uvsByteOffset,
            byteStride : 0,
            componentType : 5126, // FLOAT
            count : vertexCount,
            type : 'VEC2',
            min : uvsMinMax.min,
            max : uvsMinMax.max,
            name : 'uvs'
        }
    ];

    if (useBatchIds) {
        vertexAccessors.push({
            bufferView : vertexBufferViewIndex,
            byteOffset : batchIdsByteOffset,
            byteStride : 0,
            componentType : 5123, // UNSIGNED_SHORT
            count : batchIdsLength,
            type : 'SCALAR',
            min : batchIdsMinMax.min,
            max : batchIdsMinMax.max,
            name : 'batch-ids'
        });
    }

    var accessors = combine(vertexAccessors, indexAccessors);

    var gltf = {
        accessors : accessors,
        asset : {
            generator : '3d-tiles-samples-generator',
            version : '2.0'
        },
        buffers : [{
            byteLength : byteLength,
            uri : bufferUri
        }],
        bufferViews : [
            {
                buffer : 0,
                byteLength : vertexBufferByteLength,
                byteOffset : vertexBufferByteOffset,
                target : 34962 // ARRAY_BUFFER
            },
            {
                buffer : 0,
                byteLength : indexBufferByteLength,
                byteOffset : indexBufferByteOffset,
                target : 34963 // ELEMENT_ARRAY_BUFFER
            }
        ],
        images : images,
        materials : materials,
        meshes : [
            {
                primitives : primitives
            }
        ],
        nodes : [
            {
                matrix : rootMatrix,
                meshes : 0,
                name : 'rootNode'
            }
        ],
        samplers : samplers,
        scene : 0,
        scenes : [{
            nodes : [0]
        }],
        textures : textures
    };

    if (relativeToCenter) {
        gltf.extensionsUsed = ['CESIUM_RTC'];
        gltf.extensions = {
            CESIUM_RTC : {
                center : Cartesian3.pack(center, new Array(3))
            }
        };
    }

    // TODO : add back quantize, compressTextureCoordinates, encodeNormals, and textureCompressionOptions
    // TODO : afterwards, convert to glb and return that
}

function getMinMax(array, components, start, length) {
    start = defaultValue(start, 0);
    length = defaultValue(length, array.length);
    var min = new Array(components).fill(Number.POSITIVE_INFINITY);
    var max = new Array(components).fill(Number.NEGATIVE_INFINITY);
    var count = length / components;
    for (var i = 0; i < count; ++i) {
        for (var j = 0; j < components; ++j) {
            var index = start + i * components + j;
            var value = array[index];
            min[j] = Math.min(min[j], value);
            max[j] = Math.max(max[j], value);
        }
    }
    return {
        min : min,
        max : max
    };
}
