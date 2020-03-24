'use strict';
var Cesium = require('cesium');
var draco3d = require('draco3d');
var SimplexNoise = require('simplex-noise');
var createPnts = require('./createPnts');
var Extensions = require('./Extensions');
var createGltfFromPnts = require('./createGltfFromPnts');
var typeConversion = require('./typeConversion');
var createFeatureMetadataExtension = require('./createFeatureMetadataExtension');

var AttributeCompression = Cesium.AttributeCompression;
var Cartesian2 = Cesium.Cartesian2;
var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var Color = Cesium.Color;
var ComponentDatatype = Cesium.ComponentDatatype;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var Matrix4 = Cesium.Matrix4;
var WebGLConstants = Cesium.WebGLConstants;

var sizeOfUint8 = 1;
var sizeOfUint16 = 2;
var sizeOfUint32 = 4;
var sizeOfFloat32 = 4;

CesiumMath.setRandomNumberSeed(0);
var simplex = new SimplexNoise(CesiumMath.nextRandomNumber);

var encoderModule = draco3d.createEncoderModule({});

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
 * @param {Boolean} [options.draco=false] Use draco encoding.
 * @param {String[]} [options.dracoSemantics] An array of semantics to draco encode. If undefined, all semantics are encoded.
 * @param {Boolean} [options.octEncodeNormals=false] Apply oct16p encoding on the point normals.
 * @param {Boolean} [options.quantizePositions=false] Quantize point positions so each x, y, z takes up 16 bits rather than 32 bits.
 * @param {Boolean} [options.batched=false] Group points together with batch ids and generate per-batch metadata. Good for differentiating different sections of a point cloud. Not compatible with perPointProperties.
 * @param {Boolean} [options.perPointProperties=false] Generate per-point metadata.
 * @param {Boolean} [options.relativeToCenter=true] Define point positions relative-to-center.
 * @param {Boolean} [options.time=0.0] Time value when generating 4D simplex noise.
 *
 * @returns {Object} An object containing the pnts buffer and batch table JSON.
 */
export function createPointCloudTile(options) {
    // Set the random number seed before creating each point cloud so that the generated points are the same between runs
    CesiumMath.setRandomNumberSeed(0);

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var use3dTilesNext = defaultValue(options.use3dTilesNext, false);
    var tileWidth = defaultValue(options.tileWidth, 10.0);
    var transform = defaultValue(options.transform, Matrix4.IDENTITY);
    var pointsLength = defaultValue(options.pointsLength, 1000);
    var colorMode = defaultValue(options.colorMode, 'rgb');
    var color = defaultValue(options.color, 'random');
    var shape = defaultValue(options.shape, 'box');
    var generateNormals = defaultValue(options.generateNormals, false);
    var draco = defaultValue(options.draco, false);
    var dracoSemantics = options.dracoSemantics;
    var octEncodeNormals =
        defaultValue(options.octEncodeNormals, false) && !draco;
    var quantizePositions =
        defaultValue(options.quantizePositions, false) && !draco;
    var batched = defaultValue(options.batched, false);
    var perPointProperties = defaultValue(options.perPointProperties, false);
    var relativeToCenter = defaultValue(options.relativeToCenter, true);
    var time = defaultValue(options.time, 0.0);

    if (colorMode === 'rgb565' && draco) {
        colorMode = 'rgb';
    }

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

    var points = getPoints(
        use3dTilesNext,
        pointsLength,
        radius,
        colorModeFunction,
        colorFunction,
        shapeFunction,
        quantizePositions,
        octEncodeNormals,
        relativeToCenter,
        transform,
        time
    ) as any;
    var positions = points.positions;
    var normals = points.normals;
    var batchIds = points.batchIds;
    var colors = points.colors;
    var noiseValues = points.noiseValues;
    var featureTableAttribute = points.featureTableAttribute;

    var featureTableProperties = [positions];
    if (defined(colors)) {
        featureTableProperties.push(colors);
    }
    if (generateNormals) {
        featureTableProperties.push(normals);
    }
    if (batched) {
        featureTableProperties.push(batchIds);
    }

    var batchTableProperties = [];
    if (perPointProperties) {
        batchTableProperties = getPerPointBatchTableProperties(
            pointsLength,
            noiseValues,
            use3dTilesNext
        );
    }

    var featureTableJson: any = {};
    var featureTableBinary = Buffer.alloc(0);

    var batchTableJson: any = {};
    var batchTableBinary = Buffer.alloc(0);

    var extensions: any = {};

    var dracoBuffer;
    var dracoFeatureTableJson;
    var dracoBatchTableJson;

    if (draco) {
        var dracoResults = dracoEncode(
            pointsLength,
            dracoSemantics,
            featureTableProperties,
            batchTableProperties
        );
        dracoBuffer = dracoResults.buffer;
        dracoFeatureTableJson = dracoResults.dracoFeatureTableJson;
        dracoBatchTableJson = dracoResults.dracoBatchTableJson;
        featureTableBinary = Buffer.concat([featureTableBinary, dracoBuffer]);

        if (defined(dracoFeatureTableJson)) {
            Extensions.addExtension(
                featureTableJson,
                '3DTILES_draco_point_compression',
                dracoFeatureTableJson
            );
        }
        if (defined(dracoBatchTableJson)) {
            Extensions.addExtension(
                batchTableJson,
                '3DTILES_draco_point_compression',
                dracoBatchTableJson
            );
        }

        Extensions.addExtensionsRequired(
            extensions,
            '3DTILES_draco_point_compression'
        );
        Extensions.addExtensionsUsed(
            extensions,
            '3DTILES_draco_point_compression'
        );
    }

    var i;
    var property;
    var name;
    var componentType;
    var byteOffset;
    var byteAlignment;
    var padding;

    for (i = 0; i < featureTableProperties.length; ++i) {
        property = featureTableProperties[i];
        name = property.propertyName;
        componentType = property.componentType;
        byteOffset = 0;
        if (
            !(
                defined(dracoFeatureTableJson) &&
                defined(dracoFeatureTableJson.properties[name])
            )
        ) {
            byteAlignment = ComponentDatatype.getSizeInBytes(
                ComponentDatatype[componentType]
            );
            byteOffset =
                Math.ceil(featureTableBinary.length / byteAlignment) *
                byteAlignment; // Round up to the required alignment
            padding = Buffer.alloc(byteOffset - featureTableBinary.length);
            featureTableBinary = Buffer.concat([
                featureTableBinary,
                padding,
                property.buffer
            ]);
        }
        featureTableJson[name] = {
            byteOffset: byteOffset,
            componentType: name === 'BATCH_ID' ? componentType : undefined
        };
    }

    for (i = 0; i < batchTableProperties.length; ++i) {
        property = batchTableProperties[i];
        name = property.propertyName;
        componentType = property.componentType;
        byteOffset = 0;
        if (
            !(
                defined(dracoBatchTableJson) &&
                defined(dracoBatchTableJson.properties[name])
            )
        ) {
            byteAlignment = ComponentDatatype.getSizeInBytes(
                ComponentDatatype[componentType]
            );
            byteOffset =
                Math.ceil(batchTableBinary.length / byteAlignment) *
                byteAlignment; // Round up to the required alignment
            padding = Buffer.alloc(byteOffset - batchTableBinary.length);
            batchTableBinary = Buffer.concat([
                batchTableBinary,
                padding,
                property.buffer
            ]);
        }

        batchTableJson[name] = {
            byteOffset: byteOffset,
            componentType: componentType,
            type: property.type
        };

        if (use3dTilesNext) {
            batchTableJson[name].name = name;
            batchTableJson[name].count = property.count;
            batchTableJson[name].byteLength = property.buffer.length;
            batchTableJson[name].min = property.min;
            batchTableJson[name].max = property.max;
        }
    }

    featureTableJson.POINTS_LENGTH = pointsLength;

    if (defined(constantColor)) {
        featureTableJson.CONSTANT_RGBA = constantColor;
    }

    if (quantizePositions) {
        // Quantized offset is the lower left, unlike RTC_CENTER which is the center
        featureTableJson.QUANTIZED_VOLUME_SCALE = [
            tileWidth,
            tileWidth,
            tileWidth
        ];
        featureTableJson.QUANTIZED_VOLUME_OFFSET = [
            center.x - radius,
            center.y - radius,
            center.z - radius
        ];
    } else if (relativeToCenter) {
        featureTableJson.RTC_CENTER = [center.x, center.y, center.z];
    }

    if (batched) {
        var batchTable = getBatchTableForBatchedPoints(
            batchIds.batchLength,
            use3dTilesNext
        );
        batchTableJson = batchTable.json;
        batchTableBinary = batchTable.binary;
        featureTableJson.BATCH_LENGTH = batchIds.batchLength;
    }

    var gltf;
    var pnts;

    if (options.use3dTilesNext) {
        var bufferAttributes = [positions];

        if (generateNormals) {
            bufferAttributes.push(normals);
        }

        if (defined(colors)) {
            bufferAttributes.push(colors);
        }

        if (batched) {
            bufferAttributes.push(batchIds);
        }

        if (perPointProperties) {
            bufferAttributes.push(featureTableAttribute);
        }

        gltf = createGltfFromPnts(
            bufferAttributes,
            undefined,
            featureTableJson.RTC_CENTER
        );
        if (defined(batchTableJson) && Object.keys(batchTableJson).length > 0) {
            gltf = createFeatureMetadataExtension(
                gltf,
                batchTableJson,
                batchTableBinary
            );
        }
    } else {
        pnts = createPnts({
            featureTableJson: featureTableJson,
            featureTableBinary: featureTableBinary,
            batchTableJson: batchTableJson,
            batchTableBinary: batchTableBinary
        });
    }

    return {
        gltf: gltf,
        pnts: pnts,
        batchTableJson: batchTableJson,
        extensions: extensions
    };
}

function getAddAttributeFunctionName(componentDatatype) {
    switch (componentDatatype) {
        case WebGLConstants.UNSIGNED_BYTE:
            return 'AddUInt8Attribute';
        case WebGLConstants.BYTE:
            return 'AddInt8Attribute';
        case WebGLConstants.UNSIGNED_SHORT:
            return 'AddUInt16Attribute';
        case WebGLConstants.SHORT:
            return 'AddInt16Attribute';
        case WebGLConstants.UNSIGNED_INT:
            return 'AddUInt32Attribute';
        case WebGLConstants.INT:
            return 'AddInt32Attribute';
        case WebGLConstants.FLOAT:
            return 'AddFloatAttribute';
    }
}

function getDracoType(name) {
    switch (name) {
        case 'POSITION':
            return encoderModule.POSITION;
        case 'NORMAL':
            return encoderModule.NORMAL;
        case 'RGB':
        case 'RGBA':
            return encoderModule.COLOR;
        default:
            return encoderModule.GENERIC;
    }
}

function dracoEncodeProperties(pointsLength, properties, preserveOrder) {
    var i;
    var encoder = new encoderModule.Encoder();
    var pointCloudBuilder = new encoderModule.PointCloudBuilder();
    var pointCloud = new encoderModule.PointCloud();

    var attributeIds = {};

    var length = properties.length;
    for (i = 0; i < length; ++i) {
        var property = properties[i];
        var componentDatatype = ComponentDatatype[property.componentType];
        var typedArray = ComponentDatatype.createArrayBufferView(
            componentDatatype,
            property.buffer.buffer
        );
        var numberOfComponents = typeConversion.elementTypeToCount(
            property.type
        );
        var addAttributeFunctionName = getAddAttributeFunctionName(
            componentDatatype
        );
        var name = property.propertyName;
        var dracoType = getDracoType(name);
        attributeIds[name] = pointCloudBuilder[addAttributeFunctionName](
            pointCloud,
            dracoType,
            pointsLength,
            numberOfComponents,
            typedArray
        );
    }

    var dracoCompressionSpeed = 7;
    var dracoPositionBits = 14;
    var dracoNormalBits = 8;
    var dracoColorBits = 8;
    var dracoGenericBits = 12;

    encoder.SetSpeedOptions(dracoCompressionSpeed);
    encoder.SetAttributeQuantization(encoderModule.POSITION, dracoPositionBits);
    encoder.SetAttributeQuantization(encoderModule.NORMAL, dracoNormalBits);
    encoder.SetAttributeQuantization(encoderModule.COLOR, dracoColorBits);
    encoder.SetAttributeQuantization(encoderModule.GENERIC, dracoGenericBits);

    if (preserveOrder) {
        encoder.SetEncodingMethod(
            encoderModule.POINT_CLOUD_SEQUENTIAL_ENCODING
        );
    }

    var encodedDracoDataArray = new encoderModule.DracoInt8Array();

    var encodedLength = encoder.EncodePointCloudToDracoBuffer(
        pointCloud,
        false,
        encodedDracoDataArray
    );
    if (encodedLength <= 0) {
        throw 'Error: Draco encoding failed.';
    }

    var encodedData = Buffer.alloc(encodedLength);
    for (i = 0; i < encodedLength; i++) {
        encodedData[i] = encodedDracoDataArray.GetValue(i);
    }

    encoderModule.destroy(encoder);
    encoderModule.destroy(pointCloudBuilder);
    encoderModule.destroy(pointCloud);
    encoderModule.destroy(encodedDracoDataArray);

    return {
        buffer: encodedData,
        attributeIds: attributeIds
    };
}

function getPropertyByName(properties, name) {
    return properties.find(function (element) {
        return element.propertyName === name;
    });
}

function dracoEncode(
    pointsLength,
    dracoSemantics,
    featureTableProperties,
    batchTableProperties
) {
    var dracoProperties = [];
    if (!defined(dracoSemantics)) {
        dracoProperties = dracoProperties.concat(featureTableProperties);
    } else {
        for (var i = 0; i < dracoSemantics.length; ++i) {
            dracoProperties.push(
                getPropertyByName(featureTableProperties, dracoSemantics[i])
            );
        }
    }
    dracoProperties = dracoProperties.concat(batchTableProperties);

    // Check if normals are being encoded.
    // Currently the octahedron transform for normals only works if preserveOrder is true.
    // See https://github.com/google/draco/issues/383
    var encodeNormals = defined(getPropertyByName(dracoProperties, 'NORMAL'));
    var hasUncompressedAttributes =
        dracoProperties.length <
        featureTableProperties.length + batchTableProperties.length;
    var preserveOrder = encodeNormals || hasUncompressedAttributes;

    var dracoResults = dracoEncodeProperties(
        pointsLength,
        dracoProperties,
        preserveOrder
    );
    var dracoBuffer = dracoResults.buffer;
    var dracoAttributeIds = dracoResults.attributeIds;

    var dracoFeatureTableJson = {
        properties: {},
        byteOffset: 0,
        byteLength: dracoBuffer.length
    };
    var dracoBatchTableJson = {
        properties: {}
    };

    for (var name in dracoAttributeIds) {
        if (dracoAttributeIds.hasOwnProperty(name)) {
            if (defined(getPropertyByName(featureTableProperties, name))) {
                dracoFeatureTableJson.properties[name] =
                    dracoAttributeIds[name];
            }
            if (defined(getPropertyByName(batchTableProperties, name))) {
                dracoBatchTableJson.properties[name] = dracoAttributeIds[name];
            }
        }
    }

    if (Object.keys(dracoFeatureTableJson).length === 0) {
        dracoFeatureTableJson = undefined;
    }
    if (Object.keys(dracoBatchTableJson).length === 0) {
        dracoBatchTableJson = undefined;
    }

    return {
        buffer: dracoBuffer,
        dracoFeatureTableJson: dracoFeatureTableJson,
        dracoBatchTableJson: dracoBatchTableJson
    };
}

// Return a position in the range of (-0.5, -0.5, -0.5) to (0.5, 0.5, 0.5) based on the index
function getPosition(i, pointsLength) {
    var width = Math.round(Math.pow(pointsLength, 1 / 3));
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

function sphereFunction(i, pointsLength, radius) {
    //eslint-disable-line no-unused-vars
    var theta = CesiumMath.nextRandomNumber() * 2 * Math.PI;
    var phi = CesiumMath.nextRandomNumber() * Math.PI - Math.PI / 2.0;
    var x = radius * Math.cos(theta) * Math.cos(phi);
    var y = radius * Math.sin(phi);
    var z = radius * Math.sin(theta) * Math.cos(phi);
    return new Cartesian3(x, y, z);
}

//eslint-disable-line no-unused-vars
function randomFunction(position) {
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
    return function (position) {
        var noise = getNoise(position, time);
        return new Color(noise, noise, noise, noise);
    };
}

function getBatchId(position) {
    // Set to batchId to 0-7 depending on which octant the position is in
    var x = position.x > 0 ? 0 : 1;
    var y = position.y > 0 ? 0 : 1;
    var z = position.z > 0 ? 0 : 1;

    return (x << 2) | (y << 1) | z;
}

var scratchMatrix = new Matrix4();
var scratchCenter = new Cartesian3();

function getPoints(
    use3dTilesNext,
    pointsLength,
    radius,
    colorModeFunction,
    colorFunction,
    shapeFunction,
    quantizePositions,
    octEncodeNormals,
    relativeToCenter,
    transform,
    time
) {
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
        var batchId = getBatchId(position);
        var color = colorFunction(unitPosition);
        var noise = getNoise(unitPosition, time);

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

    var positionAttribute = quantizePositions
        ? getPositionsQuantized(positions, radius)
        : getPositions(positions, use3dTilesNext);
    var normalAttribute = octEncodeNormals
        ? getNormalsOctEncoded(normals)
        : getNormals(normals, use3dTilesNext);
    var batchIdAttribute = getBatchIds(batchIds, use3dTilesNext);
    var colorAttribute = defined(colorModeFunction)
        ? colorModeFunction(colors, use3dTilesNext)
        : undefined;

    var featureTableAttribute;
    if (use3dTilesNext) {
        featureTableAttribute = {
            buffer: Buffer.alloc(0),
            propertyName: '_FEATURE_ID_0',
            componentType: 'UNSIGNED_INT',
            type: 'SCALAR',
            min: [0],
            max: [pointsLength - 1],
            count: pointsLength
        };
    }

    var result: any = {
        positions: positionAttribute,
        normals: normalAttribute,
        batchIds: batchIdAttribute,
        colors: colorAttribute,
        noiseValues: noiseValues // Not an attribute - just send this back for generating metadata
    };

    if (use3dTilesNext) {
        result.featureTableAttribute = featureTableAttribute;
    }

    return result;
}

function getPositions(positions, use3dTilesNext) {
    var pointsLength = positions.length;
    var buffer = Buffer.alloc(pointsLength * 3 * sizeOfFloat32);

    var components = 3;
    var minComp = new Array(components).fill(Number.POSITIVE_INFINITY);
    var maxComp = new Array(components).fill(Number.NEGATIVE_INFINITY);

    for (var i = 0; i < pointsLength; ++i) {
        var position = positions[i];
        buffer.writeFloatLE(position.x, i * 3 * sizeOfFloat32);
        buffer.writeFloatLE(position.y, (i * 3 + 1) * sizeOfFloat32);
        buffer.writeFloatLE(position.z, (i * 3 + 2) * sizeOfFloat32);
        minComp[0] = Math.min(minComp[0], position.x);
        minComp[1] = Math.min(minComp[1], position.y);
        minComp[2] = Math.min(minComp[2], position.z);
        maxComp[0] = Math.max(maxComp[0], position.x);
        maxComp[1] = Math.max(maxComp[1], position.y);
        maxComp[2] = Math.max(maxComp[2], position.z);
    }

    var result: any = {
        buffer: buffer,
        propertyName: 'POSITION',
        componentType: 'FLOAT',
        type: 'VEC3'
    };

    if (use3dTilesNext) {
        result.min = minComp;
        result.max = maxComp;
        result.count = pointsLength;
    }

    return result;
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
        var x = ((position.x - min) * range) / scale;
        var y = ((position.y - min) * range) / scale;
        var z = ((position.z - min) * range) / scale;
        buffer.writeUInt16LE(x, i * 3 * sizeOfUint16);
        buffer.writeUInt16LE(y, (i * 3 + 1) * sizeOfUint16);
        buffer.writeUInt16LE(z, (i * 3 + 2) * sizeOfUint16);
    }

    return {
        buffer: buffer,
        propertyName: 'POSITION_QUANTIZED',
        componentType: 'UNSIGNED_SHORT',
        type: 'VEC3'
    };
}

function getNormals(normals, use3dTilesNext) {
    var pointsLength = normals.length;
    var buffer = Buffer.alloc(pointsLength * 3 * sizeOfFloat32);

    var components = 3;
    var minComp = new Array(components).fill(Number.POSITIVE_INFINITY);
    var maxComp = new Array(components).fill(Number.NEGATIVE_INFINITY);

    for (var i = 0; i < pointsLength; ++i) {
        var normal = normals[i];
        buffer.writeFloatLE(normal.x, i * 3 * sizeOfFloat32);
        buffer.writeFloatLE(normal.y, (i * 3 + 1) * sizeOfFloat32);
        buffer.writeFloatLE(normal.z, (i * 3 + 2) * sizeOfFloat32);
        minComp[0] = Math.min(minComp[0], normal.x);
        minComp[1] = Math.min(minComp[1], normal.y);
        minComp[2] = Math.min(minComp[2], normal.z);
        maxComp[0] = Math.max(maxComp[0], normal.x);
        maxComp[1] = Math.max(maxComp[1], normal.y);
        maxComp[2] = Math.max(maxComp[2], normal.z);
    }

    var result: any = {
        buffer: buffer,
        propertyName: 'NORMAL',
        componentType: 'FLOAT',
        type: 'VEC3'
    };

    if (use3dTilesNext) {
        result.min = minComp;
        result.max = maxComp;
        result.count = pointsLength;
    }

    return result;
}

var scratchEncoded = new Cartesian2();

function getNormalsOctEncoded(normals) {
    var pointsLength = normals.length;
    var buffer = Buffer.alloc(pointsLength * 2 * sizeOfUint8);

    for (var i = 0; i < pointsLength; ++i) {
        var encodedNormal = AttributeCompression.octEncode(
            normals[i],
            scratchEncoded
        );
        buffer.writeUIntLE(encodedNormal.x, i * 2, sizeOfUint8);
        buffer.writeUIntLE(encodedNormal.y, i * 2 + 1, sizeOfUint8);
    }

    return {
        buffer: buffer,
        propertyName: 'NORMAL_OCT16P',
        componentType: 'UNSIGNED_BYTE',
        type: 'VEC2'
    };
}

/**
 * Generates a list of batchIds
 * @param {Array.<Number>} batchIds A list of batchIds
 * @param {Boolean} use3dTilesNext Force uint32 mode, use prefix naming for attribute
 * @returns {Object} A bufferAttribute containing the necessary information for encoding to
 *                   a .pnts / .gltf / .glb
 */
function getBatchIds(batchIds, use3dTilesNext) {
    // Find the batch length which determines whether the BATCH_ID buffer is byte, short, or int.
    var i;
    var pointsLength = batchIds.length;
    var batchLength = 0;
    for (i = 0; i < pointsLength; ++i) {
        batchLength = Math.max(batchIds[i] + 1, batchLength);
    }

    var minComp = [Number.POSITIVE_INFINITY];
    var maxComp = [Number.NEGATIVE_INFINITY];

    var buffer;
    var componentType;

    if (use3dTilesNext || batchLength > 65535) {
        buffer = Buffer.alloc(pointsLength * sizeOfUint32);
        for (i = 0; i < pointsLength; ++i) {
            minComp[0] = Math.min(minComp[0], batchIds[i]);
            maxComp[0] = Math.max(maxComp[0], batchIds[i]);
            buffer.writeUInt32LE(batchIds[i], i * sizeOfUint32);
        }
        componentType = 'UNSIGNED_INT';
    } else if (batchLength > 255 && batchLength < 65536) {
        buffer = Buffer.alloc(pointsLength * sizeOfUint16);
        for (i = 0; i < pointsLength; ++i) {
            minComp[0] = Math.min(minComp[0], batchIds[i]);
            maxComp[0] = Math.max(maxComp[0], batchIds[i]);
            buffer.writeUInt16LE(batchIds[i], i * sizeOfUint16);
        }
        componentType = 'UNSIGNED_SHORT';
    } else {
        buffer = Buffer.alloc(pointsLength * sizeOfUint8);
        for (i = 0; i < pointsLength; ++i) {
            buffer.writeUInt8(batchIds[i], i * sizeOfUint8);
            minComp[0] = Math.min(minComp[0], batchIds[i]);
            maxComp[0] = Math.max(maxComp[0], batchIds[i]);
        }
        componentType = 'UNSIGNED_BYTE';
    }

    var result: any = {
        buffer: buffer,
        propertyName: use3dTilesNext ? '_FEATURE_ID_0' : 'BATCH_ID',
        componentType: componentType,
        type: 'SCALAR',
        batchLength: batchLength
    };

    if (use3dTilesNext) {
        result.min = minComp;
        result.max = maxComp;
        result.count = pointsLength;
    }

    return result;
}

/**
 *
 * @param {Object[]} colors List of colors to use
 * @param {Boolean} use3dTilesNext Forces RGB mode with an extra padding byte
 * after each b component due to byte alignment requirements in glTF.
 */
function getColorsRGB(colors, use3dTilesNext) {
    var colorsLength = colors.length;
    var multiple = use3dTilesNext ? 4 : 3;
    var buffer = Buffer.alloc(colorsLength * multiple);

    var minComp = new Array(3).fill(Number.POSITIVE_INFINITY);
    var maxComp = new Array(3).fill(Number.NEGATIVE_INFINITY);

    for (var i = 0; i < colorsLength; ++i) {
        var color = colors[i];
        var r = Math.floor(color.red * 255);
        var g = Math.floor(color.green * 255);
        var b = Math.floor(color.blue * 255);

        buffer.writeUInt8(r, i * multiple);
        buffer.writeUInt8(g, i * multiple + 1);
        buffer.writeUInt8(b, i * multiple + 2);

        if (use3dTilesNext) {
            buffer.writeUInt8(0, i * multiple + 3);
        }

        minComp[0] = Math.min(minComp[0], r);
        minComp[1] = Math.min(minComp[1], g);
        minComp[2] = Math.min(minComp[2], b);
        maxComp[0] = Math.max(maxComp[0], r);
        maxComp[1] = Math.max(maxComp[1], g);
        maxComp[2] = Math.max(maxComp[2], b);
    }

    var result: any = {
        buffer: buffer,
        propertyName: use3dTilesNext ? 'COLOR_0' : 'RGB',
        componentType: 'UNSIGNED_BYTE',
        type: 'VEC3'
    };

    if (use3dTilesNext) {
        result.min = minComp;
        result.max = maxComp;
        result.count = colorsLength;
        result.normalized = true;
        result.byteStride = 4;
    }

    return result;
}

function getColorsRGBA(colors, use3dTilesNext) {
    var colorsLength = colors.length;
    var buffer = Buffer.alloc(colorsLength * 4);

    var components = 4;
    var minComp = new Array(components).fill(Number.POSITIVE_INFINITY);
    var maxComp = new Array(components).fill(Number.NEGATIVE_INFINITY);

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

        minComp[0] = Math.min(minComp[0], r);
        minComp[1] = Math.min(minComp[1], g);
        minComp[2] = Math.min(minComp[2], b);
        minComp[3] = Math.min(minComp[3], a);
        maxComp[0] = Math.max(maxComp[0], r);
        maxComp[1] = Math.max(maxComp[1], g);
        maxComp[2] = Math.max(maxComp[2], b);
        maxComp[3] = Math.max(maxComp[3], a);
    }

    var result: any = {
        buffer: buffer,
        propertyName: use3dTilesNext ? 'COLOR_0' : 'RGBA',
        componentType: 'UNSIGNED_BYTE',
        type: 'VEC4'
    };

    if (use3dTilesNext) {
        result.min = minComp;
        result.max = maxComp;
        result.count = colorsLength;
        result.normalized = true;
        result.byteStride = 4;
    }

    return result;
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
        buffer: buffer,
        propertyName: 'RGB565',
        componentType: 'UNSIGNED_SHORT',
        type: 'SCALAR'
    };
}

function getBatchTableForBatchedPoints(batchLength, use3dTilesNext) {
    // Create some sample per-batch properties. Each batch will have a name, dimension, and id.
    var names = new Array(batchLength); // JSON array
    var dimensionsBuffer = Buffer.alloc(batchLength * 3 * sizeOfFloat32); // Binary
    var idBuffer = Buffer.alloc(batchLength * sizeOfUint32); // Binary

    var batchTableJson: any = {
        name: names,
        dimensions: {
            byteOffset: 0,
            componentType: 'FLOAT',
            type: 'VEC3'
        },
        id: {
            byteOffset: dimensionsBuffer.length,
            componentType: 'UNSIGNED_INT',
            type: 'SCALAR'
        }
    };

    if (use3dTilesNext) {
        batchTableJson.dimensions.name = 'dimensions';
        batchTableJson.dimensions.count = batchLength;
        batchTableJson.dimensions.byteLength = dimensionsBuffer.length;
        batchTableJson.id.name = 'id';
        batchTableJson.id.count = batchLength;
        batchTableJson.id.byteLength = idBuffer.length;
    }

    var minDimension = new Array(3).fill(Number.POSITIVE_INFINITY);
    var maxDimension = new Array(3).fill(Number.NEGATIVE_INFINITY);
    var minId = [0];
    var maxId = [batchLength - 1];

    for (var i = 0; i < batchLength; ++i) {
        names[i] = 'section' + i;
        var r1 = CesiumMath.nextRandomNumber();
        var r2 = CesiumMath.nextRandomNumber();
        var r3 = CesiumMath.nextRandomNumber();
        dimensionsBuffer.writeFloatLE(r1, i * 3 * sizeOfFloat32);
        dimensionsBuffer.writeFloatLE(r2, (i * 3 + 1) * sizeOfFloat32);
        dimensionsBuffer.writeFloatLE(r3, (i * 3 + 2) * sizeOfFloat32);
        maxDimension[0] = Math.max(maxDimension[0], r1);
        maxDimension[1] = Math.max(maxDimension[1], r2);
        maxDimension[2] = Math.max(maxDimension[2], r3);
        minDimension[0] = Math.min(minDimension[0], r1);
        minDimension[1] = Math.min(minDimension[1], r2);
        minDimension[2] = Math.min(minDimension[2], r3);
        idBuffer.writeUInt32LE(i, i * sizeOfUint32);
    }

    if (use3dTilesNext) {
        batchTableJson.dimensions.min = minDimension;
        batchTableJson.dimensions.max = maxDimension;
        batchTableJson.id.min = minId;
        batchTableJson.id.max = maxId;
    }

    // No need for padding with these sample properties
    var batchTableBinary = Buffer.concat([dimensionsBuffer, idBuffer]);

    return {
        json: batchTableJson,
        binary: batchTableBinary
    };
}

function getPerPointBatchTableProperties(
    pointsLength,
    noiseValues,
    use3dTilesNext
) {
    // Create some sample per-point properties. Each point will have a temperature, secondary color, and id.
    var temperaturesBuffer = Buffer.alloc(pointsLength * sizeOfFloat32);
    var secondaryColorBuffer = Buffer.alloc(pointsLength * 3 * sizeOfFloat32);
    var idBuffer = Buffer.alloc(pointsLength * sizeOfUint16);

    var minTempComp = [Number.POSITIVE_INFINITY];
    var maxTempComp = [Number.NEGATIVE_INFINITY];
    var minSecondaryColorComp = new Array(3).fill(Number.POSITIVE_INFINITY);
    var maxSecondaryColorComp = new Array(3).fill(Number.NEGATIVE_INFINITY);

    var minId = [0];
    var maxId = [pointsLength - 1];

    for (var i = 0; i < pointsLength; ++i) {
        var temperature = noiseValues[i];
        var secondaryColor = [CesiumMath.nextRandomNumber(), 0.0, 0.0];
        temperaturesBuffer.writeFloatLE(temperature, i * sizeOfFloat32);
        secondaryColorBuffer.writeFloatLE(
            secondaryColor[0],
            i * 3 * sizeOfFloat32
        );
        secondaryColorBuffer.writeFloatLE(
            secondaryColor[1],
            (i * 3 + 1) * sizeOfFloat32
        );
        secondaryColorBuffer.writeFloatLE(
            secondaryColor[2],
            (i * 3 + 2) * sizeOfFloat32
        );
        idBuffer.writeUInt16LE(i, i * sizeOfUint16);

        minTempComp[0] = Math.min(minTempComp[0], temperature);
        maxTempComp[0] = Math.max(maxTempComp[0], temperature);
        minSecondaryColorComp[0] = Math.min(
            minSecondaryColorComp[0],
            secondaryColor[0]
        );
        minSecondaryColorComp[1] = Math.min(
            minSecondaryColorComp[1],
            secondaryColor[1]
        );
        minSecondaryColorComp[2] = Math.min(
            minSecondaryColorComp[2],
            secondaryColor[2]
        );
        maxSecondaryColorComp[0] = Math.max(
            maxSecondaryColorComp[0],
            secondaryColor[0]
        );
        maxSecondaryColorComp[1] = Math.max(
            maxSecondaryColorComp[1],
            secondaryColor[1]
        );
        maxSecondaryColorComp[2] = Math.max(
            maxSecondaryColorComp[2],
            secondaryColor[2]
        );
    }

    var result: any = [
        {
            buffer: temperaturesBuffer,
            propertyName: 'temperature',
            componentType: 'FLOAT',
            type: 'SCALAR'
        },
        {
            buffer: secondaryColorBuffer,
            propertyName: 'secondaryColor',
            componentType: 'FLOAT',
            type: 'VEC3'
        },
        {
            buffer: idBuffer,
            propertyName: 'id',
            componentType: 'UNSIGNED_SHORT',
            type: 'SCALAR'
        }
    ];

    if (use3dTilesNext) {
        result[0].min = minTempComp;
        result[0].max = maxTempComp;
        result[0].count = pointsLength;
        result[1].min = minSecondaryColorComp;
        result[1].max = maxSecondaryColorComp;
        result[1].count = pointsLength;
        result[2].min = minId;
        result[2].max = maxId;
        result[2].count = pointsLength;
    }

    return result;
}
