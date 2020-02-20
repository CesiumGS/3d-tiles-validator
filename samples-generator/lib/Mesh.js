'use strict';
var Cesium = require('cesium');
var Material = require('./Material');
var util = require('./utility');

var Cartesian3 = Cesium.Cartesian3;
var ComponentDatatype = Cesium.ComponentDatatype;
var defined = Cesium.defined;
var Matrix4 = Cesium.Matrix4;

var typeToNumberOfComponents = util.typeToNumberOfComponents;

module.exports = Mesh;

var sizeOfUint16 = 2;
var sizeOfFloat32 = 4;

var whiteOpaqueMaterial = new Material({
    baseColor : [1.0, 1.0, 1.0, 1.0]
});

/**
 * Stores the vertex attributes and indices describing a mesh.
 *
 * @param {Object} options Object with the following properties:
 * @param {Number[]} options.indices An array of integers representing the mesh indices.
 * @param {Number[]} options.positions A packed array of floats representing the mesh positions.
 * @param {Number[]} options.normals A packed array of floats representing the mesh normals.
 * @param {Number[]} options.uvs A packed array of floats representing the mesh UVs.
 * @param {Number[]} options.vertexColors A packed array of integers representing the vertex colors.
 * @param {Number[]} [options.batchIds] An array of integers representing the batch ids.
 * @param {Material} [options.material] A material to apply to the mesh.
 * @param {MeshView[]} [options.views] An array of MeshViews.
 *
 * @constructor
 */
function Mesh(options) {
    this.indices = options.indices;
    this.positions = options.positions;
    this.normals = options.normals;
    this.uvs = options.uvs;
    this.vertexColors = options.vertexColors;
    this.batchIds = options.batchIds;
    this.material = options.material;
    this.views = options.views;
}

/**
 * A subsection of the mesh with its own material.
 *
 * @param {Object} options Object with the following properties:
 * @param {Material} options.material The material.
 * @param {Number} options.indexOffset The start index into the mesh's indices array.
 * @param {Number} options.indexCount The number of indices.
 *
 * @constructor
 * @private
 */
function MeshView(options) {
    this.material = options.material;
    this.indexOffset = options.indexOffset;
    this.indexCount = options.indexCount;
}

var scratchCartesian = new Cartesian3();
var scratchMatrix = new Matrix4();

/**
 * Transform the mesh with the provided transform.
 *
 * @param {Matrix4} transform The transform.
 */
Mesh.prototype.transform = function(transform) {
    var i;
    var positions = this.positions;
    var normals = this.normals;
    var vertexCount = this.getVertexCount();

    // Transform positions
    for (i = 0; i < vertexCount; ++i) {
        var position = Cartesian3.unpack(positions, i * 3, scratchCartesian);
        Matrix4.multiplyByPoint(transform, position, position);
        Cartesian3.pack(position, positions, i * 3);
    }

    var inverseTranspose = scratchMatrix;
    Matrix4.transpose(transform, inverseTranspose);
    Matrix4.inverse(inverseTranspose, inverseTranspose);

    // Transform normals
    for (i = 0; i < vertexCount; ++i) {
        var normal = Cartesian3.unpack(normals, i * 3, scratchCartesian);
        Matrix4.multiplyByPointAsVector(inverseTranspose, normal, normal);
        Cartesian3.normalize(normal, normal);
        Cartesian3.pack(normal, normals, i * 3);
    }
};

/**
 * Get the number of vertices in the mesh.
 *
 * @returns {Number} The number of vertices.
 */
Mesh.prototype.getVertexCount = function() {
    return this.positions.length / 3;
};

/**
 * Get the center of the mesh.
 *
 * @returns {Cartesian3} The center position
 */
Mesh.prototype.getCenter = function() {
    var center = new Cartesian3();
    var positions = this.positions;
    var vertexCount = this.getVertexCount();
    for (var i = 0; i < vertexCount; ++i) {
        var position = Cartesian3.unpack(positions, i * 3, scratchCartesian);
        Cartesian3.add(position, center, center);
    }
    Cartesian3.divideByScalar(center, vertexCount, center);
    return center;
};

/**
 * Set the positions relative to center.
 */
Mesh.prototype.setPositionsRelativeToCenter = function() {
    var positions = this.positions;
    var center = this.getCenter();
    var vertexCount = this.getVertexCount();
    for (var i = 0; i < vertexCount; ++i) {
        var position = Cartesian3.unpack(positions, i * 3, scratchCartesian);
        Cartesian3.subtract(position, center, position);
        Cartesian3.pack(position, positions, i * 3);
    }
};

/**
 * Bake materials as vertex colors. Use the default white opaque material.
 */
Mesh.prototype.transferMaterialToVertexColors = function() {
    var material = this.material;
    this.material = whiteOpaqueMaterial;
    var vertexCount = this.getVertexCount();
    var vertexColors = new Array(vertexCount * 4);
    this.vertexColors = vertexColors;
    for (var i = 0; i < vertexCount; ++i) {
        vertexColors[i * 4 + 0] = Math.floor(material.baseColor[0] * 255);
        vertexColors[i * 4 + 1] = Math.floor(material.baseColor[1] * 255);
        vertexColors[i * 4 + 2] = Math.floor(material.baseColor[2] * 255);
        vertexColors[i * 4 + 3] = Math.floor(material.baseColor[3] * 255);
    }
};

/**
 * Batch multiple meshes into a single mesh. Assumes the input meshes do not already have batch ids.
 *
 * @param {Mesh[]} meshes The meshes that will be batched together.
 * @returns {Mesh} The batched mesh.
 */
Mesh.batch = function(meshes) {
    var batchedPositions = [];
    var batchedNormals = [];
    var batchedUvs = [];
    var batchedVertexColors = [];
    var batchedBatchIds = [];
    var batchedIndices = [];

    var startIndex = 0;
    var indexOffset = 0;
    var views = [];
    var currentView;
    var meshesLength = meshes.length;
    for (var i = 0; i < meshesLength; ++i) {
        var mesh = meshes[i];
        var positions = mesh.positions;
        var normals = mesh.normals;
        var uvs = mesh.uvs;
        var vertexColors = mesh.vertexColors;
        var vertexCount = mesh.getVertexCount();

        // Generate batch ids for this mesh
        var batchIds = new Array(vertexCount).fill(i);

        batchedPositions = batchedPositions.concat(positions);
        batchedNormals = batchedNormals.concat(normals);
        batchedUvs = batchedUvs.concat(uvs);
        batchedVertexColors = batchedVertexColors.concat(vertexColors);
        batchedBatchIds = batchedBatchIds.concat(batchIds);

        // Generate indices and mesh views
        var indices = mesh.indices;
        var indicesLength = indices.length;

        if (!defined(currentView) || (currentView.material !== mesh.material)) {
            currentView = new MeshView({
                material : mesh.material,
                indexOffset : indexOffset,
                indexCount : indicesLength
            });
            views.push(currentView);
        } else {
            currentView.indexCount += indicesLength;
        }

        for (var j = 0; j < indicesLength; ++j) {
            var index = indices[j] + startIndex;
            batchedIndices.push(index);
        }
        startIndex += vertexCount;
        indexOffset += indicesLength;
    }

    return new Mesh({
        indices : batchedIndices,
        positions : batchedPositions,
        normals : batchedNormals,
        uvs : batchedUvs,
        vertexColors : batchedVertexColors,
        batchIds : batchedBatchIds,
        views : views
    });
};

/**
 * Clone the mesh geometry and create a new mesh. Assumes the input mesh does not already have batch ids.
 *
 * @param {Mesh} mesh The mesh to clone.
 * @returns {Mesh} The cloned mesh.
 */
Mesh.clone = function(mesh) {
    return new Mesh({
        positions :  mesh.positions.slice(),
        normals : mesh.normals.slice(),
        uvs : mesh.uvs.slice(),
        vertexColors : mesh.vertexColors.slice(),
        indices : mesh.indices.slice(),
        material : mesh.material
    });
};

/**
 * Creates a cube mesh.
 *
 * @returns {Mesh} A cube mesh.
 */
Mesh.createCube = function() {
    var indices = [0, 1, 2, 0, 2, 3, 6, 5, 4, 7, 6, 4, 8, 9, 10, 8, 10, 11, 14, 13, 12, 15, 14, 12, 18, 17, 16, 19, 18, 16, 20, 21, 22, 20, 22, 23];
    var positions = [-0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5];
    var normals = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0];
    var uvs = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
    var vertexColors = new Array(24 * 4).fill(0);
    return new Mesh({
        indices : indices,
        positions : positions,
        normals : normals,
        uvs : uvs,
        vertexColors : vertexColors
    });
};

function bufferToUint16Array(buffer, byteOffset, length) {
    var uint16Array = new Uint16Array(length);
    for (var i = 0; i < length; ++i) {
        uint16Array[i] = buffer.readUInt16LE(byteOffset + i * sizeOfUint16);
    }
    return uint16Array;
}

function bufferToFloat32Array(buffer, byteOffset, length) {
    var float32Array = new Float32Array(length);
    for (var i = 0; i < length; ++i) {
        float32Array[i] = buffer.readFloatLE(byteOffset + i * sizeOfFloat32);
    }
    return float32Array;
}

function getAccessor(gltf, accessor) {
    var bufferView = gltf.bufferViews[accessor.bufferView];
    var buffer = gltf.buffers[bufferView.buffer];
    var byteOffset = accessor.byteOffset + bufferView.byteOffset;
    var length = accessor.count * typeToNumberOfComponents(accessor.type);
    var uriHeader = 'data:application/octet-stream;base64,';
    var base64 = buffer.uri.substring(uriHeader.length);
    var data = Buffer.from(base64, 'base64');
    var typedArray;
    if (accessor.componentType === ComponentDatatype.UNSIGNED_SHORT) {
        typedArray = bufferToUint16Array(data, byteOffset, length);
    } else if (accessor.componentType === ComponentDatatype.FLOAT) {
        typedArray = bufferToFloat32Array(data, byteOffset, length);
    }
    return Array.prototype.slice.call(typedArray);
}

/**
 * Creates a mesh from a glTF. This utility is designed only for simple glTFs like those in the data folder.
 *
 * @param {Object} gltf The glTF.
 * @returns {Mesh} The mesh.
 */
Mesh.fromGltf = function(gltf) {
    var gltfPrimitive = gltf.meshes[0].primitives[0];
    var gltfMaterial = gltf.materials[gltfPrimitive.material];
    var material = Material.fromGltf(gltfMaterial);
    var indices = getAccessor(gltf, gltf.accessors[gltfPrimitive.indices]);
    var positions = getAccessor(gltf, gltf.accessors[gltfPrimitive.attributes.POSITION]);
    var normals = getAccessor(gltf, gltf.accessors[gltfPrimitive.attributes.NORMAL]);
    var uvs = new Array(positions.length / 3 * 2).fill(0);
    var vertexColors = new Array(positions.length / 3 * 4).fill(0);
    return new Mesh({
        indices : indices,
        positions : positions,
        normals : normals,
        uvs : uvs,
        vertexColors : vertexColors,
        material : material
    });
};
