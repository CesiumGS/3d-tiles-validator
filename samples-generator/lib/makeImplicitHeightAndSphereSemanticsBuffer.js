#!/usr/bin/env node
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var getJsonBufferPadded = require('./getJsonBufferPadded.js');

// These constants must agree with the subtreeLevels from tileset.json
var subtreeLevels = 3;

var nodeCount = (Math.pow(4, subtreeLevels) - 1) / 3;

var sizeOfFloat64 = 8;
var minimumHeightBufferViewByteLength = sizeOfFloat64 * nodeCount;
var maximumHeightBufferViewByteLength = sizeOfFloat64 * nodeCount;
var sphereBufferViewByteLength = 4 * sizeOfFloat64 * nodeCount;

var bufferByteLength =
    minimumHeightBufferViewByteLength +
    maximumHeightBufferViewByteLength +
    sphereBufferViewByteLength;

var metadataBuffer = new Uint8Array(bufferByteLength);

var byteOffset = 0;
var minimumHeightValues = new Float64Array(
    metadataBuffer.buffer,
    byteOffset,
    nodeCount
);
byteOffset += minimumHeightBufferViewByteLength;
var maximumHeightValues = new Float64Array(
    metadataBuffer.buffer,
    byteOffset,
    nodeCount
);
byteOffset += maximumHeightBufferViewByteLength;
var sphereValues = new Float64Array(
    metadataBuffer.buffer,
    byteOffset,
    4 * nodeCount
);

var bottom = 1000.0;
var top = 5000.0;
var heightDifference = top - bottom;

// make a staircase of bounding volumes that follow the morton curve
var heightIndex = 0;
for (var i = 0; i < subtreeLevels; i++) {
    var nodesAtLevel = Math.pow(4, i);
    var stepHeight = heightDifference / nodesAtLevel;
    for (var j = 0; j < nodesAtLevel; j++) {
        minimumHeightValues[heightIndex] = bottom + j * stepHeight;
        maximumHeightValues[heightIndex] = bottom + (j + 1) * stepHeight;
        heightIndex++;
    }
}

var west = 0.0;
var south = 0.0;
var east = 0.00314;
var north = 0.00314;
var width = east - west;
var height = north - south;

var xy = new Array(2);
var cartographic = new Cesium.Cartographic();
var cartesian = new Cesium.Cartesian3();
heightIndex = 0;
var sphereIndex = 0;
for (var i = 0; i < subtreeLevels; i++) {
    var nodesAtLevel = Math.pow(4, i);
    var nodesPerAxis = Math.pow(2, i);
    for (var j = 0; j < nodesAtLevel; j++) {
        Cesium.MortonOrder.decode2D(j, xy);
        var x = xy[0];
        var y = xy[1];
        var centerLongitude = west + ((x + 0.5) / nodesPerAxis) * width;
        var centerLatitude = south + ((y + 0.5) / nodesPerAxis) * height;
        var centerHeight =
            (minimumHeightValues[heightIndex] + maximumHeightValues[heightIndex]) * 0.5;
        var centerCartographic = Cesium.Cartographic.fromRadians(
            centerLongitude,
            centerLatitude,
            centerHeight,
            cartographic
        );
        var centerCartesian = Cesium.Cartographic.toCartesian(
            centerCartographic,
            Cesium.Ellipsoid.WGS84,
            cartesian
        );
        var radius = Cesium.Ellipsoid.WGS84.radii.x * width * 0.5 / (i + 1);
        sphereValues[sphereIndex + 0] = centerCartesian.x;
        sphereValues[sphereIndex + 1] = centerCartesian.y;
        sphereValues[sphereIndex + 2] = centerCartesian.z;
        sphereValues[sphereIndex + 3] = radius;

        heightIndex++;
        sphereIndex += 4;
    }
}

var json = {
    buffers: [
        {
            uri: 'metadata.bin',
            byteLength: bufferByteLength
        }
    ],
    bufferViews: [
        {
            buffer: 0,
            byteOffset: 0,
            byteLength: minimumHeightBufferViewByteLength
        },
        {
            buffer: 0,
            byteOffset: minimumHeightBufferViewByteLength,
            byteLength: maximumHeightBufferViewByteLength
        },
        {
            buffer: 0,
            byteOffset:
                minimumHeightBufferViewByteLength +
                maximumHeightBufferViewByteLength,
            byteLength: sphereBufferViewByteLength
        }
    ],
    tileAvailability: {
        constant: 1
    },
    contentAvailability: {
        constant: 0
    },
    childSubtreeAvailability: {
        constant: 0
    },
    extensions: {
        '3DTILES_metadata': {
            class: 'tile',
            properties: {
                minimumHeight: {
                    bufferView: 0
                },
                maximumHeight: {
                    bufferView: 1
                },
                boundingSphere: {
                    bufferView: 2
                }
            }
        }
    }
};

var jsonBuffer = getJsonBufferPadded(json, 24);

var header = Buffer.alloc(24);
header.writeUInt32LE(0x74627573, 0);
header.writeUInt32LE(1, 4);
header.writeBigUInt64LE(BigInt(jsonBuffer.length), 8);
header.writeBigUInt64LE(BigInt(0), 16);

var subtreeBuffer = Buffer.concat([header, jsonBuffer]);

fsExtra.outputFileSync('subtrees/0.0.0.subtree', subtreeBuffer);
fsExtra.outputFileSync('subtrees/metadata.bin', metadataBuffer);
