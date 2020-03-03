'use strict';
var Cesium = require('cesium');
var getBufferPadded = require('./getBufferPadded');
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = createGltf;

var sizeOfUint8 = 1;
var sizeOfUint16 = 2;
var sizeOfFloat32 = 4;

/**
 * Create a glTF from a Mesh.
 *
 * @param {Object} options An object with the following properties:
 * @param {Mesh} options.mesh The mesh.
 * @param {Boolean} [options.useBatchIds=true] Modify the glTF to include the batchId vertex attribute.
 * @param {Boolean} [options.relativeToCenter=false] Set mesh positions relative to center.
 * @param {Boolean} [options.deprecated=false] Save the glTF with the old BATCHID semantic.
 * @param {Boolean} [options.use3dTilesNext=false] Modify the GLTF to name batch ids with a numerical suffix
 *
 * @returns {Object} A glTF object
 */

function createGltf(options) {
    var use3dTilesNext = defaultValue(options.use3dTilesNext, false);
    var useBatchIds = defaultValue(options.useBatchIds, true);
    var relativeToCenter = defaultValue(options.relativeToCenter, false);
    var deprecated = defaultValue(options.deprecated, false);

    var mesh = options.mesh;
    var positions = mesh.positions;
    var normals = mesh.normals;
    var uvs = mesh.uvs;
    var vertexColors = mesh.vertexColors;
    var batchIds = mesh.batchIds;
    var indices = mesh.indices;
    var views = mesh.views;

    // If all the vertex colors are 0 then the mesh does not have vertex colors
    var useVertexColors = !vertexColors.every(function(element) {return element === 0;});

    if (relativeToCenter) {
        mesh.setPositionsRelativeToCenter();
    }

    // Models are z-up, so add a z-up to y-up transform.
    // The glTF spec defines the y-axis as up, so this is the default behavior.
    // In CesiumJS a y-up to z-up transform is applied later so that the glTF and 3D Tiles coordinate systems are consistent
    var rootMatrix = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1];

    var i;
    var view;
    var material;
    var viewsLength = views.length;
    var useUvs = false;
    for (i = 0; i < viewsLength; ++i) {
        view = views[i];
        material = view.material;
        if (typeof material.baseColor === 'string') {
            useUvs = true;
            break;
        }
    }

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

    var uvsMinMax;
    var uvsBuffer = Buffer.alloc(0);
    if (useUvs) {
        uvsMinMax = getMinMax(uvs, 2);
        var uvsLength = uvs.length;
        uvsBuffer = Buffer.alloc(uvsLength * sizeOfFloat32);
        for (i = 0; i < uvsLength; ++i) {
            uvsBuffer.writeFloatLE(uvs[i], i * sizeOfFloat32);
        }
    }

    var vertexColorsMinMax;
    var vertexColorsBuffer = Buffer.alloc(0);
    if (useVertexColors) {
        vertexColorsMinMax = getMinMax(vertexColors, 4);
        var vertexColorsLength = vertexColors.length;
        vertexColorsBuffer = Buffer.alloc(vertexColorsLength, sizeOfUint8);
        for (i = 0; i < vertexColorsLength; ++i) {
            vertexColorsBuffer.writeUInt8(vertexColors[i], i);
        }
    }

    var batchIdsMinMax;
    var batchIdsBuffer = Buffer.alloc(0);
    var batchIdSemantic = deprecated ? 'BATCHID' : '_BATCHID';
    batchIdSemantic = use3dTilesNext ? batchIdSemantic + '_0' : batchIdSemantic;

    var batchIdsLength;
    if (useBatchIds) {
        batchIdsMinMax = getMinMax(batchIds, 1);
        batchIdsLength = batchIds.length;
        batchIdsBuffer = Buffer.alloc(batchIdsLength * sizeOfFloat32);
        for (i = 0; i < batchIdsLength; ++i) {
            batchIdsBuffer.writeFloatLE(batchIds[i], i * sizeOfFloat32);
        }
    }

    var indicesLength = indices.length;
    var indexBuffer = Buffer.alloc(indicesLength * sizeOfUint16);
    for (i = 0; i < indicesLength; ++i) {
        indexBuffer.writeUInt16LE(indices[i], i * sizeOfUint16);
    }

    var vertexCount = mesh.getVertexCount();

    var vertexBuffer = getBufferPadded(Buffer.concat([positionsBuffer, normalsBuffer, uvsBuffer, vertexColorsBuffer, batchIdsBuffer]));
    var buffer = getBufferPadded(Buffer.concat([vertexBuffer, indexBuffer]));
    var bufferUri = 'data:application/octet-stream;base64,' + buffer.toString('base64');
    var byteLength = buffer.byteLength;

    var indexAccessors = [];
    var materials = [];
    var primitives = [];

    var images;
    var samplers;
    var textures;

    var bufferViewIndex = 0;
    var positionsBufferViewIndex = bufferViewIndex++;
    var normalsBufferViewIndex = bufferViewIndex++;
    var uvsBufferViewIndex = useUvs ? bufferViewIndex++ : 0;
    var vertexColorsBufferViewIndex = useVertexColors ? bufferViewIndex++ : 0;
    var batchIdsBufferViewIndex = useBatchIds ? bufferViewIndex++ : 0;
    var indexBufferViewIndex = bufferViewIndex++;

    var byteOffset = 0;
    var positionsBufferByteOffset = byteOffset;
    byteOffset += positionsBuffer.length;
    var normalsBufferByteOffset = byteOffset;
    byteOffset += normalsBuffer.length;
    var uvsBufferByteOffset = byteOffset;
    byteOffset += useUvs ? uvsBuffer.length : 0;
    var vertexColorsBufferByteOffset = byteOffset;
    byteOffset += useVertexColors ? vertexColorsBuffer.length : 0;
    var batchIdsBufferByteOffset = byteOffset;
    byteOffset += useBatchIds ? batchIdsBuffer.length : 0;

    // Start index buffer at the padded byte offset
    byteOffset = vertexBuffer.length;
    var indexBufferByteOffset = byteOffset;
    byteOffset += indexBuffer.length;

    for (i = 0; i < viewsLength; ++i) {
        view = views[i];
        material = view.material;
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

        material = {
            pbrMetallicRoughness : {
                baseColorFactor : baseColorFactor,
                roughnessFactor : 1.0,
                metallicFactor : 0.0
            },
            alphaMode : alphaMode,
            doubleSided : doubleSided
        };

        if (defined(baseColorTexture)) {
            material.pbrMetallicRoughness.baseColorTexture = {
                index : 0
            };
        }

        materials.push(material);

        var attributes = {
            POSITION : positionsBufferViewIndex,
            NORMAL : normalsBufferViewIndex
        };

        if (useUvs) {
            attributes.TEXCOORD_0 = uvsBufferViewIndex;
        }

        if (useVertexColors) {
            attributes.COLOR_0 = vertexColorsBufferViewIndex;
        }

        if (useBatchIds) {
            attributes[batchIdSemantic] = batchIdsBufferViewIndex;
        }

        primitives.push({
            attributes : attributes,
            indices : indexBufferViewIndex + i,
            material : i,
            mode : 4 // TRIANGLES
        });
    }

    var vertexAccessors = [
        {
            bufferView : positionsBufferViewIndex,
            byteOffset : 0,
            componentType : 5126, // FLOAT
            count : vertexCount,
            type : 'VEC3',
            min : positionsMinMax.min,
            max : positionsMinMax.max
        },
        {
            bufferView : normalsBufferViewIndex,
            byteOffset : 0,
            componentType : 5126, // FLOAT
            count : vertexCount,
            type : 'VEC3',
            min : normalsMinMax.min,
            max : normalsMinMax.max
        }
    ];

    if (useUvs) {
        vertexAccessors.push({
            bufferView : uvsBufferViewIndex,
            byteOffset : 0,
            componentType : 5126, // FLOAT
            count : vertexCount,
            type : 'VEC2',
            min : uvsMinMax.min,
            max : uvsMinMax.max
        });
    }

    if (useVertexColors) {
        vertexAccessors.push({
            bufferView : vertexColorsBufferViewIndex,
            byteOffset : 0,
            componentType : 5121, // UNSIGNED_BYTE
            count : vertexCount,
            type : 'VEC4',
            min : vertexColorsMinMax.min,
            max : vertexColorsMinMax.max,
            normalized : true
        });
    }

    if (useBatchIds) {
        vertexAccessors.push({
            bufferView : batchIdsBufferViewIndex,
            byteOffset : 0,
            componentType : 5126, // FLOAT
            count : batchIdsLength,
            type : 'SCALAR',
            min : batchIdsMinMax.min,
            max : batchIdsMinMax.max
        });
    }

    var accessors = vertexAccessors.concat(indexAccessors);

    var bufferViews = [
        {
            buffer : 0,
            byteLength : positionsBuffer.length,
            byteOffset : positionsBufferByteOffset,
            target : 34962 // ARRAY_BUFFER
        },
        {
            buffer : 0,
            byteLength : normalsBuffer.length,
            byteOffset : normalsBufferByteOffset,
            target : 34962 // ARRAY_BUFFER
        }
    ];

    if (useUvs) {
        bufferViews.push({
            buffer : 0,
            byteLength : uvsBuffer.length,
            byteOffset : uvsBufferByteOffset,
            target : 34962 // ARRAY_BUFFER
        });
    }

    if (useVertexColors) {
        bufferViews.push({
            buffer : 0,
            byteLength : vertexColorsBuffer.length,
            byteOffset : vertexColorsBufferByteOffset,
            target : 34962 // ARRAY_BUFFER
        });
    }

    if (useBatchIds) {
        bufferViews.push({
            buffer : 0,
            byteLength : batchIdsBuffer.length,
            byteOffset : batchIdsBufferByteOffset,
            target : 34962 // ARRAY_BUFFER
        });
    }

    bufferViews.push({
        buffer : 0,
        byteLength : indexBuffer.length,
        byteOffset : indexBufferByteOffset,
        target : 34963 // ELEMENT_ARRAY_BUFFER
    });

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
        bufferViews : bufferViews,
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
                mesh : 0,
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

    return gltf;
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
