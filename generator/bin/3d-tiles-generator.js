#!/usr/bin/env node
'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var createBuildingsTile = require('../lib/createBuildingsTile');
var createB3dm = require('../lib/createB3dm');
var createCmpt = require('../lib/createCmpt');
var createInstancesTile = require('../lib/createInstancesTile');
var createPointCloudTile = require('../lib/createPointCloudTile');
var createTilesetJsonSingle = require('../lib/createTilesetJsonSingle');
var getProperties = require('../lib/getProperties');
var saveTile = require('../lib/saveTile');
var saveTilesetJson = require('../lib/saveTilesetJson');
var util = require('../lib/util');

var fsExtraCopy = Promise.promisify(fsExtra.copy);
var fsExtraReadFile = Promise.promisify(fsExtra.readFile);

var clone = Cesium.clone;
var defaultValue = Cesium.defaultValue;
var defined  = Cesium.defined;
var Matrix4 = Cesium.Matrix4;

var lowercase = util.lowercase;
var metersToLongitude = util.metersToLongitude;
var metersToLatitude = util.metersToLatitude;
var wgs84Transform = util.wgs84Transform;

var optimizeForCesium = true;
var relativeToCenter = true;
var prettyJson = true;
var gzip = false;

var outputDirectory = 'output';

var longitude = -1.31968;
var latitude = 0.698874;
var tileWidth = 200.0;

var longitudeExtent = metersToLongitude(tileWidth, latitude);
var latitudeExtent = metersToLatitude(tileWidth);

var west = longitude - longitudeExtent / 2.0;
var south = latitude - latitudeExtent / 2.0;
var east = longitude + longitudeExtent / 2.0;
var north = latitude + latitudeExtent / 2.0;

var buildingsTransform = wgs84Transform(longitude, latitude, 0.0);
var buildingsCenter = [buildingsTransform[12], buildingsTransform[13], buildingsTransform[14]];

var buildingTemplate = {
    numberOfBuildings : 10,
    tileWidth : tileWidth,
    averageWidth : 8.0,
    averageHeight : 10.0,
    diffuseType : 'white',
    translucencyType : 'opaque',
    longitude : longitude,
    latitude : latitude
};

// Small buildings
var smallGeometricError = 70.0; // Estimated
var smallHeight = 20.0; // Estimated
var smallRegion = [west, south, east, north, 0.0, smallHeight];
var smallRadius = tileWidth * 0.707107;
var smallSphere = [buildingsCenter[0], buildingsCenter[1], buildingsCenter[2] + smallHeight / 2.0, smallRadius];
var smallSphereLocal = [0.0, 0.0, smallHeight / 2.0, smallRadius];
var smallBoxLocal = [
    0.0, 0.0, smallHeight / 2.0, // center
    tileWidth, 0.0, 0.0,         // width
    0.0,tileWidth, 0.0,          // depth
    0.0, 0.0, smallHeight        // height
];

// Large buildings
var largeGeometricError = 240.0; // Estimated
var largeHeight = 88.0; // Estimated

// Point cloud
var pointsLength = 1000;
var pointCloudTileWidth = 10.0;
var pointCloudRadius = pointCloudTileWidth / 2.0;
var pointCloudTransform = wgs84Transform(longitude, latitude, pointCloudRadius);
var pointCloudGeometricError = 1.732 * pointCloudTileWidth; // Diagonal of the point cloud box
var pointCloudCenter = [pointCloudTransform[12], pointCloudTransform[13], pointCloudTransform[14]];
var pointCloudSphere = [pointCloudCenter[0], pointCloudCenter[1], pointCloudCenter[2], pointCloudRadius];
var pointCloudSphereLocal = [0.0, 0.0, pointCloudRadius, pointCloudRadius];

// Instances
var instancesLength = 25;
var instancesTileWidth = tileWidth;
var instancesUrl = 'data/box.glb';
var instancesModelSize = 20.0;
var instancesTransform = wgs84Transform(longitude, latitude, instancesModelSize / 2.0);
var instancesRegion = [west, south, east, north, 0.0, instancesModelSize];
var instancesGeometricError = 70.0; // Estimated

// Composite
var compositeRegion = instancesRegion;
var compositeGeometricError = instancesGeometricError;

var promises = [
    // Batched
    createBatchedWithBatchTable(),
    createBatchedWithoutBatchTable(),
    createBatchedWithBatchTableBinary(),
    createBatchedTranslucent(),
    createBatchedTranslucentOpaqueMix(),
    createBatchedColors(),
    createBatchedColorsTranslucent(),
    createBatchedColorsMix(),
    createBatchedTextured(),
    createBatchedWithBoundingSphere(),
    createBatchedWithTransformBox(),
    createBatchedWithTransformSphere(),
    createBatchedWithTransformRegion(),
    createBatchedNoBuildings(),
    createBatchedWithKHRMaterialsCommon(),
    createBatchedWithQuantization(),
    // Point Cloud
    createPointCloudRGB(),
    createPointCloudRGBA(),
    createPointCloudRGB565(),
    createPointCloudConstantColor(),
    createPointCloudNoColor(),
    createPointCloudWGS84(),
    createPointCloudQuantized(),
    createPointCloudNormals(),
    createPointCloudNormalsOctEncoded(),
    createPointCloudQuantizedOctEncoded(),
    createPointCloudBatched(),
    createPointCloudWithPerPointProperties(),
    createPointCloudWithTransform(),
    // Instanced
    createInstancedWithBatchTable(),
    createInstancedWithoutBatchTable(),
    createInstancedWithBatchTableBinary(),
    createInstancedGltfExternal(),
    createInstancedOrientation(),
    createInstancedOct32POrientation(),
    createInstancedQuantizedOct32POrientation(),
    createInstancedQuantized(),
    createInstancedScaleNonUniform(),
    createInstancedScale(),
    createInstancedWithTransform(),
    // Composite
    createComposite(),
    createCompositeOfComposite(),
    // Tilesets
    createCityTileset(),
    createDiscreteLOD(),
    createTreeBillboards()
];

Promise.all(promises)
    .then(function() {
        console.log('Done');
    });

function createBatchedWithBatchTable() {
    var tileOptions = {
        createBatchTable : true,
        createBatchTableExtra : true
    };
    return saveBatchedTileset('BatchedWithBatchTable', tileOptions);
}

function createBatchedWithoutBatchTable() {
    var tileOptions = {
        createBatchTable : false
    };
    return saveBatchedTileset('BatchedWithoutBatchTable', tileOptions);
}

function createBatchedWithBatchTableBinary() {
    var tileOptions = {
        createBatchTable : true,
        createBatchTableBinary : true
    };
    return saveBatchedTileset('BatchedWithBatchTableBinary', tileOptions);
}

function createBatchedTranslucent() {
    var buildingOptions = clone(buildingTemplate);
    buildingOptions.translucencyType = 'translucent';
    var tileOptions = {
        buildingOptions : buildingOptions
    };
    return saveBatchedTileset('BatchedTranslucent', tileOptions);
}

function createBatchedTranslucentOpaqueMix() {
    var buildingOptions = clone(buildingTemplate);
    buildingOptions.translucencyType = 'mix';
    var tileOptions = {
        buildingOptions : buildingOptions
    };
    return saveBatchedTileset('BatchedTranslucentOpaqueMix', tileOptions);
}

function createBatchedTextured() {
    var buildingOptions = clone(buildingTemplate);
    buildingOptions.diffuseType = 'textured';
    var tileOptions = {
        buildingOptions : buildingOptions
    };
    return saveBatchedTileset('BatchedTextured', tileOptions);
}

function createBatchedColors() {
    var buildingOptions = clone(buildingTemplate);
    buildingOptions.diffuseType = 'color';
    var tileOptions = {
        buildingOptions : buildingOptions
    };
    return saveBatchedTileset('BatchedColors', tileOptions);
}

function createBatchedColorsTranslucent() {
    var buildingOptions = clone(buildingTemplate);
    buildingOptions.diffuseType = 'color';
    buildingOptions.translucencyType = 'translucent';
    var tileOptions = {
        buildingOptions : buildingOptions
    };
    return saveBatchedTileset('BatchedColorsTranslucent', tileOptions);
}

function createBatchedColorsMix() {
    var buildingOptions = clone(buildingTemplate);
    buildingOptions.diffuseType = 'color';
    buildingOptions.translucencyType = 'mix';
    var tileOptions = {
        buildingOptions : buildingOptions
    };
    return saveBatchedTileset('BatchedColorsMix', tileOptions);
}

function createBatchedWithBoundingSphere() {
    var tilesetOptions = {
        sphere : smallSphere
    };
    return saveBatchedTileset('BatchedWithBoundingSphere', undefined, tilesetOptions);
}

function createBatchedWithTransformBox() {
    var tileOptions = {
        transform : Matrix4.IDENTITY,
        relativeToCenter : false
    };
    var tilesetOptions = {
        box : smallBoxLocal,
        transform : buildingsTransform
    };
    return saveBatchedTileset('BatchedWithTransformBox', tileOptions, tilesetOptions);
}

function createBatchedWithTransformSphere() {
    var tileOptions = {
        transform : Matrix4.IDENTITY,
        relativeToCenter : false
    };
    var tilesetOptions = {
        sphere : smallSphereLocal,
        transform : buildingsTransform
    };
    return saveBatchedTileset('BatchedWithTransformSphere', tileOptions, tilesetOptions);
}

function createBatchedWithTransformRegion() {
    var tileOptions = {
        transform : Matrix4.IDENTITY,
        relativeToCenter : false
    };
    var tilesetOptions = {
        region : smallRegion,
        transform : buildingsTransform
    };
    return saveBatchedTileset('BatchedWithTransformRegion', tileOptions, tilesetOptions);
}

function createBatchedNoBuildings() {
    var tileOptions = {
        useBatchIds : false
    };
    return saveBatchedTileset('BatchedNoBuildings', tileOptions);
}

function createBatchedWithKHRMaterialsCommon() {
    var tileOptions = {
        khrMaterialsCommon : true
    };
    return saveBatchedTileset('BatchedWithKHRMaterialsCommon', tileOptions);
}

function createBatchedWithQuantization() {
    var tileOptions = {
        quantization : true
    };
    return saveBatchedTileset('BatchedWithQuantization', tileOptions);
}

function createPointCloudRGB() {
    var tileOptions = {
        colorMode : 'rgb'
    };
    return savePointCloudTileset('PointCloudRGB', tileOptions);
}

function createPointCloudRGBA() {
    var tileOptions = {
        colorMode : 'rgba'
    };
    return savePointCloudTileset('PointCloudRGBA', tileOptions);
}

function createPointCloudRGB565() {
    var tileOptions = {
        colorMode : 'rgb565'
    };
    return savePointCloudTileset('PointCloudRGB565', tileOptions);
}

function createPointCloudConstantColor() {
    var tileOptions = {
        colorMode : 'constant'
    };
    return savePointCloudTileset('PointCloudConstantColor', tileOptions);
}

function createPointCloudNoColor() {
    var tileOptions = {
        colorMode : 'none'
    };
    return savePointCloudTileset('PointCloudNoColor', tileOptions);
}

function createPointCloudWGS84() {
    // Only for testing - positions are defined directly in WGS84 causing visual artifacts due to lack of precision.
    var tileOptions = {
        relativeToCenter : false
    };
    return savePointCloudTileset('PointCloudWGS84', tileOptions);
}

function createPointCloudQuantized() {
    var tileOptions = {
        quantizePositions : true
    };
    return savePointCloudTileset('PointCloudQuantized', tileOptions);
}

function createPointCloudNormals() {
    var tileOptions = {
        generateNormals : true,
        shape : 'sphere'
    };
    return savePointCloudTileset('PointCloudNormals', tileOptions);
}

function createPointCloudNormalsOctEncoded() {
    var tileOptions = {
        generateNormals : true,
        octEncodeNormals : true,
        shape : 'sphere'
    };
    return savePointCloudTileset('PointCloudNormalsOctEncoded', tileOptions);
}

function createPointCloudQuantizedOctEncoded() {
    var tileOptions = {
        quantizePositions : true,
        generateNormals : true,
        octEncodeNormals : true,
        shape : 'sphere'
    };
    return savePointCloudTileset('PointCloudQuantizedOctEncoded', tileOptions);
}

function createPointCloudBatched() {
    var tileOptions = {
        batched : true,
        colorMode : 'none'
    };
    return savePointCloudTileset('PointCloudBatched', tileOptions);
}

function createPointCloudWithPerPointProperties() {
    var tileOptions = {
        perPointProperties : true
    };
    return savePointCloudTileset('PointCloudWithPerPointProperties', tileOptions);
}

function createPointCloudWithTransform() {
    var tileOptions = {
        transform : Matrix4.IDENTITY
    };
    var tilesetOptions = {
        transform : pointCloudTransform,
        sphere : pointCloudSphereLocal
    };
    return savePointCloudTileset('PointCloudWithTransform', tileOptions, tilesetOptions);
}

function createInstancedWithBatchTable() {
    var tileOptions = {
        createBatchTable : true
    };
    return saveInstancedTileset('InstancedWithBatchTable', tileOptions);
}

function createInstancedWithoutBatchTable() {
    var tileOptions = {
        createBatchTable : false
    };
    return saveInstancedTileset('InstancedWithoutBatchTable', tileOptions);
}

function createInstancedWithBatchTableBinary() {
    var tileOptions = {
        createBatchTable : true,
        createBatchTableBinary : true
    };
    return saveInstancedTileset('InstancedWithBatchTableBinary', tileOptions);
}

function createInstancedGltfExternal() {
    var tileOptions = {
        embed : false
    };
    return saveInstancedTileset('InstancedGltfExternal', tileOptions);
}

function createInstancedOrientation() {
    var tileOptions = {
        orientations : true
    };
    return saveInstancedTileset('InstancedOrientation', tileOptions);
}

function createInstancedOct32POrientation() {
    var tileOptions = {
        orientations : true,
        octEncodeOrientations : true
    };
    return saveInstancedTileset('InstancedOct32POrientation', tileOptions);
}

function createInstancedQuantized() {
    var tileOptions = {
        quantizePositions : true
    };
    return saveInstancedTileset('InstancedQuantized', tileOptions);
}

function createInstancedQuantizedOct32POrientation() {
    var tileOptions = {
        quantizePositions : true,
        orientations : true,
        octEncodeOrientations : true
    };
    return saveInstancedTileset('InstancedQuantizedOct32POrientation', tileOptions);
}

function createInstancedScaleNonUniform() {
    var tileOptions = {
        nonUniformScales : true
    };
    return saveInstancedTileset('InstancedScaleNonUniform', tileOptions);
}

function createInstancedScale() {
    var tileOptions = {
        uniformScales : true
    };
    return saveInstancedTileset('InstancedScale', tileOptions);
}

function createInstancedWithTransform() {
    var tileOptions = {
        transform : Matrix4.IDENTITY,
        eastNorthUp : false
    };
    var tilesetOptions = {
        transform : instancesTransform
    };
    return saveInstancedTileset('InstancedWithTransform', tileOptions, tilesetOptions);
}

function createComposite() {
    var i3dmOptions = {
        url : instancesUrl,
        tileWidth : instancesTileWidth,
        transform : instancesTransform,
        instancesLength : instancesLength,
        modelSize : instancesModelSize
    };

    var b3dmOptions = {
        buildingOptions : buildingTemplate,
        transform : buildingsTransform,
        optimizeForCesium : optimizeForCesium,
        relativeToCenter : relativeToCenter
    };

    return Promise.all([
        createBuildingsTile(b3dmOptions),
        createInstancesTile(i3dmOptions)
    ]).then(function(results) {
        var b3dm = results[0].b3dm;
        var i3dm = results[1].i3dm;
        var b3dmBatchTable = results[0].batchTableJson;
        var i3dmBatchTable = results[1].batchTableJson;
        return saveCompositeTileset('Composite', [b3dm, i3dm], [b3dmBatchTable, i3dmBatchTable]);
    });
}

function createCompositeOfComposite() {
    var i3dmOptions = {
        url : instancesUrl,
        tileWidth : instancesTileWidth,
        transform : instancesTransform,
        instancesLength : instancesLength,
        modelSize : instancesModelSize
    };

    var b3dmOptions = {
        buildingOptions : buildingTemplate,
        transform : buildingsTransform,
        optimizeForCesium : optimizeForCesium,
        relativeToCenter : relativeToCenter
    };

    return Promise.all([
        createBuildingsTile(b3dmOptions),
        createInstancesTile(i3dmOptions)
    ]).then(function(results) {
        var b3dm = results[0].b3dm;
        var i3dm = results[1].i3dm;
        var b3dmBatchTable = results[0].batchTableJson;
        var i3dmBatchTable = results[1].batchTableJson;
        var cmpt = createCmpt([b3dm, i3dm]);
        return saveCompositeTileset('CompositeOfComposite', [cmpt], [b3dmBatchTable, i3dmBatchTable]);
    });
}

function saveCompositeTileset(tilesetName, tiles, batchTables, tilesetOptions) {
    var tilesetDirectory = path.join(outputDirectory, 'Composite', tilesetName);
    var tileName = lowercase(tilesetName) + '.cmpt';
    var tilePath = path.join(tilesetDirectory, tileName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');

    tilesetOptions = defaultValue(tilesetOptions, {});
    tilesetOptions.tileName = tileName;
    tilesetOptions.geometricError = compositeGeometricError;
    if (!defined(tilesetOptions.region) && !defined(tilesetOptions.sphere) && !defined(tilesetOptions.box)) {
        tilesetOptions.region = compositeRegion;
    }

    var cmpt = createCmpt(tiles);

    tilesetOptions.properties = getProperties(batchTables);
    var tilesetJson = createTilesetJsonSingle(tilesetOptions);

    return Promise.all([
        saveTilesetJson(tilesetPath, tilesetJson, prettyJson),
        saveTile(tilePath, cmpt, gzip)
    ]);
}

function saveInstancedTileset(tilesetName, tileOptions, tilesetOptions) {
    var tilesetDirectory = path.join(outputDirectory, 'Instanced', tilesetName);
    var tileName = lowercase(tilesetName) + '.i3dm';
    var tilePath = path.join(tilesetDirectory, tileName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');

    tileOptions = defaultValue(tileOptions, {});
    tileOptions.url = defaultValue(tileOptions.url, instancesUrl);
    tileOptions.tileWidth = instancesTileWidth;
    tileOptions.transform = defaultValue(tileOptions.transform, instancesTransform);
    tileOptions.instancesLength = instancesLength;
    tileOptions.modelSize = instancesModelSize;

    tilesetOptions = defaultValue(tilesetOptions, {});
    tilesetOptions.tileName = tileName;
    tilesetOptions.geometricError = instancesGeometricError;
    if (!defined(tilesetOptions.region) && !defined(tilesetOptions.sphere) && !defined(tilesetOptions.box)) {
        tilesetOptions.region = instancesRegion;
    }

    return createInstancesTile(tileOptions)
        .then(function(result) {
            var i3dm = result.i3dm;
            var batchTableJson = result.batchTableJson;
            tilesetOptions.properties = getProperties(batchTableJson);
            var tilesetJson = createTilesetJsonSingle(tilesetOptions);
            var promises = [
                saveTilesetJson(tilesetPath, tilesetJson, prettyJson),
                saveTile(tilePath, i3dm, gzip)
            ];
            if (tileOptions.embed === false) {
                var copyPath = path.join(tilesetDirectory, path.basename(tileOptions.url));
                promises.push(fsExtraCopy(tileOptions.url, copyPath));
            }
            return Promise.all(promises);
        });
}

function saveBatchedTileset(tilesetName, tileOptions, tilesetOptions) {
    var tilesetDirectory = path.join(outputDirectory, 'Batched', tilesetName);
    var tileName = lowercase(tilesetName) + '.b3dm';
    var tilePath = path.join(tilesetDirectory, tileName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');

    tileOptions = defaultValue(tileOptions, {});
    tileOptions.buildingOptions = defaultValue(tileOptions.buildingOptions, buildingTemplate);
    tileOptions.transform = defaultValue(tileOptions.transform, buildingsTransform);
    tileOptions.optimizeForCesium = optimizeForCesium;
    tileOptions.relativeToCenter = defaultValue(tileOptions.relativeToCenter, relativeToCenter);

    tilesetOptions = defaultValue(tilesetOptions, {});
    tilesetOptions.tileName = tileName;
    tilesetOptions.geometricError = smallGeometricError;
    if (!defined(tilesetOptions.region) && !defined(tilesetOptions.sphere) && !defined(tilesetOptions.box)) {
        tilesetOptions.region = smallRegion;
    }

    return createBuildingsTile(tileOptions)
        .then(function(result) {
            var b3dm = result.b3dm;
            var batchTableJson = result.batchTableJson;
            tilesetOptions.properties = getProperties(batchTableJson);
            var tilesetJson = createTilesetJsonSingle(tilesetOptions);
            return Promise.all([
                saveTilesetJson(tilesetPath, tilesetJson, prettyJson),
                saveTile(tilePath, b3dm, gzip)
            ]);
        });
}

function savePointCloudTileset(tilesetName, tileOptions, tilesetOptions) {
    var tilesetDirectory = path.join(outputDirectory, 'PointCloud', tilesetName);
    var tileName = lowercase(tilesetName) + '.pnts';
    var tilePath = path.join(tilesetDirectory, tileName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');

    tileOptions = defaultValue(tileOptions, {});
    tileOptions.tileWidth = pointCloudTileWidth;
    tileOptions.transform = defaultValue(tileOptions.transform, pointCloudTransform);
    tileOptions.pointsLength = pointsLength;

    var result = createPointCloudTile(tileOptions);
    var pnts = result.pnts;
    var batchTableJson = result.batchTableJson;

    tilesetOptions = defaultValue(tilesetOptions, {});
    tilesetOptions.tileName = tileName;
    tilesetOptions.properties = getProperties(batchTableJson);
    tilesetOptions.geometricError = pointCloudGeometricError;
    if (!defined(tilesetOptions.region) && !defined(tilesetOptions.sphere) && !defined(tilesetOptions.box)) {
        tilesetOptions.sphere = pointCloudSphere;
    }

    var tilesetJson = createTilesetJsonSingle(tilesetOptions);
    return Promise.all([
        saveTilesetJson(tilesetPath, tilesetJson, prettyJson),
        saveTile(tilePath, pnts, gzip)
    ]);
}

function createCityTileset() {
    // Create a tileset with one root tile and four child tiles
    var tilesetName = 'Tileset';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var tileNames = ['parent.b3dm', 'll.b3dm', 'lr.b3dm', 'ur.b3dm', 'ul.b3dm'];

    var parentRegion = [longitude - longitudeExtent, latitude - latitudeExtent, longitude + longitudeExtent, latitude + latitudeExtent, 0.0, largeHeight];
    var parentContentRegion = [longitude - longitudeExtent / 2.0, latitude - latitudeExtent / 2.0, longitude + longitudeExtent / 2.0, latitude + latitudeExtent / 2.0, 0.0, largeHeight];
    var parentOptions = clone(buildingTemplate);
    parentOptions.averageWidth = 20.0;
    parentOptions.averageHeight = 40.0;
    parentOptions.longitude = longitude;
    parentOptions.latitude = latitude;
    var parentTileOptions = {
        buildingOptions : parentOptions,
        createBatchTable : true,
        transform : buildingsTransform,
        optimizeForCesium : optimizeForCesium,
        relativeToCenter : relativeToCenter
    };

    var llRegion = [longitude - longitudeExtent, latitude - latitudeExtent, longitude, latitude, 0.0, smallHeight];
    var llLongitude = longitude - longitudeExtent / 2.0;
    var llLatitude = latitude - latitudeExtent / 2.0;
    var llTransform = wgs84Transform(llLongitude, llLatitude);
    var llOptions = clone(buildingTemplate);
    llOptions.longitude = llLongitude;
    llOptions.latitude = llLatitude;
    var llTileOptions = {
        buildingOptions : llOptions,
        createBatchTable : true,
        transform : llTransform,
        optimizeForCesium : optimizeForCesium,
        relativeToCenter : relativeToCenter
    };

    var lrRegion = [longitude, latitude - latitudeExtent, longitude + longitudeExtent, latitude, 0.0, smallHeight];
    var lrLongitude = longitude + longitudeExtent / 2.0;
    var lrLatitude = latitude - latitudeExtent / 2.0;
    var lrTransform = wgs84Transform(lrLongitude, lrLatitude);
    var lrOptions = clone(buildingTemplate);
    lrOptions.longitude = lrLongitude;
    lrOptions.latitude = lrLatitude;
    var lrTileOptions = {
        buildingOptions : lrOptions,
        createBatchTable : true,
        transform : lrTransform,
        optimizeForCesium : optimizeForCesium,
        relativeToCenter : relativeToCenter
    };

    var urRegion = [longitude, latitude, longitude + longitudeExtent, latitude + latitudeExtent, 0.0, smallHeight];
    var urLongitude = longitude + longitudeExtent / 2.0;
    var urLatitude = latitude + latitudeExtent / 2.0;
    var urTransform = wgs84Transform(urLongitude, urLatitude);
    var urOptions = clone(buildingTemplate);
    urOptions.longitude = urLongitude;
    urOptions.latitude = urLatitude;
    var urTileOptions = {
        buildingOptions : urOptions,
        createBatchTable : true,
        transform : urTransform,
        optimizeForCesium : optimizeForCesium,
        relativeToCenter : relativeToCenter
    };

    var ulRegion = [longitude - longitudeExtent, latitude, longitude, latitude + latitudeExtent, 0.0, smallHeight];
    var ulLongitude = longitude - longitudeExtent / 2.0;
    var ulLatitude = latitude + latitudeExtent / 2.0;
    var ulTransform = wgs84Transform(ulLongitude, ulLatitude);
    var ulOptions = clone(buildingTemplate);
    ulOptions.longitude = ulLongitude;
    ulOptions.latitude = ulLatitude;
    var ulTileOptions = {
        buildingOptions : ulOptions,
        createBatchTable : true,
        transform : ulTransform,
        optimizeForCesium : optimizeForCesium,
        relativeToCenter : relativeToCenter
    };

    var tilesetJson = {
        asset : {
            version : '0.0',
            tilesetVersion : '1.2.3'
        },
        geometricError : largeGeometricError,
        root : {
            boundingVolume : {
                region : parentRegion
            },
            geometricError : smallGeometricError,
            refine : 'add',
            content : {
                url : 'parent.b3dm',
                boundingVolume : {
                    region : parentContentRegion
                }
            },
            children : [
                {
                    boundingVolume : {
                        region : llRegion
                    },
                    geometricError : 0.0,
                    content : {
                        url : 'll.b3dm'
                    }
                },
                {
                    boundingVolume : {
                        region : lrRegion
                    },
                    geometricError : 0.0,
                    content : {
                        url : 'lr.b3dm'
                    }
                },
                {
                    boundingVolume : {
                        region : urRegion
                    },
                    geometricError : 0.0,
                    content : {
                        url : 'ur.b3dm'
                    }
                },
                {
                    boundingVolume : {
                        region : ulRegion
                    },
                    geometricError : 0.0,
                    content : {
                        url : 'ul.b3dm'
                    }
                }
            ]
        }
    };

    var tileOptions = [parentTileOptions, llTileOptions, lrTileOptions, urTileOptions, ulTileOptions];

    return Promise.map(tileOptions, function(tileOptions, index) {
        return createBuildingsTile(tileOptions)
            .then(function(result) {
                var b3dm = result.b3dm;
                var batchTable = result.batchTableJson;
                var tilePath = path.join(tilesetDirectory, tileNames[index]);
                return saveTile(tilePath, b3dm, gzip)
                    .then(function() {
                        return batchTable;
                    });
            });
    }).then(function(batchTables) {
        tilesetJson.properties = getProperties(batchTables);
        return saveTilesetJson(tilesetPath, tilesetJson, prettyJson);
    });
}

function createDiscreteLOD() {
    var glbPaths = ['data/dragon_high.glb', 'data/dragon_medium.glb', 'data/dragon_low.glb'];
    var tileNames = ['dragon_high.b3dm', 'dragon_medium.b3dm', 'dragon_low.b3dm'];
    var tilesetName = 'TilesetWithDiscreteLOD';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');

    var dragonLowGeometricError = 500.0;
    var dragonMediumGeometricError = 100.0;
    var draonHighGeometricError = 10.0;

    var dragonWidth = 14.191;
    var dragonHeight = 10.075;
    var dragonDepth = 6.281;
    var dragonBox = [0.0, 0.0, 0.0, dragonWidth, 0.0, 0.0, 0.0, dragonDepth, 0.0, 0.0, 0.0, dragonHeight];

    var dragonScale = 100.0;
    var dragonOffset = dragonHeight / 2.0 * dragonScale;
    var wgs84Matrix = wgs84Transform(longitude, latitude, dragonOffset);
    var scaleMatrix = Matrix4.fromUniformScale(dragonScale);
    var dragonMatrix = Matrix4.multiply(wgs84Matrix, scaleMatrix, new Matrix4());
    var dragonTransform = Matrix4.pack(dragonMatrix, new Array(16));

    var tilesetJson = {
        asset : {
            version : '0.0'
        },
        geometricError : dragonLowGeometricError,
        root : {
            transform : dragonTransform,
            boundingVolume : {
                box : dragonBox
            },
            geometricError : dragonMediumGeometricError,
            refine : 'replace',
            content : {
                url : 'dragon_low.b3dm'
            },
            children : [
                {
                    boundingVolume : {
                        box : dragonBox
                    },
                    geometricError : draonHighGeometricError,
                    content : {
                        url : 'dragon_medium.b3dm'
                    },
                    children : [
                        {
                            boundingVolume : {
                                box : dragonBox
                            },
                            geometricError : 0.0,
                            content : {
                                url : 'dragon_high.b3dm'
                            }
                        }
                    ]
                }
            ]
        }
    };

    var tilesPromise = Promise.map(glbPaths, function(glbPath, index) {
        return fsExtraReadFile(glbPath)
            .then(function(glb) {
                var b3dm = createB3dm({
                    glb : glb
                });
                var tilePath = path.join(tilesetDirectory, tileNames[index]);
                return saveTile(tilePath, b3dm, gzip);
            });
    });

    var tilesetPromise = saveTilesetJson(tilesetPath, tilesetJson, prettyJson);

    return Promise.all([tilesPromise, tilesetPromise]);
}

function createTreeBillboards() {
    // Billboard effect is coded in the tree_billboard vertex shader
    var glbPaths = ['data/tree.glb', 'data/tree_billboard.glb'];
    var tileNames = ['tree.i3dm', 'tree_billboard.i3dm'];
    var tilesetName = 'TilesetWithTreeBillboards';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');

    var treeBillboardGeometricError = 100.0;
    var treeGeometricError = 10.0;

    var treesCount = 25;
    var treesHeight = 10.0;
    var treesTileWidth = tileWidth;
    var treesTransform = wgs84Transform(longitude, latitude, treesHeight / 2.0);
    var treesRegion = [west, south, east, north, 0.0, treesHeight];

    var options = {
        tileWidth : treesTileWidth,
        transform : treesTransform,
        instancesLength : treesCount,
        embed : true,
        modelSize : treesHeight,
        createBatchTable : true,
        eastNorthUp : true
    };

    var tilesetJson = {
        asset : {
            version : '0.0'
        },
        geometricError : treeBillboardGeometricError,
        root : {
            boundingVolume : {
                region : treesRegion
            },
            geometricError : treeGeometricError,
            refine : 'replace',
            content : {
                url : 'tree_billboard.i3dm'
            },
            children : [
                {
                    boundingVolume : {
                        region : treesRegion
                    },
                    geometricError : 0.0,
                    content : {
                        url : 'tree.i3dm'
                    }
                }
            ]
        }
    };

    return Promise.map(glbPaths, function(glbPath, index) {
        options.url = glbPath;
        return createInstancesTile(options)
            .then(function(result) {
                var i3dm = result.i3dm;
                var batchTable = result.batchTableJson;
                var tilePath = path.join(tilesetDirectory, tileNames[index]);
                return saveTile(tilePath, i3dm, gzip)
                    .then(function() {
                        return batchTable;
                    });
            });
    }).then(function(batchTables) {
        tilesetJson.properties = getProperties(batchTables);
        return saveTilesetJson(tilesetPath, tilesetJson, prettyJson);
    });
}
