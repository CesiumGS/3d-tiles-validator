'use strict';
var Cesium = require('cesium');
var SimplexNoise = require('simplex-noise');
var createPnts = require('./createPnts');

var AttributeCompression = Cesium.AttributeCompression;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var Color = Cesium.Color;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var Matrix4 = Cesium.Matrix4;

module.exports = createPointCloudTile;

var sizeOfUint8 = 1;
var sizeOfUint16 = 2;
var sizeOfUint32 = 4;
var sizeOfFloat32 = 4;

CesiumMath.setRandomNumberSeed(0);
var simplex = new SimplexNoise(CesiumMath.nextRandomNumber);

/**
 * Creates a pnts tile that represents a point cloud.
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Number} [options.tileWidth=10.0] The width of the tile in meters.
 * @param {Matrix4} [options.transform=Matrix4.IDENTITY] A transform to bake into the tile, for example a transform into WGS84.
 * @param {Number} [options.pointsLength=1000] The number of points in the point cloud.
 * @param {String} [options.colorMode='rgb'] The mode in which colors are saved. Possible values are 'rgb', 'rgba', 'rgb565', 'constant', 'none'.
 * @param {String} [options.color='random'] Determines the method for generating point colors. Possible values are 'random', 'gradient', 'noise'.
 * @param {String} [options.shape='box'] The shape of the point cloud. Possible values are 'sphere', 'box'.
 * @param {Boolean} [options.generateNormals=false] Generate per-point normals.
 * @param {Boolean} [options.octEncodeNormals=false] Apply oct16p encoding on the point normals.
 * @param {Boolean} [options.quantizePositions=false] Quantize point positions so each x, y, z takes up 16 bits rather than 32 bits.
 * @param {Boolean} [options.batched=false] Group points together with batch ids and generate per-batch metadata. Good for differentiating different sections of a point cloud. Not compatible with perPointProperties.
 * @param {Boolean} [options.perPointProperties=false] Generate per-point metadata.
 * @param {Boolean} [options.relativeToCenter=true] Define point positions relative-to-center.
 *
 * @returns {Object} An object containing the pnts buffer and batch table JSON.
 */
function createPointCloudTile(options) {
    // Set the random number seed before creating each point cloud so that the generated points are the same between runs
    CesiumMath.setRandomNumberSeed(0);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var tileWidth = defaultValue(options.tileWidth, 10.0);
    var transform = defaultValue(options.transform, Matrix4.IDENTITY);
    var pointsLength = defaultValue(options.pointsLength, 1000);
    var colorMode = defaultValue(options.colorMode, 'rgb');
    var color = defaultValue(options.color, 'random');
    var shape = defaultValue(options.shape, 'box');
    var generateNormals = defaultValue(options.generateNormals, false);
    var octEncodeNormals = defaultValue(options.octEncodeNormals, false);
    var quantizePositions = defaultValue(options.quantizePositions, false);
    var batched = defaultValue(options.batched, false);
    var perPointProperties = defaultValue(options.perPointProperties, false);
    var relativeToCenter = defaultValue(options.relativeToCenter, true);

    var time = 0.0;
    var radius = tileWidth / 2.0;
    var center = Matrix4.getTranslation(transform, new Cartesian3());

    var shapeFunction;
    if (shape === 'sphere') {
        shapeFunction = sphereFunction;
    } else if (shape === 'box') {
        shapeFunction = boxFunction;
    }

    var colorFunction;
    if (color === 'random') {
        colorFunction = randomFunction;
    } else if (color === 'gradient') {
        colorFunction = gradientFunction;
    } else if (color === 'noise') {
        colorFunction = getNoiseFunction(time);
    }

    var colorModeFunction;
    var constantColor;
    if (colorMode === 'rgb') {
        colorModeFunction = getColorsRGB;
    } else if (colorMode === 'rgba') {
        colorModeFunction = getColorsRGBA;
    } else if (colorMode === 'rgb565') {
        colorModeFunction = getColorsRGB565;
    } else if (colorMode === 'constant') {
        constantColor = [255, 255, 0, 51];
    }

    var points = getPoints(pointsLength, radius, colorModeFunction, colorFunction, shapeFunction, quantizePositions, octEncodeNormals, relativeToCenter, transform);
    var positions = points.positions;
    var normals = points.normals;
    var batchIds = points.batchIds;
    var colors = points.colors;
    var noiseValues = points.noiseValues;

    var attributes = [positions];
    if (defined(colors)) {
        attributes.push(colors);
    }
    if (generateNormals) {
        attributes.push(normals);
    }
    if (batched) {
        attributes.push(batchIds);
    }

    var i;
    var attribute;
    var byteOffset = 0;
    var attributesLength = attributes.length;
    for (i = 0; i < attributesLength; ++i) {
        attribute = attributes[i];
        var byteAlignment = attribute.byteAlignment;
        byteOffset = Math.ceil(byteOffset / byteAlignment) * byteAlignment; // Round up to the required alignment
        attribute.byteOffset = byteOffset;
        byteOffset += attribute.buffer.length;
    }

    var featureTableJson = {};
    var featureTableBinary = Buffer.alloc(byteOffset);

    featureTableJson.POINTS_LENGTH = pointsLength;

    if (defined(constantColor)) {
        featureTableJson.CONSTANT_RGBA = constantColor;
    }

    if (quantizePositions) {
        // Quantized offset is the lower left, unlike RTC_CENTER which is the center
        featureTableJson.QUANTIZED_VOLUME_SCALE = [tileWidth, tileWidth, tileWidth];
        featureTableJson.QUANTIZED_VOLUME_OFFSET = [center.x - radius, center.y - radius, center.z - radius];
    } else if (relativeToCenter){
        featureTableJson.RTC_CENTER = [center.x, center.y, center.z];
    }

    if (batched) {
        featureTableJson.BATCH_LENGTH = batchIds.batchLength;
    }

    for (i = 0; i < attributesLength; ++i) {
        attribute = attributes[i];
        featureTableJson[attribute.propertyName] = {
            byteOffset : attribute.byteOffset,
            componentType : attribute.componentType // Only defined for batchIds
        };
        attribute.buffer.copy(featureTableBinary, attribute.byteOffset);
    }

    var batchTable;
    var batchTableJson;
    var batchTableBinary;

    if (batched) {
        batchTable = getBatchTableForBatchedPoints(batchIds.batchLength);
        batchTableJson = batchTable.json;
        batchTableBinary = batchTable.binary;
    } else if (perPointProperties) {
        batchTable = getBatchTableForPerPointProperties(pointsLength, noiseValues);
        batchTableJson = batchTable.json;
        batchTableBinary = batchTable.binary;
    }

    var pnts = createPnts({
        featureTableJson : featureTableJson,
        featureTableBinary : featureTableBinary,
        batchTableJson : batchTableJson,
        batchTableBinary : batchTableBinary
    });

    return {
        pnts : pnts,
        batchTableJson : batchTableJson
    };
}

// Return a position in the range of (-0.5, -0.5, -0.5) to (0.5, 0.5, 0.5) based on the index
function getPosition(i, pointsLength) {
    var width = Math.round(Math.pow(pointsLength, 1/3));
    var z = Math.floor(i / (width * width));
    var y = Math.floor((i - z * width * width) / width);
    var x = i - width * (y + width * z);

    x = x / (width - 1) - 0.5;
    y = y / (width - 1) - 0.5;
    z = z / (width - 1) - 0.5;

    return new Cartesian3(x, y, z);
}

function boxFunction(i, pointsLength, radius) {
    var position = getPosition(i, pointsLength);
    Cartesian3.multiplyByScalar(position, radius, position);
    return position;
}

function sphereFunction(i, pointsLength, radius) { //eslint-disable-line no-unused-vars
    var theta = CesiumMath.nextRandomNumber() * 2 * Math.PI;
    var phi = CesiumMath.nextRandomNumber() * Math.PI - Math.PI/2.0;
    var x = radius * Math.cos(theta) * Math.cos(phi);
    var y = radius * Math.sin(phi);
    var z = radius * Math.sin(theta) * Math.cos(phi);
    return new Cartesian3(x, y, z);
}

function randomFunction(position) { //eslint-disable-line no-unused-vars
    return Color.fromRandom();
}

function gradientFunction(position) {
    var r = position.x + 0.5;
    var g = position.y + 0.5;
    var b = position.z + 0.5;
    return new Color(r, g, b, 1.0);
}

function getNoise(position, time) {
    time = defaultValue(time, 0.0);
    return Math.abs(simplex.noise4D(position.x, position.y, position.z, time));
}

function getNoiseFunction(time) {
    return function(position) {
        var noise = getNoise(position, time);
        return new Color(noise, noise, noise, noise);
    };
}

function getBatchId(position) {
    // Set to batchId to 0-7 depending on which octant the position is in
    var x = (position.x > 0) ? 0 : 1;
    var y = (position.y > 0) ? 0 : 1;
    var z = (position.z > 0) ? 0 : 1;

    return (x << 2) | (y << 1) | z;
}

var scratchMatrix = new Matrix4();
var scratchCenter = new Cartesian3();

function getPoints(pointsLength, radius, colorModeFunction, colorFunction, shapeFunction, quantizePositions, octEncodeNormals, relativeToCenter, transform) {
    var inverseTranspose = scratchMatrix;
    Matrix4.transpose(transform, inverseTranspose);
    Matrix4.inverse(inverseTranspose, inverseTranspose);
    var center = Matrix4.getTranslation(transform, scratchCenter);

    var positions = new Array(pointsLength);
    var normals = new Array(pointsLength);
    var batchIds = new Array(pointsLength);
    var colors = new Array(pointsLength);
    var noiseValues = new Array(pointsLength);

    for (var i = 0; i < pointsLength; ++i) {
        var unitPosition = getPosition(i, pointsLength);
        var position = shapeFunction(i, pointsLength, radius);
        var normal;
        if (Cartesian3.equals(position, Cartesian3.ZERO)) {
            normal = new Cartesian3(1.0, 0.0, 0.0);
        } else {
            normal = Cartesian3.normalize(position, new Cartesian3());
        }
        var batchId = getBatchId(unitPosition);
        var color = colorFunction(unitPosition);
        var noise = getNoise(unitPosition);

        Matrix4.multiplyByPoint(transform, position, position);
        Matrix4.multiplyByPointAsVector(inverseTranspose, normal, normal);
        Cartesian3.normalize(normal, normal);

        if (relativeToCenter || quantizePositions) {
            Cartesian3.subtract(position, center, position);
        }

        positions[i] = position;
        normals[i] = normal;
        batchIds[i] = batchId;
        colors[i] = color;
        noiseValues[i] = noise;
    }

    var positionAttribute = quantizePositions ? getPositionsQuantized(positions, radius) : getPositions(positions);
    var normalAttribute = octEncodeNormals ? getNormalsOctEncoded(normals) : getNormals(normals);
    var batchIdAttribute = getBatchIds(batchIds);
    var colorAttribute = defined(colorModeFunction) ? colorModeFunction(colors) : undefined;

    return {
        positions : positionAttribute,
        normals : normalAttribute,
        batchIds : batchIdAttribute,
        colors : colorAttribute,
        noiseValues : noiseValues // Not an attribute - just send this back for generating metadata
    };
}

function getPositions(positions) {
    var pointsLength = positions.length;
    var buffer = Buffer.alloc(pointsLength * 3 * sizeOfFloat32);
    for (var i = 0; i < pointsLength; ++i) {
        var position = positions[i];
        buffer.writeFloatLE(position.x, (i * 3) * sizeOfFloat32);
        buffer.writeFloatLE(position.y, (i * 3 + 1) * sizeOfFloat32);
        buffer.writeFloatLE(position.z, (i * 3 + 2) * sizeOfFloat32);
    }
    return {
        buffer : buffer,
        propertyName : 'POSITION',
        byteAlignment : sizeOfFloat32
    };
}

function getPositionsQuantized(positions, radius) {
    var min = -radius;
    var max = radius;
    var range = Math.pow(2, 16) - 1;
    var scale = max - min;
    var pointsLength = positions.length;
    var buffer = Buffer.alloc(pointsLength * 3 * sizeOfUint16);
    for (var i = 0; i < pointsLength; ++i) {
        var position = positions[i];
        var x = (position.x - min) * range / scale;
        var y = (position.y - min) * range / scale;
        var z = (position.z - min) * range / scale;
        buffer.writeUInt16LE(x, (i * 3) * sizeOfUint16);
        buffer.writeUInt16LE(y, (i * 3 + 1) * sizeOfUint16);
        buffer.writeUInt16LE(z, (i * 3 + 2) * sizeOfUint16);
    }
    return {
        buffer : buffer,
        propertyName : 'POSITION_QUANTIZED',
        byteAlignment : sizeOfUint16
    };
}

function getNormals(normals) {
    var pointsLength = normals.length;
    var buffer = Buffer.alloc(pointsLength * 3 * sizeOfFloat32);
    for (var i = 0; i < pointsLength; ++i) {
        var normal = normals[i];
        buffer.writeFloatLE(normal.x, (i * 3) * sizeOfFloat32);
        buffer.writeFloatLE(normal.y, (i * 3 + 1) * sizeOfFloat32);
        buffer.writeFloatLE(normal.z, (i * 3 + 2) * sizeOfFloat32);
    }
    return {
        buffer : buffer,
        propertyName : 'NORMAL',
        byteAlignment : sizeOfFloat32
    };
}

var scratchEncoded = new Cartesian2();

function getNormalsOctEncoded(normals) {
    var pointsLength = normals.length;
    var buffer = Buffer.alloc(pointsLength * 2 * sizeOfUint8);
    for (var i = 0; i < pointsLength; ++i) {
        var encodedNormal = AttributeCompression.octEncode(normals[i], scratchEncoded);
        buffer.writeUInt8(encodedNormal.x, i * 2);
        buffer.writeUInt8(encodedNormal.y, i * 2 + 1);
    }
    return {
        buffer : buffer,
        propertyName : 'NORMAL_OCT16P',
        byteAlignment : sizeOfUint8
    };
}

function getBatchIds(batchIds) {
    // Find the batch length which determines whether the BATCH_ID buffer is byte, short, or int.
    var i;
    var pointsLength = batchIds.length;
    var batchLength = 0;
    for (i = 0; i < pointsLength; ++i) {
        batchLength = Math.max(batchIds[i] + 1, batchLength);
    }

    var buffer;
    var byteAlignment;
    var componentType;
    if (batchLength <= 256) {
        buffer = Buffer.alloc(pointsLength * sizeOfUint8);
        for (i = 0; i < pointsLength; ++i) {
            buffer.writeUInt8(batchIds[i], i * sizeOfUint8);
        }
        componentType = 'UNSIGNED_BYTE';
        byteAlignment = sizeOfUint8;
    } else if (batchLength <= 65536) {
        buffer = Buffer.alloc(pointsLength * sizeOfUint16);
        for (i = 0; i < pointsLength; ++i) {
            buffer.writeUInt16LE(batchIds[i], i * sizeOfUint16);
        }
        componentType = 'UNSIGNED_SHORT';
        byteAlignment = sizeOfUint16;
    } else {
        buffer = Buffer.alloc(pointsLength * sizeOfUint32);
        for (i = 0; i < pointsLength; ++i) {
            buffer.writeUInt32LE(batchIds[i], i * sizeOfUint32);
        }
        componentType = 'UNSIGNED_INT';
        byteAlignment = sizeOfUint32;
    }

    return {
        buffer : buffer,
        propertyName : 'BATCH_ID',
        byteAlignment : byteAlignment,
        componentType : componentType,
        batchLength : batchLength
    };
}

function getColorsRGB(colors) {
    var colorsLength = colors.length;
    var buffer = Buffer.alloc(colorsLength * 3);
    for (var i = 0; i < colorsLength; ++i) {
        var color = colors[i];
        var r = Math.floor(color.red * 255);
        var g = Math.floor(color.green * 255);
        var b = Math.floor(color.blue * 255);
        buffer.writeUInt8(r, i * 3);
        buffer.writeUInt8(g, i * 3 + 1);
        buffer.writeUInt8(b, i * 3 + 2);
    }
    return {
        buffer : buffer,
        propertyName : 'RGB',
        byteAlignment : sizeOfUint8
    };
}

function getColorsRGBA(colors) {
    var colorsLength = colors.length;
    var buffer = Buffer.alloc(colorsLength * 4);
    for (var i = 0; i < colorsLength; ++i) {
        var color = colors[i];
        var r = Math.floor(color.red * 255);
        var g = Math.floor(color.green * 255);
        var b = Math.floor(color.blue * 255);
        var a = Math.floor(color.alpha * 128); // Make all alphas < 0.5 just so it's obvious
        buffer.writeUInt8(r, i * 4);
        buffer.writeUInt8(g, i * 4 + 1);
        buffer.writeUInt8(b, i * 4 + 2);
        buffer.writeUInt8(a, i * 4 + 3);
    }
    return {
        buffer : buffer,
        propertyName : 'RGBA',
        byteAlignment : sizeOfUint8
    };
}

function getColorsRGB565(colors) {
    var colorsLength = colors.length;
    var buffer = Buffer.alloc(colorsLength * sizeOfUint16);
    for (var i = 0; i < colorsLength; ++i) {
        var color = colors[i];
        var r = Math.floor(color.red * 31); // 5 bits
        var g = Math.floor(color.green * 63); // 6 bits
        var b = Math.floor(color.blue * 31); // 5 bits
        var packedColor = (r << 11) + (g << 5) + b;
        buffer.writeUInt16LE(packedColor, i * sizeOfUint16);
    }
    return {
        buffer : buffer,
        propertyName : 'RGB565',
        byteAlignment : sizeOfUint16
    };
}

function getBatchTableForBatchedPoints(batchLength) {
    // Create some sample per-batch properties. Each batch will have a name, dimension, and id.
    var names = new Array(batchLength); // JSON array
    var dimensionsBuffer = Buffer.alloc(batchLength * 3 * sizeOfFloat32); // Binary
    var idBuffer = Buffer.alloc(batchLength * sizeOfUint32); // Binary

    var batchTableJson = {
        name : names,
        dimensions : {
            byteOffset : 0,
            componentType : 'FLOAT',
            type : 'VEC3'
        },
        id : {
            byteOffset : dimensionsBuffer.length,
            componentType : 'UNSIGNED_INT',
            type : 'SCALAR'
        }
    };

    for (var i = 0; i < batchLength; ++i) {
        names[i] = 'section' + i;
        dimensionsBuffer.writeFloatLE(CesiumMath.nextRandomNumber(), (i * 3) * sizeOfFloat32);
        dimensionsBuffer.writeFloatLE(CesiumMath.nextRandomNumber(), (i * 3 + 1) * sizeOfFloat32);
        dimensionsBuffer.writeFloatLE(CesiumMath.nextRandomNumber(), (i * 3 + 2) * sizeOfFloat32);
        idBuffer.writeUInt32LE(i, i * sizeOfUint32);
    }

    // No need for padding with these sample properties
    var batchTableBinary = Buffer.concat([dimensionsBuffer, idBuffer]);

    return {
        json : batchTableJson,
        binary : batchTableBinary
    };
}

function getBatchTableForPerPointProperties(pointsLength, noiseValues) {
    // Create some sample per-point properties. Each point will have a temperature, secondary color, and id.
    var temperaturesBuffer = Buffer.alloc(pointsLength * sizeOfFloat32);
    var secondaryColorBuffer = Buffer.alloc(pointsLength * 3 * sizeOfFloat32);
    var idBuffer = Buffer.alloc(pointsLength * sizeOfUint16);

    var batchTableJson = {
        temperature : {
            byteOffset : 0,
            componentType : 'FLOAT',
            type : 'SCALAR'
        },
        secondaryColor : {
            byteOffset : temperaturesBuffer.length,
            componentType : 'FLOAT',
            type : 'VEC3'
        },
        id : {
            byteOffset : temperaturesBuffer.length + secondaryColorBuffer.length,
            componentType : 'UNSIGNED_SHORT',
            type : 'SCALAR'
        }
    };

    for (var i = 0; i < pointsLength; ++i) {
        var temperature = noiseValues[i];
        var secondaryColor = [CesiumMath.nextRandomNumber(), 0.0, 0.0];
        temperaturesBuffer.writeFloatLE(temperature, i * sizeOfFloat32);
        secondaryColorBuffer.writeFloatLE(secondaryColor[0], (i * 3) * sizeOfFloat32);
        secondaryColorBuffer.writeFloatLE(secondaryColor[1], (i * 3 + 1) * sizeOfFloat32);
        secondaryColorBuffer.writeFloatLE(secondaryColor[2], (i * 3 + 2) * sizeOfFloat32);
        idBuffer.writeUInt16LE(i, i * sizeOfUint16);
    }

    // No need for padding with these sample properties
    var batchTableBinary = Buffer.concat([temperaturesBuffer, secondaryColorBuffer, idBuffer]);

    return {
        json : batchTableJson,
        binary : batchTableBinary
    };
}
