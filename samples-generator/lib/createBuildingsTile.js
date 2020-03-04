'use strict';
var Cesium = require('cesium');
var createB3dm = require('./createB3dm');
var createBatchTableExtension = require('./createBatchTableExtension');
var createBuildings = require('./createBuildings');
var path = require('path');
var Promise = require('bluebird');
var createGltf = require('./createGltf');
var gltfPipeline = require('gltf-pipeline');
var gltfToGlb = gltfPipeline.gltfToGlb;
var gltfConversionOptions = { resourceDirectory: path.join(__dirname, '../')};
var Mesh = require('./Mesh');

var Cartesian3 = Cesium.Cartesian3;
var combine = Cesium.combine;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var Matrix4 = Cesium.Matrix4;

module.exports = createBuildingsTile;

var sizeOfUint8 = 1;
var sizeOfFloat = 4;

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
 *                      OR a promise that resolves with a glTF
 */
function createBuildingsTile(options) {
    var buildings = createBuildings(options.buildingOptions);
    var useBatchIds = defaultValue(options.useBatchIds, true);
    var createBatchTable = defaultValue(options.createBatchTable, true) && useBatchIds;
    var createBatchTableExtra = defaultValue(options.createBatchTableExtra, false) && useBatchIds;
    var createBatchTableBinary = defaultValue(options.createBatchTableBinary, false) && useBatchIds;
    var tileTransform = defaultValue(options.transform, Matrix4.IDENTITY);
    var use3dTilesNext = defaultValue(options.use3dTilesNext, false);
    var useGlb = defaultValue(options.useGlb, false);

    var relativeToCenter = options.relativeToCenter;
    var rtcCenterPosition = options.rtcCenterPosition;
    var useVertexColors = options.useVertexColors;
    var deprecated1 = options.deprecated1;
    var deprecated2 = options.deprecated2;
    var buildingsLength = buildings.length;
    var batchLength = (useBatchIds) ? buildingsLength : 0;

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
            batchTableJsonAndBinary = (use3dTilesNext) ? generateBatchTableBinary3dTilesNext(buildings) : generateBatchTableBinary(buildings);
            batchTableBinary = batchTableJsonAndBinary.binary;
            batchTableJson = combine(batchTableJson, batchTableJsonAndBinary.json);
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
        use3dTilesNext : use3dTilesNext,
        featureTableJson : featureTableJson
    };

    var gltf = createGltf(gltfOptions);

    var b3dmOptions = {
        featureTableJson : featureTableJson,
        batchTableJson : batchTableJson,
        batchTableBinary : batchTableBinary,
        batchTableJsonAndBinary : batchTableJsonAndBinary,
        deprecated1 : deprecated1,
        deprecated2 : deprecated2,
    };

    var binary = defined(b3dmOptions.batchTableBinary) ? b3dmOptions.batchTableJsonAndBinary.binary : undefined;

    // Don't add the batch table extension if there is no batchTableJson (e.g in the case of `createBatchedWithoutBatchTable`)
    if (use3dTilesNext && defined(b3dmOptions.batchTableJson)) {
        gltf = createBatchTableExtension(gltf, b3dmOptions.batchTableJson, binary);
    }

    if (use3dTilesNext && !useGlb) {
        return Promise.resolve({
            gltf : gltf,
            batchTableJson : batchTableJson
        });
    }

    if (use3dTilesNext) {
        return gltfToGlb(gltf, gltfConversionOptions).then(function(glb) {
            return Promise.resolve({
                glb : glb,
                batchTableJson : batchTableJson
            });
        });
    }

    return gltfToGlb(gltf, gltfConversionOptions).then(function(glb) {
        b3dmOptions.glb = glb.glb;
        return Promise.resolve({
            b3dm : createB3dm(b3dmOptions),
            batchTableJson : batchTableJson
        });
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
    var cartographicBuffer = Buffer.alloc(buildingsLength * 3 * sizeOfFloat);
    var codeBuffer = Buffer.alloc(buildingsLength * sizeOfUint8);

    var batchTableJson = {
        cartographic : {
            byteOffset : 0,
            componentType : 'DOUBLE',
            type : 'VEC3'
        },
        code : {
            byteOffset : cartographicBuffer.length,
            componentType : 'UNSIGNED_BYTE',
            type : 'SCALAR'
        }
    };

    for (var i = 0; i < buildingsLength; ++i) {
        var building = buildings[i];
        var code = Math.max(i, 255);
        cartographicBuffer.writeFloatLE(building.longitude, (i * 3) * sizeOfFloat);
        cartographicBuffer.writeFloatLE(building.latitude, (i * 3 + 1) * sizeOfFloat);
        cartographicBuffer.writeFloatLE(building.height, (i * 3 + 2) * sizeOfFloat);
        codeBuffer.writeUInt8(code, i);
    }

    // No need for padding with these sample properties
    var batchTableBinary = Buffer.concat([cartographicBuffer, codeBuffer]);

    return {
        json : batchTableJson,
        binary : batchTableBinary
    };
}

function generateBatchTableBinary3dTilesNext(buildings) {
    var buildingsLength = buildings.length;
    var cartographicBuffer = Buffer.alloc(buildingsLength * 3 * sizeOfFloat);
    var codeBuffer = Buffer.alloc(buildingsLength * sizeOfUint8);

    var batchTableJson = {
        cartographic : {
            name : 'cartographic',
            byteOffset : 0,
            byteLength : cartographicBuffer.length,
            componentType : 0x1406, // FLOAT
            type : 'VEC3',
            count : buildingsLength
        },

        code : {
            name: 'code',
            byteOffset : cartographicBuffer.length,
            count: codeBuffer.length,
            byteLength: codeBuffer.length,
            componentType : 0x1401, // UNSIGNED_BYTE
            type : 'SCALAR'
        }
    };

    for (var i = 0; i < buildingsLength; ++i) {
        var building = buildings[i];
        var code = Math.max(i, 255);
        cartographicBuffer.writeFloatLE(building.longitude, (i * 3) * sizeOfFloat);
        cartographicBuffer.writeFloatLE(building.latitude, (i * 3 + 1) * sizeOfFloat);
        cartographicBuffer.writeFloatLE(building.height, (i * 3 + 2) * sizeOfFloat);
        codeBuffer.writeUInt8(code, i);
    }

    // No need for padding with these sample properties
    var batchTableBinary = Buffer.concat([cartographicBuffer, codeBuffer]);

    return {
        json : batchTableJson,
        binary : batchTableBinary
    };
}
