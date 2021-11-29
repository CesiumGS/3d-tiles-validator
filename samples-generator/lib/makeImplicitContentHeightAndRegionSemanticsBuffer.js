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
var regionBufferViewByteLength = 6 * sizeOfFloat64 * nodeCount;

var bufferByteLength =
    minimumHeightBufferViewByteLength +
    maximumHeightBufferViewByteLength +
    regionBufferViewByteLength;

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
var regionValues = new Float64Array(metadataBuffer.buffer, byteOffset, 6 * nodeCount);

var bottom = 1000.0;
var top = 5000.0;
var heightDifference = top - bottom;

// make a staircase of bounding volumes that follow the morton curve
var index = 0;
for (var i = 0; i < subtreeLevels; i++) {
    var nodesAtLevel = Math.pow(4, i);
    var stepHeight = heightDifference / nodesAtLevel;
    for (var j = 0; j < nodesAtLevel; j++) {
        minimumHeightValues[index] = bottom + j * stepHeight;
        maximumHeightValues[index] = bottom + (j + 1) * stepHeight;
        index++;
    }
}

var minimumHeight = 0.0;
var maximumHeight = 10000.0;
var west = 0.0;
var south = 0.0;
var east = 0.00314;
var north = 0.00314;
var width = east - west;
var height = north - south;

var shrinkFactor = 0.00005;

var xy = new Array(2);
index = 0;
for (var i = 0; i < subtreeLevels; i++) {
    var nodesAtLevel = Math.pow(4, i);
    var nodesPerAxis = Math.pow(2, i);
    for (var j = 0; j < nodesAtLevel; j++) {
        Cesium.MortonOrder.decode2D(j, xy);
        var x = xy[0];
        var y = xy[1];
        var tileWest = west + shrinkFactor * (i + 1) + (x / nodesPerAxis) * width; //prettier-ignore
        var tileEast = west + ((x + 1) / nodesPerAxis) * width - shrinkFactor * (i + 1); //prettier-ignore
        var tileSouth = south + shrinkFactor * (i + 1) + (y / nodesPerAxis) * height; //prettier-ignore
        var tileNorth = south + ((y + 1) / nodesPerAxis) * height - shrinkFactor * (i + 1); //prettier-ignore
        regionValues[index] = tileWest;
        regionValues[index + 1] = tileSouth;
        regionValues[index + 2] = tileEast;
        regionValues[index + 3] = tileNorth;
        regionValues[index + 4] = minimumHeight;
        regionValues[index + 5] = maximumHeight;
        index += 6;
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
            byteLength: regionBufferViewByteLength
        }
    ],
    tileAvailability: {
        constant: 1
    },
    contentAvailability: {
        constant: 1
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
                boundingRegion: {
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
