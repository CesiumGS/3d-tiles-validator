#!/usr/bin/env node
import fs from "fs";
import getJsonBufferPadded from "./getJsonBufferPadded.js";

// These constants must agree with the subtreeLevels from tileset.json
var subtreeLevels = 3;

var nodeCount = (Math.pow(4, subtreeLevels) - 1) / 3;

var sizeOfFloat64 = 8;
var bufferViewByteLength = sizeOfFloat64 * nodeCount;
var bufferByteLength = bufferViewByteLength;

var metadataBuffer = new Uint8Array(bufferByteLength);
var geometricErrorValues = new Float64Array(metadataBuffer.buffer, 0, nodeCount);

var index = 0;
for (var i = 0; i < subtreeLevels; i++) {
  var nodesAtLevel = Math.pow(4, i);
  for (var j = 0; j < nodesAtLevel; j++) {
    var geometricError = (subtreeLevels - i) * 100 + j;
    geometricErrorValues[index] = geometricError;
    index++;
  }
}

var json = {
  buffers: [
    {
      uri: "metadata.bin",
      byteLength: 168
    }
  ],
  bufferViews: [
    {
      buffer: 0,
      byteOffset: 0,
      byteLength: 168
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
    "3DTILES_metadata": {
      class: "tile",
      properties: {
        geometricError: {
          bufferView: 0
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

fs.writeFileSync("subtrees/0.0.0.subtree", subtreeBuffer);
fs.writeFileSync("subtrees/metadata.bin", metadataBuffer);
