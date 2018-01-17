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

var addPipelineExtras = gltfPipeline.addPipelineExtras;
var getBinaryGltf = gltfPipeline.getBinaryGltf;
var loadGltfUris = gltfPipeline.loadGltfUris;
var processGltf = gltfPipeline.Pipeline.processJSON;

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
 * @param {Boolean} [options.optimizeForCesium=false] Optimize the glTF for Cesium by using the sun as a default light source.
 * @param {Boolean} [options.relativeToCenter=false] Use the Cesium_RTC extension.
 * @param {Boolean} [options.khrMaterialsCommon=false] Save glTF with the KHR_materials_common extension.
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
    var khrMaterialsCommon = defaultValue(options.khrMaterialsCommon, false);
    var quantization = defaultValue(options.quantization, false);
    var deprecated = defaultValue(options.deprecated, false);
    var textureCompressionOptions = options.textureCompressionOptions;
    var upAxis = defaultValue(options.upAxis, 'Y');

    var mesh = options.mesh;
    var positions = mesh.positions;
    var normals = mesh.normals;
    var uvs = mesh.uvs;
    var vertexColors = mesh.vertexColors;
    var indices = mesh.indices;
    var views = mesh.views;

    // If all the vertex colors are 0 then the mesh does not have vertex colors
    var hasVertexColors = !vertexColors.every(function(element) {return element === 0;});

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

    var vertexColorsMinMax;
    var vertexColorsBuffer = Buffer.alloc(0);
    if (hasVertexColors) {
        vertexColorsMinMax = getMinMax(vertexColors, 4);
        var vertexColorsLength = vertexColors.length;
        vertexColorsBuffer = Buffer.alloc(vertexColorsLength, sizeOfUint8);
        for (i = 0; i < vertexColorsLength; ++i) {
            vertexColorsBuffer.writeUInt8(vertexColors[i], i);
        }
    }

    var indicesLength = indices.length;
    var indexBuffer = Buffer.alloc(indicesLength * sizeOfUint16);
    for (i = 0; i < indicesLength; ++i) {
        indexBuffer.writeUInt16LE(indices[i], i * sizeOfUint16);
    }

    var vertexBuffer = Buffer.concat([positionsBuffer, normalsBuffer, uvsBuffer, vertexColorsBuffer]);
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

    var vertexColorsByteOffset = byteOffset;
    if (hasVertexColors) {
        byteOffset += vertexColorsBuffer.length;
    }

    var indexAccessors = {};
    var materials = {};
    var primitives = [];
    var images = {};
    var samplers = {};
    var textures = {};

    var viewsLength = views.length;
    for (i = 0; i < viewsLength; ++i) {
        var view = views[i];
        var material = view.material;
        var accessorName = 'accessor_index_' + i;
        var materialName = 'material_' + i;
        var indicesMinMax = getMinMax(indices, 1, view.indexOffset, view.indexCount);
        indexAccessors[accessorName] = {
            bufferView : 'bufferView_index',
            byteOffset : sizeOfUint16 * view.indexOffset,
            byteStride : 0,
            componentType : 5123, // UNSIGNED_SHORT
            count : view.indexCount,
            type : 'SCALAR',
            min : indicesMinMax.min,
            max : indicesMinMax.max
        };

        var ambient = material.ambient;
        var diffuse = material.diffuse;
        var emission = material.emission;
        var specular = material.specular;
        var shininess = material.shininess;
        var transparent = false;

        if (typeof diffuse === 'string') {
            images.image_diffuse = {
                uri : diffuse
            };
            samplers.sampler_diffuse = {
                magFilter : 9729, // LINEAR
                minFilter : 9729, // LINEAR
                wrapS : 10497, // REPEAT
                wrapT : 10497 // REPEAT
            };
            textures.texture_diffuse = {
                format : 6408, // RGBA
                internalFormat : 6408, // RGBA
                sampler : 'sampler_diffuse',
                source : 'image_diffuse',
                target : 3553, // TEXTURE_2D
                type : 5121 // UNSIGNED_BYTE
            };

            diffuse = 'texture_diffuse';
        } else {
            transparent = diffuse[3] < 1.0;
        }

        var doubleSided = transparent;
        var technique = (shininess > 0.0) ? 'PHONG' : 'LAMBERT';

        materials[materialName] = {
            extensions : {
                KHR_materials_common : {
                    technique : technique,
                    transparent : transparent,
                    doubleSided : doubleSided,
                    values : {
                        ambient : ambient,
                        diffuse : diffuse,
                        emission : emission,
                        specular : specular,
                        shininess : shininess,
                        transparency : 1.0,
                        transparent : transparent,
                        doubleSided : doubleSided
                    }
                }
            }
        };

        var attributes = {
            POSITION : 'accessor_position',
            NORMAL : 'accessor_normal',
            TEXCOORD_0 : 'accessor_uv'
        };

        if (hasVertexColors) {
            attributes.COLOR_0 = 'accessor_vertexColor';
        }

        primitives.push({
            attributes : attributes,
            indices : accessorName,
            material : materialName,
            mode : 4 // TRIANGLES
        });
    }

    var vertexAccessors = {
        accessor_position : {
            bufferView : 'bufferView_vertex',
            byteOffset : positionsByteOffset,
            byteStride : 0,
            componentType : 5126, // FLOAT
            count : vertexCount,
            type : 'VEC3',
            min : positionsMinMax.min,
            max : positionsMinMax.max
        },
        accessor_normal : {
            bufferView : 'bufferView_vertex',
            byteOffset : normalsByteOffset,
            byteStride : 0,
            componentType : 5126, // FLOAT
            count : vertexCount,
            type : 'VEC3',
            min : normalsMinMax.min,
            max : normalsMinMax.max
        },
        accessor_uv : {
            bufferView : 'bufferView_vertex',
            byteOffset : uvsByteOffset,
            byteStride : 0,
            componentType : 5126, // FLOAT
            count : vertexCount,
            type : 'VEC2',
            min : uvsMinMax.min,
            max : uvsMinMax.max
        }
    };

    if (hasVertexColors) {
        vertexAccessors.accessor_vertexColor = {
            bufferView : 'bufferView_vertex',
            byteOffset : vertexColorsByteOffset,
            byteStride : 0,
            componentType : 5121, // UNSIGNED_BYTE
            count : vertexCount,
            type : 'VEC4',
            min : vertexColorsMinMax.min,
            max : vertexColorsMinMax.max,
            normalized : true
        };
    }

    var accessors = combine(vertexAccessors, indexAccessors);

    var gltf = {
        accessors : accessors,
        asset : {
            generator : '3d-tiles-samples-generator',
            version : '1.0',
            profile : {
                api : 'WebGL',
                version : '1.0'
            }
        },
        buffers : {
            buffer : {
                byteLength : byteLength,
                uri : bufferUri
            }
        },
        bufferViews : {
            bufferView_vertex : {
                buffer : 'buffer',
                byteLength : vertexBufferByteLength,
                byteOffset : vertexBufferByteOffset,
                target : 34962 // ARRAY_BUFFER
            },
            bufferView_index : {
                buffer : 'buffer',
                byteLength : indexBufferByteLength,
                byteOffset : indexBufferByteOffset,
                target : 34963 // ELEMENT_ARRAY_BUFFER
            }
        },
        extensionsUsed : ['KHR_materials_common'],
        images : images,
        materials : materials,
        meshes : {
            mesh : {
                primitives : primitives
            }
        },
        nodes : {
            rootNode : {
                matrix : rootMatrix,
                meshes : ['mesh'],
                name : 'rootNode'
            }
        },
        samplers : samplers,
        scene : 'scene',
        scenes : {
            scene : {
                nodes : ['rootNode']
            }
        },
        textures : textures
    };

    var kmcOptions;
    if (khrMaterialsCommon) {
        kmcOptions = {
            technique : 'LAMBERT',
            doubleSided : false
        };
    }

    var gltfOptions = {
        optimizeForCesium : optimizeForCesium,
        kmcOptions : kmcOptions,
        preserve : true, // Don't apply extra optimizations to the glTF
        quantize : quantization,
        compressTextureCoordinates : quantization,
        encodeNormals : quantization,
        textureCompressionOptions : textureCompressionOptions
    };

    return loadImages(gltf)
        .then(function() {
            // Run through the gltf-pipeline to generate techniques and shaders for the glTF
            return processGltf(gltf, gltfOptions)
                .then(function(gltf) {
                    if (useBatchIds) {
                        modifyGltfWithBatchIds(gltf, mesh, deprecated);
                    }
                    if (relativeToCenter) {
                        modifyGltfWithRelativeToCenter(gltf, center);
                    }
                    if (optimizeForCesium) {
                        modifyGltfForCesium(gltf);
                    }
                    return convertToBinaryGltf(gltf);
                });
        });
}

function getLoadImageFunction(image) {
    return function() {
        var imagePath = image.uri;
        var extension = path.extname(imagePath);
        return fsExtra.readFile(imagePath)
            .then(function(buffer) {
                image.uri = 'data:' + mime.getType(extension) + ';base64,' + buffer.toString('base64');
            });
    };
}

function loadImages(gltf) {
    var imagePromises = [];
    var images = gltf.images;
    for (var id in images) {
        if (images.hasOwnProperty(id)) {
            var image = images[id];
            imagePromises.push(getLoadImageFunction(image)());
        }
    }
    return Promise.all(imagePromises);
}

function convertToBinaryGltf(gltf) {
    addPipelineExtras(gltf);
    return loadGltfUris(gltf)
        .then(function(gltf) {
            return getBinaryGltf(gltf, true, true).glb;
        });
}

function modifyGltfWithBatchIds(gltf, mesh, deprecated) {
    var i;
    var batchIds = mesh.batchIds;
    var batchIdsMinMax = getMinMax(batchIds, 1);
    var batchIdsLength = batchIds.length;
    var batchIdsBuffer = Buffer.alloc(batchIdsLength * sizeOfUint16);
    for (i = 0; i < batchIdsLength; ++i) {
        batchIdsBuffer.writeUInt16LE(batchIds[i], i * sizeOfUint16);
    }
    var batchIdsBufferUri = 'data:application/octet-stream;base64,' + batchIdsBuffer.toString('base64');
    var batchIdSemantic = deprecated ? 'BATCHID' : '_BATCHID';

    gltf.accessors.accessor_batchId = {
        bufferView : 'bufferView_batchId',
        byteOffset : 0,
        byteStride : 0,
        componentType : 5123, // UNSIGNED_SHORT
        count : batchIdsLength,
        type : 'SCALAR',
        min : batchIdsMinMax.min,
        max : batchIdsMinMax.max
    };

    gltf.bufferViews.bufferView_batchId = {
        buffer : 'buffer_batchId',
        byteLength : batchIdsBuffer.length,
        byteOffset : 0,
        target : 34962 // ARRAY_BUFFER
    };

    gltf.buffers.buffer_batchId = {
        byteLength : batchIdsBuffer.length,
        uri : batchIdsBufferUri
    };

    var meshes = gltf.meshes;
    for (var meshId in meshes) {
        if (meshes.hasOwnProperty(meshId)) {
            var primitives = meshes[meshId].primitives;
            var length = primitives.length;
            for (i = 0; i < length; ++i) {
                var primitive = primitives[i];
                primitive.attributes[batchIdSemantic] = 'accessor_batchId';
            }
        }
    }

    var programs = gltf.programs;
    for (var programId in programs) {
        if (programs.hasOwnProperty(programId)) {
            var program = programs[programId];
            program.attributes.push('a_batchId');
        }
    }

    var techniques = gltf.techniques;
    for (var techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            var technique = techniques[techniqueId];
            technique.attributes.a_batchId = 'batchId';
            technique.parameters.batchId = {
                semantic : batchIdSemantic,
                type : 5123 // UNSIGNED_SHORT
            };
        }
    }

    var shaders = gltf.shaders;
    for (var shaderId in shaders) {
        if (shaders.hasOwnProperty(shaderId)) {
            var shader = shaders[shaderId];
            if (shader.type === 35633) { // Is a vertex shader
                var uriHeader = 'data:text/plain;base64,';
                var shaderEncoded = shader.uri.substring(uriHeader.length);
                var shaderText = Buffer.from(shaderEncoded, 'base64');
                shaderText = 'attribute float a_batchId;\n' + shaderText;
                shaderEncoded = Buffer.from(shaderText).toString('base64');
                shader.uri = uriHeader + shaderEncoded;
            }
        }
    }
}

function modifyGltfWithRelativeToCenter(gltf, center) {
    gltf.extensionsUsed = defaultValue(gltf.extensionsUsed, []);
    gltf.extensions = defaultValue(gltf.extensions, {});

    gltf.extensionsUsed.push('CESIUM_RTC');
    gltf.extensions.CESIUM_RTC = {
        center : Cartesian3.pack(center, new Array(3))
    };

    var techniques = gltf.techniques;
    for (var techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            var technique = techniques[techniqueId];
            var parameters = technique.parameters;
            for (var parameterId in parameters) {
                if (parameters.hasOwnProperty(parameterId)) {
                    if (parameterId === 'modelViewMatrix') {
                        var parameter = parameters[parameterId];
                        parameter.semantic = 'CESIUM_RTC_MODELVIEW';
                    }
                }
            }
        }
    }
}

function modifyGltfForCesium(gltf) {
    // Add diffuse semantic to support colorBlendMode in Cesium
    var techniques = gltf.techniques;
    for (var techniqueId in techniques) {
        if (techniques.hasOwnProperty(techniqueId)) {
            var technique = techniques[techniqueId];
            technique.parameters.diffuse.semantic = '_3DTILESDIFFUSE';
        }
    }
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
