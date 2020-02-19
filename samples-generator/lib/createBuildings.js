'use strict';
var Cesium = require('cesium');
var Material = require('./Material');
var util = require('./utility');

var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var defaultValue = Cesium.defaultValue;
var Matrix4 = Cesium.Matrix4;
var Quaternion = Cesium.Quaternion;

var metersToLongitude = util.metersToLongitude;
var metersToLatitude = util.metersToLatitude;

module.exports = createBuildings;

var scratchTranslation = new Cartesian3();
var scratchRotation = new Quaternion();
var scratchScale = new Cartesian3();

var whiteOpaqueMaterial = new Material({
    baseColor : [1.0, 1.0, 1.0, 1.0]
});

var whiteTranslucentMaterial = new Material({
    baseColor : [1.0, 1.0, 1.0, 0.5]
});

var texturedMaterial = new Material({
    baseColor : 'data/wood_red.jpg'
});

var redMaterial = new Material({
    baseColor : [1.0, 0.0, 0.0, 1.0]
});

/**
 * Creates a set of buildings that will be converted to a b3dm tile.
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Boolean} [options.uniform=false] Whether to create uniformly sized and spaced buildings.
 * @param {Number} [options.numberOfBuildings=10] The number of buildings to create.
 * @param {Number} [options.tileWidth=200.0] The width of the tile in meters. Buildings are placed randomly in this area.
 * @param {Number} [options.averageWidth=4.0] Average building width in meters around which random widths and depths are generated.
 * @param {Number} [options.averageHeight=5.0] Average building height in meters around which random heights are generated.
 * @param {String} [options.baseColorType='white'] Specifies the type of diffuse color to apply to the tile. Possible values are 'white', 'color', 'textured'.
 * @param {String} [options.translucencyType='opaque'] Specifies the type of translucency to apply to the tile. Possible values are 'opaque', 'translucent', 'mix'.
 * @param {Number} [options.longitude=-1.31968] The center longitude of the tile. Used to generate metadata for the batch table.
 * @param {Number} [options.latitude=0.698874] The center latitude of the tile. Used to generate metadata for the batch table.
 * @param {Number} [options.seed=11] The random seed to use.
 *
 * @returns {Building[]} An array of buildings.
 */
function createBuildings(options) {
    options = defaultValue(options, {});
    options.seed = defaultValue(options.seed, 11);
    options.numberOfBuildings = defaultValue(options.numberOfBuildings, 10);
    options.tileWidth = defaultValue(options.tileWidth, 200.0);
    options.averageWidth = defaultValue(options.averageWidth, 4.0);
    options.averageHeight = defaultValue(options.averageHeight, 5.0);
    options.baseColorType = defaultValue(options.baseColorType, 'white');
    options.translucencyType = defaultValue(options.translucencyType, 'opaque');
    options.longitude = defaultValue(options.longitude, -1.31968);
    options.latitude = defaultValue(options.latitude, 0.698874);

    if (options.uniform) {
        return createUniformBuildings(options);
    }
    return createRandomBuildings(options);
}

function createUniformBuildings(options) {
    var numberOfBuildings = options.numberOfBuildings;
    var tileWidth = options.tileWidth;
    var centerLongitude = options.longitude;
    var centerLatitude = options.latitude;

    var buildingsPerAxis = Math.sqrt(numberOfBuildings);
    var buildingWidth = tileWidth / (buildingsPerAxis * 3);
    var buildings = [];

    for (var i = 0; i < buildingsPerAxis; ++i) {
        for (var j = 0; j < buildingsPerAxis; ++j) {
            var x = buildingWidth * 1.5 + i * buildingWidth * 3.0 - tileWidth / 2.0;
            var y = buildingWidth * 1.5 + j * buildingWidth * 3.0 - tileWidth / 2.0;
            var z = buildingWidth / 2.0;
            var rangeX = x / tileWidth - 0.5;
            var rangeY = y / tileWidth - 0.5;

            var translation = Cartesian3.fromElements(x, y, z, scratchTranslation);
            var rotation = Quaternion.clone(Quaternion.IDENTITY, scratchRotation);
            var scale = Cartesian3.fromElements(buildingWidth, buildingWidth, buildingWidth, scratchScale);
            var matrix = Matrix4.fromTranslationQuaternionRotationScale(translation, rotation, scale, new Matrix4());

            var longitudeExtent = metersToLongitude(tileWidth, centerLatitude);
            var latitudeExtent = metersToLatitude(tileWidth, centerLongitude);
            var longitude = centerLongitude + rangeX * longitudeExtent;
            var latitude = centerLatitude + rangeY * latitudeExtent;

            buildings.push(new Building({
                matrix : matrix,
                material : whiteOpaqueMaterial,
                longitude : longitude,
                latitude : latitude,
                height : buildingWidth
            }));
        }
    }

    return buildings;
}

function createRandomBuildings(options) {
    var seed = options.seed;
    var numberOfBuildings = options.numberOfBuildings;
    var tileWidth = options.tileWidth;
    var averageWidth = options.averageWidth;
    var averageHeight = options.averageHeight;
    var baseColorType = options.baseColorType;
    var translucencyType = options.translucencyType;
    var centerLongitude = options.longitude;
    var centerLatitude = options.latitude;

    // Set the random number seed before creating materials
    CesiumMath.setRandomNumberSeed(seed);
    var materials = new Array(numberOfBuildings);
    for (i = 0; i < numberOfBuildings; ++i) {
        // For CesiumJS testing purposes make the first building red
        var useRedMaterial = (baseColorType === 'color') && (translucencyType === 'opaque') && i === 0;
        var randomMaterial = getMaterial(baseColorType, translucencyType, i, numberOfBuildings);
        materials[i] = useRedMaterial ? redMaterial : randomMaterial;
    }

    // Set the random number seed before creating buildings so that the generated buildings are the same between runs
    CesiumMath.setRandomNumberSeed(seed);
    var buildings = new Array(numberOfBuildings);
    for (var i = 0; i < numberOfBuildings; ++i) {
        // Create buildings with the z-axis as up
        var width = Math.max(averageWidth + (CesiumMath.nextRandomNumber() - 0.5) * 8.0, 1.0);
        var depth = Math.max(width + (CesiumMath.nextRandomNumber() - 0.5) * 4.0, 1.0);
        var height = Math.max(averageHeight + (CesiumMath.nextRandomNumber() - 0.5) * 8.0, 1.0);
        var minX = -tileWidth / 2.0 + width / 2.0;
        var maxX = tileWidth / 2.0 - width / 2.0;
        var minY = -tileWidth / 2.0 + depth / 2.0;
        var maxY = tileWidth / 2.0 - depth / 2.0;
        var rangeX = CesiumMath.nextRandomNumber() - 0.5;
        var rangeY = CesiumMath.nextRandomNumber() - 0.5;

        // For CesiumJS testing purposes, always place one building in the center of the tile and make it red
        if (i === 0) {
            rangeX = 0.0;
            rangeY = 0.0;
        }

        var x = rangeX * tileWidth;
        var y = rangeY * tileWidth;
        x = CesiumMath.clamp(x, minX, maxX);
        y = CesiumMath.clamp(y, minY, maxY);
        var z = height / 2.0;

        var translation = Cartesian3.fromElements(x, y, z, scratchTranslation);
        var rotation = Quaternion.clone(Quaternion.IDENTITY, scratchRotation);
        var scale = Cartesian3.fromElements(width, depth, height, scratchScale);
        var matrix = Matrix4.fromTranslationQuaternionRotationScale(translation, rotation, scale, new Matrix4());

        var longitudeExtent = metersToLongitude(tileWidth, centerLatitude);
        var latitudeExtent = metersToLatitude(tileWidth, centerLongitude);
        var longitude = centerLongitude + rangeX * longitudeExtent;
        var latitude = centerLatitude + rangeY * latitudeExtent;

        buildings[i] = new Building({
            matrix : matrix,
            material : materials[i],
            longitude : longitude,
            latitude : latitude,
            height : height
        });
    }

    return buildings;
}

/**
 * Information that describes a building, including position, appearance, and metadata.
 *
 * @param {Object} options Object with the following properties:
 * @param {Matrix4} options.matrix The matrix defining the position and size of the building.
 * @param {Material} options.material The material of the building.
 * @param {Number} options.longitude Longitude of the building - metadata for the batch table.
 * @param {Number} options.latitude Latitude of the building - metadata for the batch table.
 * @param {Number} options.height Height of the building - metadata for the batch table.
 *
 * @constructor
 * @private
 */
function Building(options) {
    this.matrix = options.matrix;
    this.material = options.material;
    this.longitude = options.longitude;
    this.latitude = options.latitude;
    this.height = options.height;
}

function getRandomColorMaterial(alpha) {
    var red = CesiumMath.nextRandomNumber();
    var green = CesiumMath.nextRandomNumber();
    var blue = CesiumMath.nextRandomNumber();
    return new Material({
        baseColor : [red, green, blue, alpha]
    });
}

function getMaterial(baseColorType, translucencyType, buildingIndex, numberOfBuildings) {
    var firstHalf = (buildingIndex < numberOfBuildings / 2);
    if (baseColorType === 'white') {
        if (translucencyType === 'opaque') {
            return whiteOpaqueMaterial;
        } else if (translucencyType === 'translucent') {
            return whiteTranslucentMaterial;
        } else if (translucencyType === 'mix') {
            return firstHalf ? whiteOpaqueMaterial : whiteTranslucentMaterial;
        }
    } else if (baseColorType === 'color') {
        if (translucencyType === 'opaque') {
            return getRandomColorMaterial(1.0);
        } else if (translucencyType === 'translucent') {
            return getRandomColorMaterial(0.5);
        } else if (translucencyType === 'mix') {
            var alpha = firstHalf ? 1.0 : 0.5;
            return getRandomColorMaterial(alpha);
        }
    } else if (baseColorType === 'textured') {
        return texturedMaterial;
    }
}
