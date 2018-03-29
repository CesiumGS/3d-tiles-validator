#!/usr/bin/env node
'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var createBatchTableHierarchy = require('../lib/createBatchTableHierarchy');
var createBuildingsTile = require('../lib/createBuildingsTile');
var createB3dm = require('../lib/createB3dm');
var createCmpt = require('../lib/createCmpt');
var createI3dm = require('../lib/createI3dm');
var createInstancesTile = require('../lib/createInstancesTile');
var createPointCloudTile = require('../lib/createPointCloudTile');
var createTilesetJsonSingle = require('../lib/createTilesetJsonSingle');
var getProperties = require('../lib/getProperties');
var modifyGltfPaths = require('../lib/modifyGltfPaths');
var saveTile = require('../lib/saveTile');
var saveTilesetJson = require('../lib/saveTilesetJson');
var util = require('../lib/utility');

var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var clone = Cesium.clone;
var defaultValue = Cesium.defaultValue;
var defined  = Cesium.defined;
var Matrix4 = Cesium.Matrix4;
var Quaternion = Cesium.Quaternion;

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

var buildingsTransform = wgs84Transform(longitude, latitude, 0.0); // height is 0.0 because the base of building models is at the origin
var buildingsCenter = [buildingsTransform[12], buildingsTransform[13], buildingsTransform[14]];

// Small buildings
var smallGeometricError = 70.0; // Estimated
var smallHeight = 20.0; // Estimated
var smallRegion = [west, south, east, north, 0.0, smallHeight];
var smallRadius = tileWidth * 0.707107;
var smallSphere = [buildingsCenter[0], buildingsCenter[1], buildingsCenter[2] + smallHeight / 2.0, smallRadius];
var smallSphereLocal = [0.0, 0.0, smallHeight / 2.0, smallRadius];
var smallBoxLocal = [
    0.0, 0.0, smallHeight / 2.0, // center
    tileWidth / 2.0, 0.0, 0.0,   // width
    0.0, tileWidth / 2.0, 0.0,   // depth
    0.0, 0.0, smallHeight / 2.0  // height
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
var pointCloudSphereLocal = [0.0, 0.0, 0.0, pointCloudRadius];

// Instances
var instancesLength = 25;
var instancesGeometricError = 70.0; // Estimated
var instancesTileWidth = tileWidth;
var instancesUrl = 'data/box.glb'; // Model's center is at the origin (and for below)
var instancesRedUrl = 'data/red_box.glb';
var instancesTexturedUrl = 'data/textured_box.glb';
var instancesZUpUrl = 'data/box-z-up.glb';
var instancesModelSize = 20.0;
var instancesHeight = instancesModelSize + 10.0; // Just a little extra padding at the top for aiding Cesium tests
var instancesTransform = wgs84Transform(longitude, latitude, instancesModelSize / 2.0);
var instancesRegion = [west, south, east, north, 0.0, instancesHeight];
var instancesBoxLocal = [
    0.0, 0.0, 0.0,                      // center
    instancesTileWidth / 2.0, 0.0, 0.0, // width
    0.0,instancesTileWidth / 2.0, 0.0,  // depth
    0.0, 0.0, instancesHeight / 2.0     // height
];

// Composite
var compositeRegion = instancesRegion;
var compositeGeometricError = instancesGeometricError;

// City Tileset
var parentRegion = [longitude - longitudeExtent, latitude - latitudeExtent, longitude + longitudeExtent, latitude + latitudeExtent, 0.0, largeHeight];
var parentContentRegion = [longitude - longitudeExtent / 2.0, latitude - latitudeExtent / 2.0, longitude + longitudeExtent / 2.0, latitude + latitudeExtent / 2.0, 0.0, largeHeight];
var parentOptions = clone(buildingTemplate);
parentOptions.averageWidth = 20.0;
parentOptions.averageHeight = 82.0;
parentOptions.longitude = longitude;
parentOptions.latitude = latitude;
var parentTileOptions = {
    buildingOptions : parentOptions,
    createBatchTable : true,
    transform : buildingsTransform,
    optimizeForCesium : optimizeForCesium,
    relativeToCenter : relativeToCenter
};

var childrenRegion = [longitude - longitudeExtent, latitude - latitudeExtent, longitude + longitudeExtent, latitude + latitudeExtent, 0.0, smallHeight];

var llRegion = [longitude - longitudeExtent, latitude - latitudeExtent, longitude, latitude, 0.0, smallHeight];
var llLongitude = longitude - longitudeExtent / 2.0;
var llLatitude = latitude - latitudeExtent / 2.0;
var llTransform = wgs84Transform(llLongitude, llLatitude);
var llOptions = clone(buildingTemplate);
llOptions.longitude = llLongitude;
llOptions.latitude = llLatitude;
llOptions.seed = 0;
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
lrOptions.seed = 1;
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
urOptions.seed = 2;
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
ulOptions.seed = 3;
var ulTileOptions = {
    buildingOptions : ulOptions,
    createBatchTable : true,
    transform : ulTransform,
    optimizeForCesium : optimizeForCesium,
    relativeToCenter : relativeToCenter
};

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
    createBatchedCompressedTextures(),
    createBatchedWithBoundingSphere(),
    createBatchedWithTransformBox(),
    createBatchedWithTransformSphere(),
    createBatchedWithTransformRegion(),
    createBatchedNoBatchIds(),
    createBatchedWithKHRMaterialsCommon(),
    createBatchedWithQuantization(),
    createBatchedWGS84(),
    createBatchedDeprecated1(),
    createBatchedDeprecated2(),
    createBatchedGltfZUp(),
    createBatchedExpiration(),
    createBatchedWithVertexColors(),
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
    createInstancedRTC(),
    createInstancedWithTransform(),
    createInstancedRedMaterial(),
    createInstancedWithBatchIds(),
    createInstancedTextured(),
    createInstancedCompressedTextures(),
    createInstancedGltfZUp(),
    // Composite
    createComposite(),
    createCompositeOfComposite(),
    createCompositeOfInstanced(),
    // Hierarchy
    createHierarchy(),
    createHierarchyMultipleParents(),
    createHierarchyNoParents(),
    createHierarchyBinary(),
    // Tilesets
    createTileset(),
    createTilesetEmptyRoot(),
    createTilesetOfTilesets(),
    createTilesetWithExternalResources(),
    createTilesetRefinementMix(),
    createTilesetReplacement1(),
    createTilesetReplacement2(),
    createTilesetReplacement3(),
    createTilesetWithTransforms(),
    createTilesetWithViewerRequestVolume(),
    createTilesetReplacementWithViewerRequestVolume(),
    createTilesetSubtreeExpiration(),
    createTilesetPoints(),
    // Samples
    createDiscreteLOD(),
    createTreeBillboards(),
    createRequestVolume(),
    createExpireTileset()
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

function createBatchedCompressedTextures() {
    var buildingOptions = clone(buildingTemplate);
    buildingOptions.diffuseType = 'textured';
    var tileOptions = {
        buildingOptions : buildingOptions,
        textureCompressionOptions : [{
            format : 'dxt1',
            quality : 10
        }, {
            format : 'etc1',
            quality : 10
        }]
    };
    return saveBatchedTileset('BatchedCompressedTextures', tileOptions);
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

function createBatchedNoBatchIds() {
    var tileOptions = {
        useBatchIds : false
    };
    return saveBatchedTileset('BatchedNoBatchIds', tileOptions);
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

function createBatchedWGS84() {
    // Only for testing - vertices are defined directly in WGS84 causing visual artifacts due to lack of precision.
    var tileOptions = {
        relativeToCenter : false
    };
    return saveBatchedTileset('BatchedWGS84', tileOptions);
}

function createBatchedDeprecated1() {
    // Save the b3dm with the deprecated 20-byte header and the glTF with the BATCHID semantic
    var tileOptions = {
        deprecated1 : true
    };
    return saveBatchedTileset('BatchedDeprecated1', tileOptions);
}

function createBatchedDeprecated2() {
    // Save the b3dm with the deprecated 24-byte header and the glTF with the BATCHID semantic
    var tileOptions = {
        deprecated2 : true
    };
    return saveBatchedTileset('BatchedDeprecated2', tileOptions);
}

function createBatchedGltfZUp() {
    var tileOptions = {
        gltfUpAxis : 'Z'
    };
    var tilesetOptions = {
        gltfUpAxis : 'Z'
    };
    return saveBatchedTileset('BatchedGltfZUp', tileOptions, tilesetOptions);
}

function createBatchedExpiration() {
    var tilesetOptions = {
        expire : {
            duration : 5.0
        }
    };
    return saveBatchedTileset('BatchedExpiration', undefined, tilesetOptions);
}

function createBatchedWithVertexColors() {
    var buildingOptions = clone(buildingTemplate);
    buildingOptions.diffuseType = 'color';
    var tileOptions = {
        buildingOptions : buildingOptions,
        useVertexColors : true,
        khrMaterialsCommon : true
    };
    return saveBatchedTileset('BatchedWithVertexColors', tileOptions);
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
        colorMode : 'none',
        shape : 'sphere',
        generateNormals : true
    };
    return savePointCloudTileset('PointCloudBatched', tileOptions);
}

function createPointCloudWithPerPointProperties() {
    var tileOptions = {
        perPointProperties : true,
        transform : Matrix4.IDENTITY,
        relativeToCenter : false
    };
    var tilesetOptions = {
        transform : pointCloudTransform,
        sphere : pointCloudSphereLocal
    };
    return savePointCloudTileset('PointCloudWithPerPointProperties', tileOptions, tilesetOptions);
}

function createPointCloudWithTransform() {
    var tileOptions = {
        transform : Matrix4.IDENTITY,
        relativeToCenter : false
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

function createInstancedRTC() {
    var tileOptions = {
        relativeToCenter : true
    };
    return saveInstancedTileset('InstancedRTC', tileOptions);
}

function createInstancedWithTransform() {
    var tileOptions = {
        transform : Matrix4.IDENTITY,
        eastNorthUp : false
    };
    var tilesetOptions = {
        transform : instancesTransform,
        box : instancesBoxLocal
    };
    return saveInstancedTileset('InstancedWithTransform', tileOptions, tilesetOptions);
}

function createInstancedRedMaterial() {
    var tileOptions = {
        url : instancesRedUrl
    };
    return saveInstancedTileset('InstancedRedMaterial', tileOptions);
}

function createInstancedWithBatchIds() {
    var tileOptions = {
        batchIds : true
    };
    return saveInstancedTileset('InstancedWithBatchIds', tileOptions);
}

function createInstancedTextured() {
    var tileOptions = {
        url : instancesTexturedUrl
    };
    return saveInstancedTileset('InstancedTextured', tileOptions);
}

function createInstancedCompressedTextures() {
    var tileOptions = {
        url : instancesTexturedUrl,
        textureCompressionOptions : [{
            format : 'dxt1',
            quality : 10
        }, {
            format : 'etc1',
            quality : 10
        }]
    };
    return saveInstancedTileset('InstancedCompressedTextures', tileOptions);
}

function createInstancedGltfZUp() {
    var tileOptions = {
        url : instancesZUpUrl
    };
    var tilesetOptions = {
        gltfUpAxis : 'Z'
    };
    return saveInstancedTileset('InstancedGltfZUp', tileOptions, tilesetOptions);
}

function createComposite() {
    var i3dmOptions = {
        url : instancesUrl,
        tileWidth : instancesTileWidth,
        transform : instancesTransform,
        instancesLength : instancesLength,
        modelSize : instancesModelSize,
        eastNorthUp : true
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

function createCompositeOfInstanced() {
    var i3dmOptions1 = {
        url : instancesUrl,
        tileWidth : instancesTileWidth,
        transform : instancesTransform,
        instancesLength : instancesLength,
        modelSize : instancesModelSize,
        eastNorthUp : true,
        embed : false
    };

    var i3dmOptions2 = {
        url : instancesUrl,
        tileWidth : instancesTileWidth,
        transform : instancesTransform,
        instancesLength : instancesLength,
        modelSize : instancesModelSize,
        eastNorthUp : true,
        embed : false
    };

    return Promise.all([
        createInstancesTile(i3dmOptions1),
        createInstancesTile(i3dmOptions2)
    ]).then(function(results) {
        var i3dm1 = results[0].i3dm;
        var i3dm2 = results[1].i3dm;
        var i3dm1BatchTable = results[0].batchTableJson;
        var i3dm2BatchTable = results[1].batchTableJson;
        return saveCompositeTileset('CompositeOfInstanced', [i3dm1, i3dm2], [i3dm1BatchTable, i3dm2BatchTable]);
    }).then(function() {
        var tilesetDirectory = path.join(outputDirectory, 'Composite', 'CompositeOfInstanced');
        var copyPath = path.join(tilesetDirectory, path.basename(instancesUrl));
        return fsExtra.copy(instancesUrl, copyPath);
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
    tileOptions.eastNorthUp = defaultValue(tileOptions.eastNorthUp, true);

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
                promises.push(fsExtra.copy(tileOptions.url, copyPath));
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

function createHierarchy() {
    return createBatchTableHierarchy({
        directory : path.join(outputDirectory, 'Hierarchy', 'BatchTableHierarchy'),
        transform : buildingsTransform,
        optimizeForCesium : optimizeForCesium,
        gzip : gzip,
        prettyJson : prettyJson
    });
}

function createHierarchyMultipleParents() {
    return createBatchTableHierarchy({
        directory : path.join(outputDirectory, 'Hierarchy', 'BatchTableHierarchyMultipleParents'),
        transform : buildingsTransform,
        multipleParents : true,
        optimizeForCesium : optimizeForCesium,
        gzip : gzip,
        prettyJson : prettyJson
    });
}

function createHierarchyNoParents() {
    return createBatchTableHierarchy({
        directory : path.join(outputDirectory, 'Hierarchy', 'BatchTableHierarchyNoParents'),
        transform : buildingsTransform,
        noParents : true,
        optimizeForCesium : optimizeForCesium,
        gzip : gzip,
        prettyJson : prettyJson
    });
}

function createHierarchyBinary() {
    return createBatchTableHierarchy({
        directory : path.join(outputDirectory, 'Hierarchy', 'BatchTableHierarchyBinary'),
        transform : buildingsTransform,
        batchTableBinary : true,
        multipleParents : true,
        optimizeForCesium : optimizeForCesium,
        gzip : gzip,
        prettyJson : prettyJson
    });
}

function saveTilesetFiles(tileOptions, tileNames, tilesetDirectory, tilesetPath, tilesetJson, saveProperties) {
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
        if (saveProperties) {
            tilesetJson.properties = getProperties(batchTables);
        }
        return saveTilesetJson(tilesetPath, tilesetJson, prettyJson);
    });
}

function createTileset() {
    // Create a tileset with one root tile and four child tiles
    var tilesetName = 'Tileset';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var tileNames = ['parent.b3dm', 'll.b3dm', 'lr.b3dm', 'ur.b3dm', 'ul.b3dm'];
    var tileOptions = [parentTileOptions, llTileOptions, lrTileOptions, urTileOptions, ulTileOptions];

    var tilesetJson = {
        asset : {
            version : '1.0',
            tilesetVersion : '1.2.3'
        },
        properties : undefined,
        geometricError : largeGeometricError,
        root : {
            boundingVolume : {
                region : parentRegion
            },
            geometricError : smallGeometricError,
            refine : 'ADD',
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

    return saveTilesetFiles(tileOptions, tileNames, tilesetDirectory, tilesetPath, tilesetJson, true);
}

function createTilesetEmptyRoot() {
    // Create a tileset with one empty root tile and four child tiles
    var tilesetName = 'TilesetEmptyRoot';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var tileNames = ['ll.b3dm', 'lr.b3dm', 'ur.b3dm', 'ul.b3dm'];
    var tileOptions = [llTileOptions, lrTileOptions, urTileOptions, ulTileOptions];

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        properties : undefined,
        geometricError : smallGeometricError,
        root : {
            boundingVolume : {
                region : childrenRegion
            },
            geometricError : smallGeometricError,
            refine : 'ADD',
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

    return saveTilesetFiles(tileOptions, tileNames, tilesetDirectory, tilesetPath, tilesetJson, true);
}

function createTilesetOfTilesets() {
    // Create a tileset that references an external tileset
    var tilesetName = 'TilesetOfTilesets';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var tileset2Path = path.join(tilesetDirectory, 'tileset2.json');
    var tileset3Path = path.join(tilesetDirectory, 'tileset3', 'tileset3.json');
    var llPath = path.join('tileset3', 'll.b3dm');
    var tileNames = ['parent.b3dm', llPath, 'lr.b3dm', 'ur.b3dm', 'ul.b3dm'];
    var tileOptions = [parentTileOptions, llTileOptions, lrTileOptions, urTileOptions, ulTileOptions];

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        properties : undefined,
        geometricError : largeGeometricError,
        root : {
            boundingVolume : {
                region : parentRegion
            },
            geometricError : smallGeometricError,
            refine : 'ADD',
            content : {
                url : 'tileset2.json'
            }
        }
    };

    var tileset2Json = {
        asset : {
            version : '1.0'
        },
        geometricError : smallGeometricError,
        root : {
            boundingVolume : {
                region : parentRegion
            },
            geometricError : smallGeometricError,
            refine : 'ADD',
            content : {
                url : 'parent.b3dm'
            },
            children : [
                {
                    boundingVolume : {
                        region : llRegion
                    },
                    geometricError : 0.0,
                    content : {
                        url : 'tileset3/tileset3.json'
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

    var tileset3Json = {
        asset : {
            version : '1.0'
        },
        geometricError : 0.0,
        root : {
            boundingVolume : {
                region : llRegion
            },
            geometricError : 0.0,
            refine : 'ADD',
            content : {
                url : 'll.b3dm'
            }
        }
    };

    return saveTilesetFiles(tileOptions, tileNames, tilesetDirectory, tilesetPath, tilesetJson, true)
        .then(function() {
            return Promise.all([
                saveTilesetJson(tileset2Path, tileset2Json, prettyJson),
                saveTilesetJson(tileset3Path, tileset3Json, prettyJson)
            ]);
        });
}

function createTilesetWithExternalResources() {
    // Create a tileset that references an external tileset where tiles reference external resources
    var tilesetName = 'TilesetWithExternalResources';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var tileset2Path = path.join(tilesetDirectory, 'tileset2', 'tileset2.json');
    var glbPath = 'data/textured_box_separate/textured_box.glb';
    var glbBasePath = 'data/textured_box_separate/';
    var glbCopyPath = path.join(tilesetDirectory, 'textured_box_separate/');

    var tilePaths = [
        path.join(tilesetDirectory, 'external.b3dm'),
        path.join(tilesetDirectory, 'external.i3dm'),
        path.join(tilesetDirectory, 'embed.i3dm'),
        path.join(tilesetDirectory, 'tileset2', 'external.b3dm'),
        path.join(tilesetDirectory, 'tileset2', 'external.i3dm'),
        path.join(tilesetDirectory, 'tileset2', 'embed.i3dm')
    ];

    var offset = metersToLongitude(20, latitude);
    var transforms = [
        Matrix4.pack(wgs84Transform(longitude + offset * 3, latitude, instancesModelSize / 2.0), new Array(16)),
        Matrix4.pack(wgs84Transform(longitude + offset * 2, latitude, instancesModelSize / 2.0), new Array(16)),
        Matrix4.pack(wgs84Transform(longitude + offset, latitude, instancesModelSize / 2.0), new Array(16)),
        Matrix4.pack(wgs84Transform(longitude, latitude, instancesModelSize / 2.0), new Array(16)),
        Matrix4.pack(wgs84Transform(longitude - offset, latitude, instancesModelSize / 2.0), new Array(16)),
        Matrix4.pack(wgs84Transform(longitude - offset * 2, latitude, instancesModelSize / 2.0), new Array(16))
    ];

    var tilesetJson = {
        asset : {
            version : '1.0',
            tilesetVersion : '1.2.3'
        },
        geometricError : smallGeometricError,
        root : {
            boundingVolume : {
                region : smallRegion
            },
            geometricError : smallGeometricError,
            refine : 'ADD',
            children : [
                {
                    boundingVolume : {
                        region : smallRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'ADD',
                    content : {
                        url : 'tileset2/tileset2.json'
                    }
                },
                {
                    boundingVolume : {
                        region : smallRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'ADD',
                    content : {
                        url : 'external.b3dm'
                    },
                    transform : transforms[0]
                },
                {
                    boundingVolume : {
                        region : smallRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'ADD',
                    content : {
                        url : 'external.i3dm'
                    },
                    transform : transforms[1]
                },
                {
                    boundingVolume : {
                        region : smallRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'ADD',
                    content : {
                        url : 'embed.i3dm'
                    },
                    transform : transforms[2]
                }
            ]
        }
    };

    var tileset2Json = {
        asset : {
            version : '1.0'
        },
        geometricError : smallGeometricError,
        root : {
            boundingVolume : {
                region : smallRegion
            },
            geometricError : smallGeometricError,
            refine : 'ADD',
            children : [
                {
                    boundingVolume : {
                        region : smallRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'ADD',
                    content : {
                        url : 'external.b3dm'
                    },
                    transform : transforms[3]
                },
                {
                    boundingVolume : {
                        region : smallRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'ADD',
                    content : {
                        url : 'external.i3dm'
                    },
                    transform : transforms[4]
                },
                {
                    boundingVolume : {
                        region : smallRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'ADD',
                    content : {
                        url : 'embed.i3dm'
                    },
                    transform : transforms[5]
                }
            ]
        }
    };

    // Simple i3dm
    var featureTableBinary = Buffer.alloc(12, 0); // [0, 0, 0]
    var featureTableJson = {
        INSTANCES_LENGTH : 1,
        POSITION : {
            byteOffset : 0
        }
    };

    return fsExtra.readFile(glbPath)
        .then(function(glb) {
            var tiles = [
                createB3dm({
                    glb : modifyGltfPaths(glb, 'textured_box_separate/')
                }),
                createI3dm({
                    featureTableJson : featureTableJson,
                    featureTableBinary : featureTableBinary,
                    url : 'textured_box_separate/textured_box.glb'
                }),
                createI3dm({
                    featureTableJson : featureTableJson,
                    featureTableBinary : featureTableBinary,
                    glb : modifyGltfPaths(glb, 'textured_box_separate/')
                }),
                createB3dm({
                    glb : modifyGltfPaths(glb, '../textured_box_separate/')
                }),
                createI3dm({
                    featureTableJson : featureTableJson,
                    featureTableBinary : featureTableBinary,
                    url : '../textured_box_separate/textured_box.glb'
                }),
                createI3dm({
                    featureTableJson : featureTableJson,
                    featureTableBinary : featureTableBinary,
                    glb : modifyGltfPaths(glb, '../textured_box_separate/')
                })
            ];
            return Promise.map(tiles, function(tile, index) {
                return saveTile(tilePaths[index], tile, gzip);
            });
        })
        .then(function() {
            return Promise.all([
                saveTilesetJson(tilesetPath, tilesetJson, prettyJson),
                saveTilesetJson(tileset2Path, tileset2Json, prettyJson),
                fsExtra.copy(glbBasePath, glbCopyPath)
            ]);
        });
}

function createTilesetRefinementMix() {
    // Create a tileset with a mix of additive and replacement refinement
    // A - add
    // R - replace
    //          A
    //      A       R (not rendered)
    //    R   A   R   A
    var tilesetName = 'TilesetRefinementMix';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var tileNames = ['parent.b3dm', 'll.b3dm', 'lr.b3dm', 'ur.b3dm', 'ul.b3dm'];
    var tileOptions = [parentTileOptions, llTileOptions, lrTileOptions, urTileOptions, ulTileOptions];

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        properties : undefined,
        geometricError : largeGeometricError,
        root : {
            boundingVolume : {
                region : parentRegion
            },
            geometricError : smallGeometricError,
            refine : 'ADD',
            content : {
                url : 'parent.b3dm',
                boundingVolume : {
                    region : parentContentRegion
                }
            },
            children : [
                {
                    boundingVolume : {
                        region : parentContentRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'REPLACE',
                    content : {
                        url : 'parent.b3dm'
                    },
                    children : [
                        {
                            boundingVolume : {
                                region : llRegion
                            },
                            geometricError : 0.0,
                            refine : 'ADD',
                            content : {
                                url : 'll.b3dm'
                            }
                        },
                        {
                            boundingVolume : {
                                region : urRegion
                            },
                            geometricError : 0.0,
                            refine : 'REPLACE',
                            content : {
                                url : 'ur.b3dm'
                            }
                        }
                    ]
                },
                {
                    boundingVolume : {
                        region : parentContentRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'ADD',
                    content : {
                        url : 'parent.b3dm'
                    },
                    children : [
                        {
                            boundingVolume : {
                                region : ulRegion
                            },
                            geometricError : 0.0,
                            refine : 'ADD',
                            content : {
                                url : 'ul.b3dm'
                            }
                        },
                        {
                            boundingVolume : {
                                region : lrRegion
                            },
                            geometricError : 0.0,
                            refine : 'REPLACE',
                            content : {
                                url : 'lr.b3dm'
                            }
                        }
                    ]
                }
            ]
        }
    };

    return saveTilesetFiles(tileOptions, tileNames, tilesetDirectory, tilesetPath, tilesetJson, true);
}

function createTilesetReplacement1() {
    // No children have content, but all grandchildren have content. Root uses replacement refinement.
    // C - content
    // E - empty
    //          C
    //      E       E
    //    C   C   C   C
    var tilesetName = 'TilesetReplacement1';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var tileNames = ['parent.b3dm', 'll.b3dm', 'lr.b3dm', 'ur.b3dm', 'ul.b3dm'];
    var tileOptions = [parentTileOptions, llTileOptions, lrTileOptions, urTileOptions, ulTileOptions];

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        properties : undefined,
        geometricError : largeGeometricError,
        root : {
            boundingVolume : {
                region : parentRegion
            },
            geometricError : smallGeometricError,
            refine : 'REPLACE',
            content : {
                url : 'parent.b3dm',
                boundingVolume : {
                    region : parentContentRegion
                }
            },
            children : [
                {
                    boundingVolume : {
                        region : childrenRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'ADD',
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
                                region : urRegion
                            },
                            geometricError : 0.0,
                            content : {
                                url : 'ur.b3dm'
                            }
                        }
                    ]
                },
                {
                    boundingVolume : {
                        region : childrenRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'ADD',
                    children : [
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
                                region : ulRegion
                            },
                            geometricError : 0.0,
                            content : {
                                url : 'ul.b3dm'
                            }
                        }
                    ]
                }
            ]
        }
    };

    return saveTilesetFiles(tileOptions, tileNames, tilesetDirectory, tilesetPath, tilesetJson, true);
}

function createTilesetReplacement2() {
    //          C
    //          E
    //        C   E
    //            C (smaller geometric error)
    //
    var tilesetName = 'TilesetReplacement2';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var tileNames = ['parent.b3dm', 'll.b3dm', 'ur.b3dm'];
    var tileOptions = [parentTileOptions, llTileOptions, urTileOptions];

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        properties : undefined,
        geometricError : largeGeometricError,
        root : {
            boundingVolume : {
                region : parentRegion
            },
            geometricError : smallGeometricError,
            refine : 'REPLACE',
            content : {
                url : 'parent.b3dm',
                boundingVolume : {
                    region : parentContentRegion
                }
            },
            children : [
                {
                    boundingVolume : {
                        region : childrenRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'ADD',
                    children : [
                        {
                            boundingVolume : {
                                region : urRegion
                            },
                            geometricError : 7.0,
                            refine : 'REPLACE',
                            children : [
                                {
                                    boundingVolume : {
                                        region : urRegion
                                    },
                                    geometricError : 0.0,
                                    content : {
                                        url : 'ur.b3dm'
                                    }
                                }
                            ]
                        },
                        {
                            boundingVolume : {
                                region : llRegion
                            },
                            geometricError : 0.0,
                            content : {
                                url : 'll.b3dm'
                            }
                        }
                    ]
                }
            ]
        }
    };

    return saveTilesetFiles(tileOptions, tileNames, tilesetDirectory, tilesetPath, tilesetJson, true);
}

function createTilesetReplacement3() {
    //          C
    //          T (external tileset ref)
    //          E (root of external tileset)
    //     C  C  C  C
    var tilesetName = 'TilesetReplacement3';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var tileset2Path = path.join(tilesetDirectory, 'tileset2.json');
    var tileNames = ['parent.b3dm', 'll.b3dm', 'lr.b3dm', 'ur.b3dm', 'ul.b3dm'];
    var tileOptions = [parentTileOptions, llTileOptions, lrTileOptions, urTileOptions, ulTileOptions];

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        properties : undefined,
        geometricError : largeGeometricError,
        root : {
            boundingVolume : {
                region : parentRegion
            },
            geometricError : smallGeometricError,
            refine : 'REPLACE',
            content : {
                url : 'parent.b3dm',
                boundingVolume : {
                    region : parentContentRegion
                }
            },
            children : [
                {
                    boundingVolume : {
                        region : childrenRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'ADD',
                    content : {
                        url : 'tileset2.json'
                    }
                }
            ]
        }
    };

    var tileset2Json = {
        asset : {
            version : '1.0'
        },
        geometricError : smallGeometricError,
        root : {
            boundingVolume : {
                region : childrenRegion
            },
            geometricError : smallGeometricError,
            refine : 'REPLACE',
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

    return saveTilesetFiles(tileOptions, tileNames, tilesetDirectory, tilesetPath, tilesetJson, true)
        .then(function() {
            return saveTilesetJson(tileset2Path, tileset2Json, prettyJson);
        });
}

function createTilesetWithTransforms() {
    var tilesetName = 'TilesetWithTransforms';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var buildingsTileName = 'buildings.b3dm';
    var buildingsTilePath = path.join(tilesetDirectory, buildingsTileName);
    var instancesTileName = 'instances.i3dm';
    var instancesTilePath = path.join(tilesetDirectory, instancesTileName);

    var rootTransform = Matrix4.pack(buildingsTransform, new Array(16));

    var rotation = Quaternion.fromAxisAngle(Cartesian3.UNIT_Z, CesiumMath.PI_OVER_FOUR);
    var translation = new Cartesian3(0, 0, 5.0);
    var scale = new Cartesian3(0.5, 0.5, 0.5);
    var childMatrix = Matrix4.fromTranslationQuaternionRotationScale(translation, rotation, scale);
    var childTransform = Matrix4.pack(childMatrix, new Array(16));

    var instancesOptions = {
        tileWidth : instancesTileWidth,
        transform : Matrix4.IDENTITY,
        instancesLength : instancesLength,
        url : instancesUrl,
        modelSize : instancesModelSize,
        eastNorthUp : false
    };

    var buildingsOptions = {
        buildingOptions : buildingTemplate,
        transform : Matrix4.IDENTITY,
        optimizeForCesium : optimizeForCesium,
        relativeToCenter : false
    };

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        properties : undefined,
        geometricError : smallGeometricError,
        root : {
            boundingVolume : {
                box : smallBoxLocal
            },
            transform : rootTransform,
            geometricError : instancesGeometricError,
            refine : 'ADD',
            content : {
                url : buildingsTileName
            },
            children : [
                {
                    boundingVolume : {
                        box : instancesBoxLocal
                    },
                    transform : childTransform,
                    geometricError : 0.0,
                    content : {
                        url : instancesTileName
                    }
                }
            ]
        }
    };

    return Promise.all([
        createInstancesTile(instancesOptions),
        createBuildingsTile(buildingsOptions)
    ]).then(function(results) {
        var i3dm = results[0].i3dm;
        var b3dm = results[1].b3dm;
        return Promise.all([
            saveTile(instancesTilePath, i3dm, gzip),
            saveTile(buildingsTilePath, b3dm, gzip),
            saveTilesetJson(tilesetPath, tilesetJson, prettyJson)
        ]);
    });
}

function createTilesetWithViewerRequestVolume() {
    // Create a tileset with one root tile and four child tiles
    var tilesetName = 'TilesetWithViewerRequestVolume';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var tileNames = ['ll.b3dm', 'lr.b3dm', 'ur.b3dm', 'ul.b3dm'];
    var tileOptions = [llTileOptions, lrTileOptions, urTileOptions, ulTileOptions];
    var pointCloudTileName = 'points.pnts';
    var pointCloudTilePath = path.join(tilesetDirectory, pointCloudTileName);

    var pointsLength = 1000;
    var pointCloudTileWidth = 20.0;
    var pointCloudRadius = pointCloudTileWidth / 2.0;
    var pointCloudSphereLocal = [0.0, 0.0, 0.0, pointCloudRadius];
    var pointCloudHeight = pointCloudRadius + 5.0;
    var pointCloudMatrix = wgs84Transform(longitude, latitude, pointCloudHeight);
    var pointCloudTransform = Matrix4.pack(pointCloudMatrix, new Array(16));
    var pointCloudViewerRequestSphere = [0.0, 0.0, 0.0, pointCloudTileWidth * 50.0]; // Point cloud only become visible when you are inside the request volume

    var pointCloudOptions = {
        tileWidth : pointCloudTileWidth,
        pointsLength : pointsLength,
        transform : Matrix4.IDENTITY,
        relativeToCenter : false,
        shape : 'sphere'
    };

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        geometricError : largeGeometricError,
        root : {
            boundingVolume : {
                region : childrenRegion
            },
            geometricError : smallGeometricError,
            refine : 'ADD',
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
                },
                {
                    transform : pointCloudTransform,
                    viewerRequestVolume : {
                        sphere : pointCloudViewerRequestSphere
                    },
                    boundingVolume : {
                        sphere : pointCloudSphereLocal
                    },
                    geometricError : 0.0,
                    content : {
                        url : 'points.pnts'
                    }
                }
            ]
        }
    };

    var pnts = createPointCloudTile(pointCloudOptions).pnts;

    return saveTilesetFiles(tileOptions, tileNames, tilesetDirectory, tilesetPath, tilesetJson, false)
        .then(function() {
            return saveTile(pointCloudTilePath, pnts, gzip);
        });
}

function createTilesetReplacementWithViewerRequestVolume() {
    var tilesetName = 'TilesetReplacementWithViewerRequestVolume';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var tileNames = ['parent.b3dm', 'll.b3dm', 'lr.b3dm', 'ur.b3dm', 'ul.b3dm'];
    var tileOptions = [parentTileOptions, llTileOptions, lrTileOptions, urTileOptions, ulTileOptions];

    var requestHeight = 50.0;
    var childRequestRegion = [longitude - longitudeExtent / 2.0, latitude - latitudeExtent / 2.0, longitude + longitudeExtent / 2.0, latitude + latitudeExtent / 2.0, 0.0, requestHeight];

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        properties : undefined,
        geometricError : largeGeometricError,
        root : {
            boundingVolume : {
                region : parentRegion
            },
            geometricError : largeGeometricError,
            refine : 'REPLACE',
            children : [
                {
                    boundingVolume : {
                        region : parentRegion
                    },
                    geometricError : smallGeometricError,
                    refine : 'REPLACE',
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
                            viewerRequestVolume : {
                                region : childRequestRegion
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
                            viewerRequestVolume : {
                                region : childRequestRegion
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
                            viewerRequestVolume : {
                                region : childRequestRegion
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
                            viewerRequestVolume : {
                                region : childRequestRegion
                            },
                            geometricError : 0.0,
                            content : {
                                url : 'ul.b3dm'
                            }
                        }
                    ]
                }
            ]
        }
    };

    return saveTilesetFiles(tileOptions, tileNames, tilesetDirectory, tilesetPath, tilesetJson, true);
}

function createTilesetSubtreeExpiration() {
    var tilesetName = 'TilesetSubtreeExpiration';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var subtreePath = path.join(tilesetDirectory, 'subtree.json');
    var tileNames = ['parent.b3dm', 'll.b3dm', 'lr.b3dm', 'ur.b3dm', 'ul.b3dm'];
    var tileOptions = [parentTileOptions, llTileOptions, lrTileOptions, urTileOptions, ulTileOptions];

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        properties : undefined,
        geometricError : largeGeometricError,
        root : {
            boundingVolume : {
                region : parentRegion
            },
            geometricError : smallGeometricError,
            refine : 'ADD',
            content : {
                boundingVolume : {
                    region : parentContentRegion
                },
                url : 'parent.b3dm'
            },
            children : [
                {
                    expire : {
                        duration : 5.0
                    },
                    boundingVolume : {
                        region : childrenRegion
                    },
                    geometricError : smallGeometricError,
                    content : {
                        url : 'subtree.json'
                    }
                }
            ]
        }
    };

    var subtreeJson = {
        asset : {
            version : '1.0'
        },
        properties : undefined,
        geometricError : smallGeometricError,
        root : {
            boundingVolume : {
                region : childrenRegion
            },
            geometricError : smallGeometricError,
            refine : 'ADD',
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

    return Promise.all([
        saveTilesetFiles(tileOptions, tileNames, tilesetDirectory, tilesetPath, tilesetJson, true),
        saveTilesetJson(subtreePath, subtreeJson, prettyJson)
    ]);
}

function createTilesetPoints() {
    // Create a tileset with one root tile and eight child tiles
    var tilesetName = 'TilesetPoints';
    var tilesetDirectory = path.join(outputDirectory, 'Tilesets', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');

    var pointsLength = 1000;
    var parentTileWidth = 10.0;
    var parentTileHalfWidth = parentTileWidth / 2.0;
    var parentGeometricError = 1.732 * parentTileWidth; // Diagonal of the point cloud box
    var parentMatrix = wgs84Transform(longitude, latitude, parentTileHalfWidth);
    var parentTransform = Matrix4.pack(parentMatrix, new Array(16));
    var parentBoxLocal = [
        0.0, 0.0, 0.0, // center
        parentTileHalfWidth, 0.0, 0.0,   // width
        0.0, parentTileHalfWidth, 0.0,   // depth
        0.0, 0.0, parentTileHalfWidth    // height
    ];
    var parentTile = createPointCloudTile({
        tileWidth : parentTileWidth * 2.0,
        pointsLength : pointsLength,
        relativeToCenter : false
    }).pnts;

    var childrenJson = [];
    var childTiles = [];
    var childTileWidth = 5.0;
    var childTileHalfWidth = childTileWidth / 2.0;
    var childGeometricError = 1.732 * childTileWidth; // Diagonal of the point cloud box
    var childCenters = [
        [-childTileHalfWidth, -childTileHalfWidth, -childTileHalfWidth],
        [-childTileHalfWidth, childTileHalfWidth, childTileHalfWidth],
        [-childTileHalfWidth, -childTileHalfWidth, childTileHalfWidth],
        [-childTileHalfWidth, childTileHalfWidth, -childTileHalfWidth],
        [childTileHalfWidth, -childTileHalfWidth, -childTileHalfWidth],
        [childTileHalfWidth, childTileHalfWidth, -childTileHalfWidth],
        [childTileHalfWidth, -childTileHalfWidth, childTileHalfWidth],
        [childTileHalfWidth, childTileHalfWidth, childTileHalfWidth]
    ];

    var i;
    for (i = 0; i < 8; ++i) {
        var childCenter = childCenters[i];
        var childTransform = Matrix4.fromTranslation(Cartesian3.unpack(childCenter));
        childTiles.push(createPointCloudTile({
            tileWidth : childTileWidth * 2.0,
            transform : childTransform,
            pointsLength : pointsLength,
            relativeToCenter : false
        }).pnts);
        var childBoxLocal = [
            childCenter[0], childCenter[1], childCenter[2],
            childTileHalfWidth, 0.0, 0.0,   // width
            0.0, childTileHalfWidth, 0.0,   // depth
            0.0, 0.0, childTileHalfWidth    // height
        ];
        childrenJson.push({
            boundingVolume : {
                box : childBoxLocal
            },
            geometricError : 0.0,
            content : {
                url : i + '.pnts'
            }
        });
    }

    var tilesetJson = {
        asset : {
            version : '0.0'
        },
        properties : undefined,
        geometricError : parentGeometricError,
        root : {
            boundingVolume : {
                box : parentBoxLocal
            },
            transform : parentTransform,
            geometricError : childGeometricError,
            refine : 'ADD',
            content : {
                url : 'parent.pnts'
            },
            children : childrenJson
        }
    };

    var promises = [];
    promises.push(saveTile(path.join(tilesetDirectory, 'parent.pnts'), parentTile, gzip));
    for (i = 0; i < 8; ++i) {
        promises.push(saveTile(path.join(tilesetDirectory, i + '.pnts'), childTiles[i], gzip));
    }
    promises.push(saveTilesetJson(tilesetPath, tilesetJson, prettyJson));

    return Promise.all(promises);
}

function createDiscreteLOD() {
    var glbPaths = ['data/dragon_high.glb', 'data/dragon_medium.glb', 'data/dragon_low.glb'];
    var tileNames = ['dragon_high.b3dm', 'dragon_medium.b3dm', 'dragon_low.b3dm'];
    var tilesetName = 'TilesetWithDiscreteLOD';
    var tilesetDirectory = path.join(outputDirectory, 'Samples', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');

    var dragonLowGeometricError = 500.0;
    var dragonMediumGeometricError = 100.0;
    var dragonHighGeometricError = 10.0;

    var dragonWidth = 14.191;
    var dragonHeight = 10.075;
    var dragonDepth = 6.281;
    var dragonBox = [
        0.0, 0.0, 0.0,                // center
        dragonWidth / 2.0, 0.0, 0.0,  // width
        0.0, dragonDepth / 2.0, 0.0,  // depth
        0.0, 0.0, dragonHeight / 2.0  // height
    ];

    var dragonScale = 100.0;
    var dragonOffset = dragonHeight / 2.0 * dragonScale;
    var wgs84Matrix = wgs84Transform(longitude, latitude, dragonOffset);
    var scaleMatrix = Matrix4.fromUniformScale(dragonScale);
    var dragonMatrix = Matrix4.multiply(wgs84Matrix, scaleMatrix, new Matrix4());
    var dragonTransform = Matrix4.pack(dragonMatrix, new Array(16));

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        geometricError : dragonLowGeometricError,
        root : {
            transform : dragonTransform,
            boundingVolume : {
                box : dragonBox
            },
            geometricError : dragonMediumGeometricError,
            refine : 'REPLACE',
            content : {
                url : 'dragon_low.b3dm'
            },
            children : [
                {
                    boundingVolume : {
                        box : dragonBox
                    },
                    geometricError : dragonHighGeometricError,
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
        return fsExtra.readFile(glbPath)
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
    var tilesetDirectory = path.join(outputDirectory, 'Samples', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');

    var treeBillboardGeometricError = 100.0;
    var treeGeometricError = 10.0;

    var treesCount = 25;
    var treesHeight = 20.0;
    var treesTileWidth = tileWidth;
    var treesRegion = [west, south, east, north, 0.0, treesHeight];

    var options = {
        tileWidth : treesTileWidth,
        instancesLength : treesCount,
        embed : true,
        modelSize : treesHeight,
        createBatchTable : true,
        eastNorthUp : true
    };

    var treeOptions = clone(options);
    treeOptions.url = glbPaths[0];
    treeOptions.transform = wgs84Transform(longitude, latitude, 0.0); // Detailed model's base is at the origin

    var billboardOptions = clone(options);
    billboardOptions.url = glbPaths[1];
    billboardOptions.transform = wgs84Transform(longitude, latitude, treesHeight / 2.0); // Billboard model is centered about the origin

    var optionsArray = [treeOptions, billboardOptions];

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        geometricError : treeBillboardGeometricError,
        root : {
            boundingVolume : {
                region : treesRegion
            },
            geometricError : treeGeometricError,
            refine : 'REPLACE',
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

    return Promise.map(optionsArray, function(options, index) {
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

function createRequestVolume() {
    var tilesetName = 'TilesetWithRequestVolume';
    var tilesetDirectory = path.join(outputDirectory, 'Samples', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var buildingGlbPath = 'data/building.glb';
    var buildingTileName = 'building.b3dm';
    var buildingTilePath = path.join(tilesetDirectory, buildingTileName);
    var pointCloudTileName = 'points.pnts';
    var pointCloudTilePath = path.join(tilesetDirectory, pointCloudTileName);

    var cityTilesetPath = path.join(tilesetDirectory, 'city', 'tileset.json');
    var cityTileNames = ['ll.b3dm', 'lr.b3dm', 'ur.b3dm', 'ul.b3dm'];
    var cityTileOptions = [llTileOptions, lrTileOptions, urTileOptions, ulTileOptions];

    var buildingWidth = 3.738;
    var buildingDepth = 3.72;
    var buildingHeight = 13.402;
    var buildingGeometricError = 100.0; // Estimate based on diagonal
    var buildingScale = 5.0;
    var wgs84Matrix = wgs84Transform(longitude, latitude, 0.0);
    var scaleMatrix = Matrix4.fromUniformScale(buildingScale);
    var buildingMatrix = Matrix4.multiply(wgs84Matrix, scaleMatrix, new Matrix4());
    var buildingTransform = Matrix4.pack(buildingMatrix, new Array(16));
    var buildingBoxLocal = [
        0.0, 0.0, buildingHeight / 2.0, // center
        buildingWidth / 2.0, 0.0, 0.0,  // width
        0.0, buildingDepth / 2.0, 0.0,  // depth
        0.0, 0.0, buildingHeight / 2.0  // height
    ];

    var pointsLength = 125000;
    var pointCloudTileWidth = 2.5;
    var pointCloudRadius = pointCloudTileWidth / 2.0;
    var pointCloudSphereLocal = [0.0, 0.0, 0.0, pointCloudRadius];
    var pointCloudHeight = pointCloudRadius + 0.2; // Try to place it in one of the building's floors
    var pointCloudMatrix = wgs84Transform(longitude, latitude, pointCloudHeight);
    var pointCloudTransform = Matrix4.pack(pointCloudMatrix, new Array(16));
    var pointCloudViewerRequestSphere = [0.0, 0.0, 0.0, pointCloudTileWidth * 6.0]; // Point cloud only become visible when you are inside the request volume

    var pointCloudOptions = {
        tileWidth : pointCloudTileWidth,
        pointsLength : pointsLength,
        transform : Matrix4.IDENTITY,
        relativeToCenter : false,
        shape : 'sphere'
    };

    var totalRegion = clone(childrenRegion);
    totalRegion[5] = buildingHeight * buildingScale;

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        geometricError : buildingGeometricError,
        root : {
            boundingVolume : {
                region : totalRegion
            },
            geometricError : buildingGeometricError,
            refine : 'ADD',
            children : [
                {
                    boundingVolume : {
                        region : childrenRegion
                    },
                    geometricError : smallGeometricError,
                    content : {
                        url : 'city/tileset.json'
                    }
                },
                {
                    transform : buildingTransform,
                    boundingVolume : {
                        box : buildingBoxLocal
                    },
                    geometricError : 0.0,
                    content : {
                        url : buildingTileName
                    }
                },
                {
                    transform : pointCloudTransform,
                    viewerRequestVolume : {
                        sphere : pointCloudViewerRequestSphere
                    },
                    boundingVolume : {
                        sphere : pointCloudSphereLocal
                    },
                    geometricError : 0.0,
                    content : {
                        url : pointCloudTileName
                    }
                }
            ]
        }
    };

    var cityTilesetJson = {
        asset : {
            version : '1.0'
        },
        properties : undefined,
        geometricError : smallGeometricError,
        root : {
            boundingVolume : {
                region : childrenRegion
            },
            geometricError : smallGeometricError,
            refine : 'ADD',
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

    var pnts = createPointCloudTile(pointCloudOptions).pnts;

    var cityTilePromises = Promise.map(cityTileOptions, function(tileOptions, index) {
        return createBuildingsTile(tileOptions)
            .then(function(result) {
                var tilePath = path.join(tilesetDirectory, 'city', cityTileNames[index]);
                return saveTile(tilePath, result.b3dm, gzip);
            });
    });

    var buildingPromise = fsExtra.readFile(buildingGlbPath)
        .then(function(glb) {
            return createB3dm({
                glb : glb
            });
        })
        .then(function(b3dm) {
            saveTile(buildingTilePath, b3dm, gzip);
        });

    return Promise.all([
        cityTilePromises,
        buildingPromise,
        saveTile(pointCloudTilePath, pnts, gzip),
        saveTilesetJson(tilesetPath, tilesetJson, prettyJson),
        saveTilesetJson(cityTilesetPath, cityTilesetJson, prettyJson)
    ]);
}

function createExpireTileset() {
    var tilesetName = 'TilesetWithExpiration';
    var tilesetDirectory = path.join(outputDirectory, 'Samples', tilesetName);
    var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
    var pointCloudTileName = 'points.pnts';
    var pointCloudTilePath = path.join(tilesetDirectory, pointCloudTileName);

    var pointsLength = 8000;
    var pointCloudTileWidth = 200.0;
    var pointCloudSphereLocal = [0.0, 0.0, 0.0, pointCloudTileWidth / 2.0];
    var pointCloudGeometricError = 1.732 * pointCloudTileWidth; // Diagonal of the point cloud box
    var pointCloudMatrix = wgs84Transform(longitude, latitude, pointCloudTileWidth / 2.0);
    var pointCloudTransform = Matrix4.pack(pointCloudMatrix, new Array(16));

    var pointCloudOptions = {
        tileWidth : pointCloudTileWidth,
        pointsLength : pointsLength,
        perPointProperties : true,
        transform : Matrix4.IDENTITY,
        relativeToCenter : false,
        color : 'noise',
        shape : 'box'
    };

    var tilePromises = [];

    var pnts = createPointCloudTile(pointCloudOptions).pnts;
    tilePromises.push(saveTile(pointCloudTilePath, pnts, gzip));

    // Save a few tiles for the server cache
    for (var i = 0; i < 5; ++i) {
        var tilePath = path.join(tilesetDirectory, 'cache', 'points_' + i + '.pnts');
        var tileOptions = clone(pointCloudOptions);
        tileOptions.time = i * 0.1;
        var tile = createPointCloudTile(tileOptions).pnts;
        tilePromises.push(saveTile(tilePath, tile, gzip));
    }

    var tilesetJson = {
        asset : {
            version : '1.0'
        },
        geometricError : pointCloudGeometricError,
        root : {
            expire : {
                duration : 5.0
            },
            transform : pointCloudTransform,
            boundingVolume : {
                sphere : pointCloudSphereLocal
            },
            geometricError : 0.0,
            refine : 'ADD',
            content : {
                url : pointCloudTileName
            }
        }
    };

    return Promise.all([
        saveTilesetJson(tilesetPath, tilesetJson, prettyJson),
        Promise.all(tilePromises)
    ]);
}
