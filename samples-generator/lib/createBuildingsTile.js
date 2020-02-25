'use strict';
var Cesium = require('cesium');
var b3dm = require('./createB3dm');
var createBuildings = require('./createBuildings');
var createGltf = require('./createGltf');
var Mesh = require('./Mesh');

var Cartesian3 = Cesium.Cartesian3;
var combine = Cesium.combine;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var Matrix4 = Cesium.Matrix4;

module.exports = createBuildingsTile;

var sizeOfUint8 = 1;
var sizeOfDouble = 8;

var scratchMatrix = new Matrix4();
var batchTableJsonAndBinary;

/**
 * Creates a b3dm tile that represents a set of buildings.
 *
 * @param {Object} options Object with the following properties:
 * @param {Object} options.buildingOptions Options used to create the buildings.
 * @param {Boolean} [options.useBatchIds=true] Modify the glTF to include the batchId vertex attribute.
 * @param {Boolean} [options.createBatchTable=true] Create a batch table for the b3dm tile.
 * @param {Boolean} [options.createBatchTableExtra=false] Add additional test properties to the batch table.
 * @param {Boolean} [options.createBatchTableBinary=false] Create a batch table binary for the b3dm tile.
 * @param {Matrix4} [options.transform=Matrix4.IDENTITY] A transform to bake into the tile, for example a transform into WGS84.
 * @param {Boolean} [options.relativeToCenter=false] Set mesh positions relative to center.
 * @param {Number[]} [options.rtcCenterPosition] If defined, sets RTC_CENTER attribute in the feature table.
 * @param {Boolean} [options.useVertexColors=false] Bake materials as vertex colors.
 * @param {Boolean} [options.deprecated1=false] Save the b3dm with the deprecated 20-byte header and the glTF with the BATCHID semantic.
 * @param {Boolean} [options.deprecated2=false] Save the b3dm with the deprecated 24-byte header and the glTF with the BATCHID semantic.
 *
 * @returns {Promise} A promise that resolves with the b3dm buffer and batch table JSON.
 */
function createBuildingsTile(options) {
    var buildings = createBuildings(options.buildingOptions);
    var useBatchIds = defaultValue(options.useBatchIds, true);
    var createBatchTable = defaultValue(options.createBatchTable, true) && useBatchIds;
    var createBatchTableExtra = defaultValue(options.createBatchTableExtra, false) && useBatchIds;
    var createBatchTableBinary = defaultValue(options.createBatchTableBinary, false) && useBatchIds;
    var tileTransform = defaultValue(options.transform, Matrix4.IDENTITY);
    var useGltf = defaultValue(options.useGltf, false);
    var useGlb = defaultValue(options.useGlb, false);

    var relativeToCenter = options.relativeToCenter;
    var rtcCenterPosition = options.rtcCenterPosition;
    var useVertexColors = options.useVertexColors;
    var deprecated1 = options.deprecated1;
    var deprecated2 = options.deprecated2;
    var buildingsLength = buildings.length;
    var batchLength = useBatchIds ? buildingsLength : 0;

    var meshes = new Array(buildingsLength);
    for (var i = 0; i < buildingsLength; ++i) {
        var building = buildings[i];
        var transform = Matrix4.multiply(tileTransform, building.matrix, scratchMatrix);
        var mesh = Mesh.createCube();
        mesh.transform(transform);
        mesh.material = building.material;
        if (useVertexColors) {
            mesh.transferMaterialToVertexColors();
        }
        meshes[i] = mesh;
    }

    var batchedMesh = Mesh.batch(meshes);

    var batchTableJson;
    var batchTableBinary;
    if (createBatchTable) {
        batchTableJson = generateBatchTable(buildings);
        if (createBatchTableExtra) {
            var batchTableExtra = generateBatchTableExtra(buildings);
            batchTableJson = combine(batchTableJson, batchTableExtra);
        }
        if (createBatchTableBinary) {
            batchTableJsonAndBinary = generateBatchTableBinary(buildings);
            batchTableJson = combine(batchTableJson, batchTableJsonAndBinary.json);
            batchTableBinary = batchTableJsonAndBinary.binary;
        }
    }

    var featureTableJson = {
        BATCH_LENGTH : batchLength
    };

    if (defined(rtcCenterPosition)) {
        featureTableJson.RTC_CENTER = rtcCenterPosition;
    } else if (relativeToCenter) {
        featureTableJson.RTC_CENTER = Cartesian3.pack(batchedMesh.getCenter(), new Array(3));
    }

    var gltfOptions = {
        mesh : batchedMesh,
        useBatchIds : useBatchIds,
        relativeToCenter : relativeToCenter,
        deprecated : deprecated1 || deprecated2,
        useGltf : useGltf,
        useGlb : useGlb
    };

    return createGltf(gltfOptions).then(function(glbOrGltf) {
        var b3dmOptions = {
            glbOrGltf : glbOrGltf,
            featureTableJson : featureTableJson,
            batchTableJson : batchTableJson,
            batchTableBinary : batchTableBinary,
            deprecated1 : deprecated1,
            deprecated2 : deprecated2
        };

        // TODO: If gltfOptions.useGlb, create a gltf and then convert to glb
        if (gltfOptions.useGltf) {
            return b3dm.createB3dmGltf(glbOrGltf, b3dmOptions, batchTableJsonAndBinary);
        }

        else if (gltfOptions.useGlb) {
            throw new Error({message: 'Not implemented.'});
        }

        return {
            b3dm : b3dm.createB3dm(b3dmOptions),
            batchTableJson : batchTableJson
        };
    });
}

function generateBatchTable(buildings) {
    var buildingsLength = buildings.length;
    var batchTable = {
        id : new Array(buildingsLength),
        Longitude : new Array(buildingsLength),
        Latitude : new Array(buildingsLength),
        Height : new Array(buildingsLength)
    };

    for (var i = 0; i < buildingsLength; ++i) {
        var building = buildings[i];
        batchTable.id[i] = i;
        batchTable.Longitude[i] = building.longitude;
        batchTable.Latitude[i] = building.latitude;
        batchTable.Height[i] = building.height;
    }

    return batchTable;
}

function generateBatchTableExtra(buildings) {
    var buildingsLength = buildings.length;
    var batchTable = {
        info : new Array(buildingsLength),
        rooms : new Array(buildingsLength)
    };

    for (var i = 0; i < buildingsLength; ++i) {
        batchTable.info[i] = {
            name : 'building' + i,
            year : i
        };
        batchTable.rooms[i] = [
            'room' + i + '_a',
            'room' + i + '_b',
            'room' + i + '_c'
        ];
    }

    return batchTable;
}

function generateBatchTableBinary(buildings) {
    var buildingsLength = buildings.length;
    var cartographicBuffer = Buffer.alloc(buildingsLength * 3 * sizeOfDouble);
    var codeBuffer = Buffer.alloc(buildingsLength * sizeOfUint8);

    var batchTableJson = {
        cartographic : {
            name : 'CartographicBuffer',
            byteOffset : 0,
            byteLength : cartographicBuffer.length,
            componentType : 0x1406, // TODO: Logical error, not sure what to do, 'DOUBLE' was here originally but GLTF only supports Floats
            type : 'VEC3',
            count : buildingsLength
        },

        code : {
            name: 'Code',
            byteOffset : cartographicBuffer.length,
            count: codeBuffer.length,
            byteLength: codeBuffer.length,
            componentType : 0x1401,
            type : 'SCALAR'
        }
    };

    for (var i = 0; i < buildingsLength; ++i) {
        var building = buildings[i];
        var code = Math.max(i, 255);
        cartographicBuffer.writeDoubleLE(building.longitude, (i * 3) * sizeOfDouble);
        cartographicBuffer.writeDoubleLE(building.latitude, (i * 3 + 1) * sizeOfDouble);
        cartographicBuffer.writeDoubleLE(building.height, (i * 3 + 2) * sizeOfDouble);
        codeBuffer.writeUInt8(code, i);
    }

    // No need for padding with these sample properties
    var batchTableBinary = Buffer.concat([cartographicBuffer, codeBuffer]);

    return {
        json : batchTableJson,
        binary : batchTableBinary
    };
}
