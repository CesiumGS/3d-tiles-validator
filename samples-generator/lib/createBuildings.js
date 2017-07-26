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
    diffuse : [1.0, 1.0, 1.0, 1.0],
    ambient : [0.2, 0.2, 0.2, 1.0]
});

var whiteTranslucentMaterial = new Material({
    diffuse: [1.0, 1.0, 1.0, 0.5],
    ambient : [0.2, 0.2, 0.2, 1.0]
});

var texturedMaterial = new Material({
    diffuse : 'data/wood_red.jpg',
    ambient : [0.2, 0.0, 0.0, 1.0]
});

var redMaterial = new Material({
    diffuse : [1.0, 0.0, 0.0, 1.0],
    ambient : [0.2, 0.0, 0.0, 1.0]
});

/**
 * Creates a set of buildings that will be converted to a b3dm tile.
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Number} [options.numberOfBuildings=10] The number of buildings to create.
 * @param {Number} [options.tileWidth=200.0] The width of the tile in meters. Buildings are placed randomly in this area.
 * @param {Number} [options.averageWidth=4.0] Average building width in meters around which random widths and depths are generated.
 * @param {Number} [options.averageHeight=5.0] Average building height in meters around which random heights are generated.
 * @param {String} [options.diffuseType='white'] Specifies the type of diffuse color to apply to the tile. Possible values are 'white', 'color', 'textured'.
 * @param {String} [options.translucencyType='opaque'] Specifies the type of translucency to apply to the tile. Possible values are 'opaque', 'translucent', 'mix'.
 * @param {Number} [options.longitude=-1.31968] The center longitude of the tile. Used to generate metadata for the batch table.
 * @param {Number} [options.latitude=0.698874] The center latitude of the tile. Used to generate metadata for the batch table.
 * @param {Number} [options.seed=2] The random seed to use.
 *
 * @returns {Building[]} An array of buildings.
 */
function createBuildings(options) {
    // Set the random number seed before creating each set of buildings so that the generated buildings are the same between runs
    var seed = defaultValue(options.seed, 2);
    CesiumMath.setRandomNumberSeed(seed);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var numberOfBuildings = defaultValue(options.numberOfBuildings, 10);
    var tileWidth = defaultValue(options.tileWidth, 200.0);
    var averageWidth = defaultValue(options.averageWidth, 4.0);
    var averageHeight = defaultValue(options.averageHeight, 5.0);
    var diffuseType = defaultValue(options.diffuseType, 'white');
    var translucencyType = defaultValue(options.translucencyType, 'opaque');
    var centerLongitude = defaultValue(options.longitude, -1.31968);
    var centerLatitude = defaultValue(options.latitude, 0.698874);

    var buildings = new Array(numberOfBuildings);
    for (var i = 0; i < numberOfBuildings; ++i) {
        // Create buildings with the z-axis as up
        var material = getMaterial(diffuseType, translucencyType, i, numberOfBuildings);
        var width = Math.max(averageWidth + (CesiumMath.nextRandomNumber() - 0.5) * 8.0, 1.0);
        var depth = Math.max(width + (CesiumMath.nextRandomNumber() - 0.5) * 4.0, 1.0);
        var height = Math.max(averageHeight + (CesiumMath.nextRandomNumber() - 0.5) * 8.0, 1.0);
        var minX = -tileWidth / 2.0 + width / 2.0;
        var maxX = tileWidth / 2.0 - width / 2.0;
        var minY = -tileWidth / 2.0 + depth / 2.0;
        var maxY = tileWidth / 2.0 - depth / 2.0;
        var rangeX = CesiumMath.nextRandomNumber() - 0.5;
        var rangeY = CesiumMath.nextRandomNumber() - 0.5;

        // For Cesium testing purposes, always place one building in the center of the tile and make it red
        if (i === 0) {
            rangeX = 0.0;
            rangeY = 0.0;
            if ((diffuseType === 'color') && (translucencyType === 'opaque')) {
                material = redMaterial;
            }
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
            material : material,
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
        diffuse : [red, green, blue, alpha],
        ambient : [0.2, 0.2, 0.2, 1.0]
    });
}

function getMaterial(diffuseType, translucencyType, buildingIndex, numberOfBuildings) {
    var firstHalf = (buildingIndex < numberOfBuildings / 2);
    if (diffuseType === 'white') {
        if (translucencyType === 'opaque') {
            return whiteOpaqueMaterial;
        } else if (translucencyType === 'translucent') {
            return whiteTranslucentMaterial;
        } else if (translucencyType === 'mix') {
            return firstHalf ? whiteOpaqueMaterial : whiteTranslucentMaterial;
        }
    } else if (diffuseType === 'color') {
        if (translucencyType === 'opaque') {
            return getRandomColorMaterial(1.0);
        } else if (translucencyType === 'translucent') {
            return getRandomColorMaterial(0.5);
        } else if (translucencyType === 'mix') {
            var alpha = firstHalf ? 1.0 : 0.5;
            return getRandomColorMaterial(alpha);
        }
    } else if (diffuseType === 'textured') {
        return texturedMaterial;
    }
}
