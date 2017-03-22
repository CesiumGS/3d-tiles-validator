'use strict';
var Cesium = require('cesium');
var path = require('path');
var Promise = require('bluebird');
var SimplexNoise = require('simplex-noise');
var createGltf = require('./createGltf');
var createB3dm = require('./createB3dm');
var Material = require('./Material');
var Mesh = require('./Mesh');
var saveTile = require('./saveTile');
var saveTilesetJson = require('./saveTilesetJson');

var Cartesian3 = Cesium.Cartesian3;
var Cartographic = Cesium.Cartographic;
var CesiumMath = Cesium.Math;
var defaultValue = Cesium.defaultValue;
var Ellipsoid = Cesium.Ellipsoid;
var Rectangle = Cesium.Rectangle;

module.exports = createGlobalTileset;

CesiumMath.setRandomNumberSeed(0);
var simplex = new SimplexNoise(CesiumMath.nextRandomNumber);

var material = new Material({
    diffuse : [0.5, 0.5, 0.5, 1.0],
    ambient : [0.2, 0.2, 0.2, 1.0]
});

var scratchCartographic1 = new Cartographic();
var scratchCartographic2 = new Cartographic();
var scratchCartesian1 = new Cartesian3();
var scratchCartesian2 = new Cartesian3();

var scratchEdges = [new Cartesian3(), new Cartesian3(), new Cartesian3(), new Cartesian3()];
var scratchTriangleNormals = [new Cartesian3(), new Cartesian3()];
var scratchNormal = new Cartesian3();

var scratchPositionsWithNeighbors;
var scratchFaceNormals;
var scratchMesh;

// TODO : add doc
// TODO : out of core needed? Keeping a huge tileset.json in memory won't work
function createGlobalTileset(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var levels = options.levels;
    var rectangle = options.rectangle;
    var tessellation = Math.max(defaultValue(options.tessellation, 4), 1);
    var noiseFrequency = defaultValue(options.noiseFrequency, 100.0);
    var noiseStrength = defaultValue(options.noiseStrength, 100.0);
    var globe = defaultValue(options.globe, false);
    var explicitTilingScheme = defaultValue(options.explicitTilingScheme, false);

    var directory = options.directory;
    var gzip = defaultValue(options.gzip, true);
    var prettyJson = defaultValue(options.prettyJson, true);
    var tilePromises = [];

    initializeScratchVariables(tessellation);

    var gltfOptions = {
        useBatchIds : false,
        optimizeForCesium : options.optimizeForCesium,
        relativeToCenter : options.relativeToCenter
    };

    var quadtreeOptions = {
        levels : levels,
        rootRectangle : rectangle,
        tessellation : tessellation,
        noiseFrequency : noiseFrequency,
        noiseStrength : noiseStrength,
        globe : globe,
        explicitTilingScheme : explicitTilingScheme,
        tilePromises : tilePromises,
        directory : directory,
        gzip : gzip,
        gltfOptions : gltfOptions
    };

    var rootTileJson = createQuadtree(rectangle, 0, 0, 0, quadtreeOptions);

    if (globe) {
        // Replace the root region with a sphere
        // Slightly off-center so Cesium doesn't crash
        delete rootTileJson.boundingVolume.region;
        var radius = Cartesian3.maximumComponent(Ellipsoid.WGS84.radii);
        rootTileJson.boundingVolume.sphere = [0.1, 0.0, 0.0, radius];
    }

    var geometricError = rootTileJson.geometricError;
    fixGeometricError(rootTileJson);

    var tilesetJson = createTilesetJson(rootTileJson, geometricError, explicitTilingScheme);
    var tilesetJsonPath = path.join(directory, 'tileset.json');

    return Promise.all([
        tilePromises,
        saveTilesetJson(tilesetJsonPath, tilesetJson, prettyJson)
    ]);
}

function fixGeometricError(tileJson) {
    // Set the tile's geometric error to be the maximum geometric error of its children.
    // If the tile does not have children, its geometric error will be 0
    var i;
    var length = tileJson.children.length;
    var geometricError = 0.0;
    for (i = 0; i < length; ++i) {
        var child = tileJson.children[i];
        geometricError = Math.max(geometricError, child.geometricError);
    }
    tileJson.geometricError = geometricError;

    for (i = 0; i < length; ++i) {
        fixGeometricError(tileJson.children[i]);
    }
}

function createTilesetJson(rootTileJson, geometricError, explicitTilingScheme) {
    return {
        asset : {
            version : '0.0'
        },
        geometricError : geometricError,
        root: rootTileJson
    };
}

function createTileJson(rectangle, minHeight, maxHeight, geometricError, url, children) {
    return {
        boundingVolume : {
            region : [rectangle.west, rectangle.south, rectangle.east, rectangle.north, minHeight, maxHeight]
        },
        geometricError : geometricError,
        refine : 'replace',
        content : {
            url : url
        },
        children : children
    };
}

function createQuadtree(rectangle, level, x, y, options) {
    var isRoot = level === 0;
    var isLeaf = level === options.levels;
    var meshInfo = createMesh(rectangle, options);
    var mesh = meshInfo.mesh;
    var minHeight = meshInfo.minHeight;
    var maxHeight = meshInfo.maxHeight;
    var geometricError = meshInfo.geometricError;

    var tileName = level + '/' + x + '/' + y + '.b3dm';
    var tilePath = path.normalize(path.join(options.directory, tileName));
    options.tilePromises.push(createB3dmContents(mesh, options)
        .then(function(b3dm) {
            return saveTile(tilePath, b3dm, options.gzip);

        }));

    var children;
    if (options.explicitTilingScheme) {
        // Hierarchy is not included in tileset.json, so no need keep the subtree in memory
        children = [];
    } else if (isLeaf) {
        children = [];
    } else if (isRoot && options.globe) {
        children = splitIntoTwo(rectangle, level, x, y, options);
    } else {
        children = splitIntoFour(rectangle, level, x, y, options);
    }

    return createTileJson(rectangle, minHeight, maxHeight, geometricError, tileName, children);
}

function splitIntoTwo(rectangle, level, x, y, options) {
    // Split by west/east hemispheres
    var nextLevel = level + 1;
    var nextX = 2 * x;
    var nextY = 2 * y;
    var rectangles = splitRectangleIntoTwo(rectangle);
    var west = createQuadtree(rectangles[0], nextLevel, nextX, nextY, options);
    var east = createQuadtree(rectangles[1], nextLevel, nextX + 1, nextY, options);
    return [west, east];
}

function splitIntoFour(rectangle, level, x, y, options) {
    var nextLevel = level + 1;
    var nextX = 2 * x;
    var nextY = 2 * y;
    var rectangles = splitRectangleIntoFour(rectangle);
    var southwest = createQuadtree(rectangles[0], nextLevel, nextX, nextY, options);
    var southeast = createQuadtree(rectangles[1], nextLevel, nextX + 1, nextY, options);
    var northeast = createQuadtree(rectangles[2], nextLevel, nextX + 1, nextY + 1, options);
    var northwest = createQuadtree(rectangles[3], nextLevel, nextX, nextY + 1, options);
    return [southwest, southeast, northeast, northwest];
}

function splitRectangleIntoFour(rectangle) {
    // PERFORMANCE_IDEA : use scratch variables for rectangles
    var center = Rectangle.center(rectangle, scratchCartographic1);
    return [
        Rectangle.fromRadians(rectangle.west, rectangle.south, center.longitude, center.latitude),
        Rectangle.fromRadians(center.longitude, rectangle.south, rectangle.east, center.latitude),
        Rectangle.fromRadians(center.longitude, center.latitude, rectangle.east, rectangle.north),
        Rectangle.fromRadians(rectangle.west, center.latitude, center.longitude, rectangle.north)
    ];
}

function splitRectangleIntoTwo(rectangle) {
    // PERFORMANCE_IDEA : use scratch variables for rectangles
    var center = Rectangle.center(rectangle, scratchCartographic1);
    return [
        Rectangle.fromRadians(rectangle.west, rectangle.south, center.longitude, rectangle.north),
        Rectangle.fromRadians(center.longitude, rectangle.south, rectangle.east, rectangle.north)
    ];
}

function createB3dmContents(mesh, options) {
    options.gltfOptions.mesh = mesh;
    return createGltf(options.gltfOptions)
        .then(function(glb) {
            return createB3dm({
                glb : glb
            });
        });
}

function initializeScratchVariables(tessellation) {
    var i;
    var length = (tessellation + 3) * (tessellation + 3);
    scratchPositionsWithNeighbors = new Array(length);
    for (i = 0; i < length; ++i) {
        scratchPositionsWithNeighbors[i] = new Cartesian3();
    }

    length = (tessellation + 2) * (tessellation + 2);
    scratchFaceNormals = new Array(length);
    for (i = 0; i < length; ++i) {
        scratchFaceNormals[i] = new Cartesian3();
    }

    var indicesLength = tessellation * tessellation * 6;
    var verticesLength = (tessellation + 1) * (tessellation + 1);
    scratchMesh = Mesh.batch([new Mesh({
        indices : new Array(indicesLength),
        positions : new Array(verticesLength * 3),
        normals : new Array(verticesLength * 3),
        uvs : new Array(verticesLength * 2),
        material : material
    })]);
}

function computeFaceNormal(sw, se, nw, ne, result) {
    // Get the edges
    var s = Cartesian3.subtract(se, sw, scratchEdges[0]);
    var e = Cartesian3.subtract(ne, se, scratchEdges[1]);
    var n = Cartesian3.subtract(nw, ne, scratchEdges[2]);
    var w = Cartesian3.subtract(sw, nw, scratchEdges[3]);

    // Get a normal for each triangle in the face
    var normal1 = Cartesian3.cross(s, e, scratchTriangleNormals[0]);
    var normal2 = Cartesian3.cross(n, w, scratchTriangleNormals[1]);

    // Average the two normals
    var normal = Cartesian3.add(normal1, normal2, result);
    Cartesian3.normalize(normal, normal);

    return normal;
}

function averageNormals(sw, se, nw, ne, result) {
    var normal = Cartesian3.clone(Cartesian3.ZERO, result);
    Cartesian3.add(sw, normal, normal);
    Cartesian3.add(se, normal, normal);
    Cartesian3.add(nw, normal, normal);
    Cartesian3.add(ne, normal, normal);
    Cartesian3.normalize(normal, normal);
    return normal;
}

function computeGeometricError(rectangle, minHeight, maxHeight) {
    // Calculates based on the diagonal between two opposite corners of the rectangle
    var sw = Rectangle.southwest(rectangle, scratchCartographic1);
    var ne = Rectangle.northeast(rectangle, scratchCartographic2);
    var swCartesian = Cartesian3.fromRadians(sw.longitude, sw.latitude, minHeight, Ellipsoid.WGS84, scratchCartesian1);
    var neCartesian = Cartesian3.fromRadians(ne.longitude, ne.latitude, maxHeight, Ellipsoid.WGS84, scratchCartesian2);
    var scaleFactor = 0.5;
    return Cartesian3.distance(swCartesian, neCartesian) * scaleFactor;
}

function sampleHeight(longitude, latitude, rectangle, options) {
    var noiseFrequency = options.noiseFrequency;
    var noiseStrength = options.noiseStrength;
    var u = (longitude - rectangle.west) / rectangle.width;
    var v = (latitude - rectangle.south) / rectangle.height;
    var value = simplex.noise2D(u * noiseFrequency, v * noiseFrequency);
    value = value * 0.5 + 0.5;
    value = CesiumMath.clamp(value, 0.0, 1.0);
    value *= noiseStrength;
    return value;
}

function createMesh(rectangle, options) {
    // PERFORMANCE_IDEA : use LINE_STRIP
    var rootRectangle = options.rootRectangle;
    var tessellation = options.tessellation;

    var positionCount = 0;
    var faceNormalCount = 0;
    var indexCount = 0;
    var vertexCount = 0;

    var x, y;
    var swIndex, seIndex, nwIndex, neIndex;
    var minHeight = Number.POSITIVE_INFINITY;
    var maxHeight = Number.NEGATIVE_INFINITY;

    // Create positions with neighbors
    for (y = -1; y <= tessellation + 1; ++y) {
        for (x = -1; x <= tessellation + 1; ++x) {
            var west = rectangle.west + (x / tessellation) * rectangle.width;
            var south = rectangle.south + (y / tessellation) * rectangle.height;
            var height = sampleHeight(west, south, rootRectangle, options);
            minHeight = Math.min(minHeight, height);
            maxHeight = Math.max(maxHeight, height);
            Cartesian3.fromRadians(west, south, height, Ellipsoid.WGS84, scratchPositionsWithNeighbors[positionCount++]);
        }
    }

    // Compute face normals
    for (y = 0; y <= tessellation + 1; ++y) {
        for (x = 0; x <= tessellation + 1; ++x) {
            swIndex = y * (tessellation + 3) + x;
            seIndex = swIndex + 1;
            nwIndex = (y + 1) * (tessellation + 3) + x;
            neIndex = nwIndex + 1;
            computeFaceNormal(
                scratchPositionsWithNeighbors[swIndex],
                scratchPositionsWithNeighbors[seIndex],
                scratchPositionsWithNeighbors[nwIndex],
                scratchPositionsWithNeighbors[neIndex],
                scratchFaceNormals[faceNormalCount++]
            );
        }
    }

    // Get vertex attributes: positions, normals, and uvs
    for (y = 0; y <= tessellation; ++y) {
        for (x = 0; x <= tessellation; ++x) {
            swIndex = y * (tessellation + 2) + x;
            seIndex = swIndex + 1;
            nwIndex = (y + 1) * (tessellation + 2) + x;
            neIndex = nwIndex + 1;
            var normal = averageNormals(
                scratchFaceNormals[swIndex],
                scratchFaceNormals[seIndex],
                scratchFaceNormals[nwIndex],
                scratchFaceNormals[neIndex],
                scratchNormal
            );
            var position = scratchPositionsWithNeighbors[(y + 1) * (tessellation + 3) + (x + 1)];

            Cartesian3.pack(position, scratchMesh.positions, vertexCount * 3);
            Cartesian3.pack(normal, scratchMesh.normals, vertexCount * 3);

            scratchMesh.uvs[vertexCount * 2] = x / tessellation;
            scratchMesh.uvs[vertexCount * 2 + 1] = y / tessellation;

            vertexCount++;
        }
    }

    // Create indices
    for (y = 0; y < tessellation; ++y) {
        for (x = 0; x < tessellation; ++x) {
            swIndex = y * (tessellation + 1) + x;
            seIndex = swIndex + 1;
            nwIndex = (y + 1) * (tessellation + 1) + x;
            neIndex = nwIndex + 1;

            scratchMesh.indices[indexCount] = swIndex;
            scratchMesh.indices[indexCount + 1] = seIndex;
            scratchMesh.indices[indexCount + 2] = neIndex;
            scratchMesh.indices[indexCount + 3] = swIndex;
            scratchMesh.indices[indexCount + 4] = neIndex;
            scratchMesh.indices[indexCount + 5] = nwIndex;
            indexCount += 6;
        }
    }

    var geometricError = computeGeometricError(rectangle, minHeight, maxHeight);

    return {
        mesh : scratchMesh,
        minHeight : minHeight,
        maxHeight : maxHeight,
        geometricError : geometricError
    };
}
