'use strict';
var Cesium = require('cesium');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = {
    createB3dm : createB3dm,
    createB3dmLegacy1 : createB3dmLegacy1,
    createB3dmLegacy2 : createB3dmLegacy2,
    createI3dm : createI3dm,
    createPnts : createPnts,
    createCmpt : createCmpt
};

function createB3dm(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var headerByteLength = 28;
    var batchLength = defaultValue(options.batchLength, 0);
    var featureTableJson = defaultValue(options.featureTableJson, {
        BATCH_LENGTH : batchLength
    });

    var featureTableJsonBuffer = getJsonBufferPadded(featureTableJson, headerByteLength);
    var featureTableBinary = getBufferPadded(options.featureTableBinary);
    var batchTableJsonBuffer = getJsonBufferPadded(options.batchTableJson);
    var batchTableBinary = getBufferPadded(options.batchTableBinary);
    var glb = getBufferPadded(defaultValue(options.glb, Buffer.from('glTF')));

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

    var featureTableJsonByteLength = featureTableJsonBuffer.length;
    var featureTableBinaryByteLength = featureTableBinary.length;
    var batchTableJsonByteLength = batchTableJsonBuffer.length;
    var batchTableBinaryByteLength = batchTableBinary.length;
    var glbByteLength = glb.length;

    var byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + glbByteLength;

    var header = Buffer.alloc(headerByteLength);
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
    var b3dm = Buffer.alloc(28);
    b3dm.write('b3dm', 0);     // magic
    b3dm.writeUInt32LE(1, 4);  // version
    b3dm.writeUInt32LE(28, 8); // byteLength
    b3dm.writeUInt32LE(0, 12); // batchLength
    b3dm.writeUInt32LE(0, 16); // batchTableByteLength
    b3dm.write('glTF', 20);    // Start of glb
    return b3dm;
}

function createB3dmLegacy2() {
    var b3dm = Buffer.alloc(28);
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
    var headerByteLength = 32;
    var instancesLength = defaultValue(options.instancesLength, 0);
    var featureTableJson = defaultValue(options.featureTableJson, {
        INSTANCES_LENGTH : instancesLength,
        POSITION : new Array(instancesLength * 3).fill(0)
    });

    var featureTableJsonBuffer = getJsonBufferPadded(featureTableJson, headerByteLength);
    var featureTableBinary = getBufferPadded(options.featureTableBinary);
    var batchTableJsonBuffer = getJsonBufferPadded(options.batchTableJson);
    var batchTableBinary = getBufferPadded(options.batchTableBinary);
    var glb = getBufferPadded(defaultValue(options.glb, Buffer.from('glTF')));

    var gltfFormat = 1;
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

    var featureTableJsonByteLength = featureTableJsonBuffer.length;
    var featureTableBinaryByteLength = featureTableBinary.length;
    var batchTableJsonByteLength = batchTableJsonBuffer.length;
    var batchTableBinaryByteLength = batchTableBinary.length;
    var glbByteLength = glb.length;

    var byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + glbByteLength;

    var header = Buffer.alloc(headerByteLength);
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
    var headerByteLength = 28;
    var pointsLength = defaultValue(options.pointsLength, 0);
    var featureTableJson = defaultValue(options.featureTableJson, {
        POINTS_LENGTH : pointsLength,
        POSITION : new Array(pointsLength * 3).fill(0)
    });

    var featureTableJsonBuffer = getJsonBufferPadded(featureTableJson, headerByteLength);
    var featureTableBinary = getBufferPadded(options.featureTableBinary);
    var batchTableJsonBuffer = getJsonBufferPadded(options.batchTableJson);
    var batchTableBinary = getBufferPadded(options.batchTableBinary);

    if (options.unalignedFeatureTableBinary) {
        featureTableJsonBuffer = Buffer.concat([featureTableJsonBuffer, Buffer.from(' ')]);
    }
    if (options.unalignedBatchTableBinary) {
        batchTableJsonBuffer = Buffer.concat([batchTableJsonBuffer, Buffer.from(' ')]);
    }
    if (options.unalignedByteLength) {
        batchTableBinary = Buffer.concat([batchTableBinary, Buffer.alloc(1)]);
    }

    var featureTableJsonByteLength = featureTableJsonBuffer.length;
    var featureTableBinaryByteLength = featureTableBinary.length;
    var batchTableJsonByteLength = batchTableJsonBuffer.length;
    var batchTableBinaryByteLength = batchTableBinary.length;

    var byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength;

    var header = Buffer.alloc(headerByteLength);
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
    var innerTiles = Buffer.concat(tiles);
    var headerByteLength = 16;
    var byteLength = headerByteLength + innerTiles.length;

    var header = Buffer.alloc(16);
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

    var boundary = 8;
    var byteLength = buffer.length;
    var remainder = (byteOffset + byteLength) % boundary;
    var padding = (remainder === 0) ? 0 : boundary - remainder;
    var emptyBuffer = Buffer.alloc(padding);
    return Buffer.concat([buffer, emptyBuffer]);
}

function getJsonBufferPadded(json, byteOffset) {
    if (!defined(json) || Object.keys(json).length === 0) {
        return Buffer.alloc(0);
    }

    byteOffset = defaultValue(byteOffset, 0);
    var string = JSON.stringify(json);

    var boundary = 8;
    var byteLength = Buffer.byteLength(string);
    var remainder = (byteOffset + byteLength) % boundary;
    var padding = (remainder === 0) ? 0 : boundary - remainder;
    var whitespace = '';
    for (var i = 0; i < padding; ++i) {
        whitespace += ' ';
    }
    string += whitespace;

    return Buffer.from(string);
}
