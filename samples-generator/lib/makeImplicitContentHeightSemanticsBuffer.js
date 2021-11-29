#!/usr/bin/env node
var fsExtra = require('fs-extra');
var getJsonBufferPadded = require('./getJsonBufferPadded.js');

// These constants must agree with the subtreeLevels from tileset.json
var subtreeLevels = 3;

var nodeCount = (Math.pow(4, subtreeLevels) - 1) / 3;

var sizeOfFloat64 = 8;
var minimumHeightBufferViewByteLength = sizeOfFloat64 * nodeCount;
var maximumHeightBufferViewByteLength = sizeOfFloat64 * nodeCount;

var bufferByteLength =
    minimumHeightBufferViewByteLength +
    maximumHeightBufferViewByteLength;

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
