'use strict';
const Cesium = require('cesium');

const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

module.exports = {
    createB3dm: createB3dm,
    createB3dmLegacy1: createB3dmLegacy1,
    createB3dmLegacy2: createB3dmLegacy2,
    createCmpt: createCmpt,
    createGlb: createGlb,
    createI3dm: createI3dm,
    createPnts: createPnts
};

function createB3dm(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    const headerByteLength = 28;
    const batchLength = defaultValue(options.batchLength, 0);
    const featureTableJson = defaultValue(options.featureTableJson, {
        BATCH_LENGTH: batchLength
    });

    let featureTableJsonBuffer = getJsonBufferPadded(featureTableJson, headerByteLength);
    const featureTableBinary = getBufferPadded(options.featureTableBinary);
    let batchTableJsonBuffer = getJsonBufferPadded(options.batchTableJson);
    let batchTableBinary = getBufferPadded(options.batchTableBinary);
    let glb = getBufferPadded(defaultValue(options.glb, createGlb()));

    if (options.unalignedFeatureTableBinary) {
        featureTableJsonBuffer = Buffer.concat([featureTableJsonBuffer, Buffer.from(' ')]);
    }
    if (options.unalignedBatchTableBinary) {
        batchTableJsonBuffer = Buffer.concat([batchTableJsonBuffer, Buffer.from(' ')]);
    }
    if (options.unalignedGlb) {
        batchTableBinary = Buffer.concat([batchTableJsonBuffer, Buffer.alloc(1)]);
    }
    if (options.unalignedByteLength) {
        glb = Buffer.concat([glb, Buffer.alloc(1)]);
    }

    const featureTableJsonByteLength = featureTableJsonBuffer.length;
    const featureTableBinaryByteLength = featureTableBinary.length;
    const batchTableJsonByteLength = batchTableJsonBuffer.length;
    const batchTableBinaryByteLength = batchTableBinary.length;
    const glbByteLength = glb.length;

    const byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + glbByteLength;

    const header = Buffer.alloc(headerByteLength);
    header.write('b3dm', 0);                                // magic
    header.writeUInt32LE(1, 4);                             // version
    header.writeUInt32LE(byteLength, 8);                    // byteLength
    header.writeUInt32LE(featureTableJsonByteLength, 12);   // featureTableJSONByteLength
    header.writeUInt32LE(featureTableBinaryByteLength, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(batchTableJsonByteLength, 20);     // batchTableJSONByteLength
    header.writeUInt32LE(batchTableBinaryByteLength, 24);   // batchTableBinaryByteLength

    return Buffer.concat([header, featureTableJsonBuffer, featureTableBinary, batchTableJsonBuffer, batchTableBinary, glb]);
}

function createB3dmLegacy1() {
    const b3dm = Buffer.alloc(28);
    b3dm.write('b3dm', 0);     // magic
    b3dm.writeUInt32LE(1, 4);  // version
    b3dm.writeUInt32LE(28, 8); // byteLength
    b3dm.writeUInt32LE(0, 12); // batchLength
    b3dm.writeUInt32LE(0, 16); // batchTableByteLength
    b3dm.write('glTF', 20);    // Start of glb
    return b3dm;
}

function createB3dmLegacy2() {
    const b3dm = Buffer.alloc(28);
    b3dm.write('b3dm', 0);     // magic
    b3dm.writeUInt32LE(1, 4);  // version
    b3dm.writeUInt32LE(28, 8); // byteLength
    b3dm.writeUInt32LE(0, 12); // batchTableJsonByteLength
    b3dm.writeUInt32LE(0, 16); // batchTableBinaryByteLength
    b3dm.writeUInt32LE(0, 20); // batchLength
    b3dm.write('glTF', 24);    // Start of glb
    return b3dm;
}

function createI3dm(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    const headerByteLength = 32;
    const instancesLength = defaultValue(options.instancesLength, 0);
    const featureTableJson = defaultValue(options.featureTableJson, {
        INSTANCES_LENGTH: instancesLength,
        POSITION: new Array(instancesLength * 3).fill(0)
    });

    let featureTableJsonBuffer = getJsonBufferPadded(featureTableJson, headerByteLength);
    const featureTableBinary = getBufferPadded(options.featureTableBinary);
    let batchTableJsonBuffer = getJsonBufferPadded(options.batchTableJson);
    let batchTableBinary = getBufferPadded(options.batchTableBinary);
    let glb = getBufferPadded(defaultValue(options.glb, createGlb()));

    let gltfFormat = 1;
    if (typeof glb === 'string') {
        gltfFormat = 0;
        glb = Buffer.from(glb);
    }

    if (options.unalignedFeatureTableBinary) {
        featureTableJsonBuffer = Buffer.concat([featureTableJsonBuffer, Buffer.from(' ')]);
    }
    if (options.unalignedBatchTableBinary) {
        batchTableJsonBuffer = Buffer.concat([batchTableJsonBuffer, Buffer.from(' ')]);
    }
    if (options.unalignedGlb) {
        batchTableBinary = Buffer.concat([batchTableJsonBuffer, Buffer.alloc(1)]);
    }
    if (options.unalignedByteLength) {
        glb = Buffer.concat([glb, Buffer.alloc(1)]);
    }

    const featureTableJsonByteLength = featureTableJsonBuffer.length;
    const featureTableBinaryByteLength = featureTableBinary.length;
    const batchTableJsonByteLength = batchTableJsonBuffer.length;
    const batchTableBinaryByteLength = batchTableBinary.length;
    const glbByteLength = glb.length;

    const byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + glbByteLength;

    const header = Buffer.alloc(headerByteLength);
    header.write('i3dm', 0);                                // magic
    header.writeUInt32LE(1, 4);                             // version
    header.writeUInt32LE(byteLength, 8);                    // byteLength
    header.writeUInt32LE(featureTableJsonByteLength, 12);   // featureTableJSONByteLength
    header.writeUInt32LE(featureTableBinaryByteLength, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(batchTableJsonByteLength, 20);     // batchTableJSONByteLength
    header.writeUInt32LE(batchTableBinaryByteLength, 24);   // batchTableBinaryByteLength
    header.writeUInt32LE(gltfFormat, 28);                   // gltfFormat

    return Buffer.concat([header, featureTableJsonBuffer, featureTableBinary, batchTableJsonBuffer, batchTableBinary, glb]);
}

function createPnts(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    const headerByteLength = 28;
    const pointsLength = defaultValue(options.pointsLength, 0);
    const featureTableJson = defaultValue(options.featureTableJson, {
        POINTS_LENGTH: pointsLength,
        POSITION: new Array(pointsLength * 3).fill(0)
    });

    let featureTableJsonBuffer = getJsonBufferPadded(featureTableJson, headerByteLength);
    const featureTableBinary = getBufferPadded(options.featureTableBinary);
    let batchTableJsonBuffer = getJsonBufferPadded(options.batchTableJson);
    let batchTableBinary = getBufferPadded(options.batchTableBinary);

    if (options.unalignedFeatureTableBinary) {
        featureTableJsonBuffer = Buffer.concat([featureTableJsonBuffer, Buffer.from(' ')]);
    }
    if (options.unalignedBatchTableBinary) {
        batchTableJsonBuffer = Buffer.concat([batchTableJsonBuffer, Buffer.from(' ')]);
    }
    if (options.unalignedByteLength) {
        batchTableBinary = Buffer.concat([batchTableBinary, Buffer.alloc(1)]);
    }

    const featureTableJsonByteLength = featureTableJsonBuffer.length;
    const featureTableBinaryByteLength = featureTableBinary.length;
    const batchTableJsonByteLength = batchTableJsonBuffer.length;
    const batchTableBinaryByteLength = batchTableBinary.length;

    const byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength;

    const header = Buffer.alloc(headerByteLength);
    header.write('pnts', 0);                                // magic
    header.writeUInt32LE(1, 4);                             // version
    header.writeUInt32LE(byteLength, 8);                    // byteLength
    header.writeUInt32LE(featureTableJsonByteLength, 12);   // featureTableJSONByteLength
    header.writeUInt32LE(featureTableBinaryByteLength, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(batchTableJsonByteLength, 20);     // batchTableJSONByteLength
    header.writeUInt32LE(batchTableBinaryByteLength, 24);   // batchTableBinaryByteLength

    return Buffer.concat([header, featureTableJsonBuffer, featureTableBinary, batchTableJsonBuffer, batchTableBinary]);
}

function createCmpt(tiles) {
    tiles = defaultValue(tiles, []);
    const innerTiles = Buffer.concat(tiles);
    const headerByteLength = 16;
    const byteLength = headerByteLength + innerTiles.length;

    const header = Buffer.alloc(16);
    header.write('cmpt', 0);                // magic
    header.writeUInt32LE(1, 4);             // version
    header.writeUInt32LE(byteLength, 8);    // byteLength
    header.writeUInt32LE(tiles.length, 12); // tilesLength

    return Buffer.concat([header, innerTiles]);
}

function getBufferPadded(buffer, byteOffset) {
    if (!defined(buffer)) {
        return Buffer.alloc(0);
    }

    byteOffset = defaultValue(byteOffset, 0);

    const boundary = 8;
    const byteLength = buffer.length;
    const remainder = (byteOffset + byteLength) % boundary;
    const padding = (remainder === 0) ? 0 : boundary - remainder;
    const emptyBuffer = Buffer.alloc(padding);
    return Buffer.concat([buffer, emptyBuffer]);
}

function getJsonBufferPadded(json, byteOffset) {
    if (!defined(json) || Object.keys(json).length === 0) {
        return Buffer.alloc(0);
    }

    byteOffset = defaultValue(byteOffset, 0);
    let string = JSON.stringify(json);

    const boundary = 8;
    const byteLength = Buffer.byteLength(string);
    const remainder = (byteOffset + byteLength) % boundary;
    const padding = (remainder === 0) ? 0 : boundary - remainder;
    let whitespace = '';
    for (let i = 0; i < padding; i++) {
        whitespace += ' ';
    }
    string += whitespace;

    return Buffer.from(string);
}

// Triangle from glTF-sample-models
const glbDataUri = 'data:model/gltf-binary;base64,Z2xURgIAAAAAAwAAuAIAAEpTT057InNjZW5lIjowLCJzY2VuZXMiOlt7Im5vZGVzIjpbMF19XSwibm9kZXMiOlt7Im1lc2giOjB9XSwibWVzaGVzIjpbeyJwcmltaXRpdmVzIjpbeyJhdHRyaWJ1dGVzIjp7IlBPU0lUSU9OIjoxfSwiaW5kaWNlcyI6MCwibW9kZSI6NCwibWF0ZXJpYWwiOjB9XX1dLCJidWZmZXJzIjpbeyJuYW1lIjoic2ltcGxlVHJpYW5nbGUiLCJieXRlTGVuZ3RoIjo0NH1dLCJidWZmZXJWaWV3cyI6W3siYnVmZmVyIjowLCJieXRlT2Zmc2V0IjowLCJieXRlTGVuZ3RoIjo2LCJ0YXJnZXQiOjM0OTYzfSx7ImJ1ZmZlciI6MCwiYnl0ZU9mZnNldCI6OCwiYnl0ZUxlbmd0aCI6MzYsInRhcmdldCI6MzQ5NjIsImJ5dGVTdHJpZGUiOjEyfV0sImFjY2Vzc29ycyI6W3siYnVmZmVyVmlldyI6MCwiYnl0ZU9mZnNldCI6MCwiY29tcG9uZW50VHlwZSI6NTEyMywiY291bnQiOjMsInR5cGUiOiJTQ0FMQVIiLCJtYXgiOlsyXSwibWluIjpbMF19LHsiYnVmZmVyVmlldyI6MSwiYnl0ZU9mZnNldCI6MCwiY29tcG9uZW50VHlwZSI6NTEyNiwiY291bnQiOjMsInR5cGUiOiJWRUMzIiwibWF4IjpbMSwxLDBdLCJtaW4iOlswLDAsMF19XSwiYXNzZXQiOnsidmVyc2lvbiI6IjIuMCJ9LCJtYXRlcmlhbHMiOlt7Im5hbWUiOiJkZWZhdWx0IiwiZW1pc3NpdmVGYWN0b3IiOlswLDAsMF0sImFscGhhTW9kZSI6Ik9QQVFVRSIsImRvdWJsZVNpZGVkIjpmYWxzZX1dfSAsAAAAQklOAAAAAQACAAAAAAAAAAAAAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAgD8AAAAA';
const uriHeader = 'data:model/gltf-binary;base64,';
const base64 = glbDataUri.substring(uriHeader.length);
const glb = Buffer.from(base64, 'base64');

function createGlb() {
    return Buffer.from(glb);
}
