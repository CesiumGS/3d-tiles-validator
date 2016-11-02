'use strict';
var validateI3dm = require('../../lib/validateI3dm');

describe('validateB3dm', function() {

    it('returns true if the i3dm tile is valid, returns false if the i3dm has invalid magic', function() {
        expect(validateI3dm(createInvalidMagic()).result).toBe(false);
    });

    it('returns true if the i3dm tile is valid, returns false if the i3dm has invalid version', function() {
        expect(validateI3dm(createInvalidVersion()).result).toBe(false);
    });

    it('returns true if the i3dm tile is valid, returns false if the i3dm has wrong byteLength', function() {
        expect(validateI3dm(createWrongByteLength()).result).toBe(false);
    });

    it('returns true if the i3dm tile is valid, returns false if the i3dm has invalid gITF Format', function() {
        expect(validateI3dm(createInvalidGltfFormat()).result).toBe(false);
    });

    it('returns true if b3dm i3dm matches spec with glTF field of the body being a url', function() {
        var validatorObject = validateI3dm(createI3dmTileGltfUrl());
        var message = validatorObject.message;
        expect(validatorObject.result && message.includes("url")).toBe(true);
    });

    it('returns true if b3dm i3dm matches spec with glTF field of the body being an embedded binary glTF', function() {
        var validatorObject = validateI3dm(createI3dmTileGltfBinaryGITF());
        var message = validatorObject.message;
        expect(validatorObject.result && message.includes("embedded binary gITF")).toBe(true);
    });
});

function createI3dmTileGltfUrl() {
    var header = new Buffer(32);

    header.write('i3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // featureTableJSONByteLength
    header.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchTableJSONByteLength
    header.writeUInt32LE(0, 24); // batchTableBinaryByteLength
    header.writeUInt32LE(0, 28); // gltfFormat: 0 - url

    return header;
}

function createI3dmTileGltfBinaryGITF() {
    var header = new Buffer(32);

    header.write('i3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // featureTableJSONByteLength
    header.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchTableJSONByteLength
    header.writeUInt32LE(0, 24); // batchTableBinaryByteLength
    header.writeUInt32LE(1, 28); // gltfFormat: 1 - embedded binary gITF

    return header;
}

function createInvalidMagic() {
    var header = new Buffer(32);

    header.write('xxxx', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // featureTableJSONByteLength
    header.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchTableJSONByteLength
    header.writeUInt32LE(0, 24); // batchTableBinaryByteLength
    header.writeUInt32LE(0, 28); // gltfFormat: 0 - url

    return header;
}

function createInvalidVersion() {
    var header = new Buffer(32);

    header.write('i3dm', 0); // magic
    header.writeUInt32LE(5, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // featureTableJSONByteLength
    header.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchTableJSONByteLength
    header.writeUInt32LE(0, 24); // batchTableBinaryByteLength
    header.writeUInt32LE(0, 28); // gltfFormat: 0 - url

    return header;
}

function createWrongByteLength() {
    var header = new Buffer(32);

    header.write('i3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length - 1, 8); // byteLength
    header.writeUInt32LE(0, 12); // featureTableJSONByteLength
    header.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchTableJSONByteLength
    header.writeUInt32LE(0, 24); // batchTableBinaryByteLength
    header.writeUInt32LE(0, 28); // gltfFormat: 0 - url

    return header;
}

function createInvalidGltfFormat() {
    var header = new Buffer(32);

    header.write('i3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // featureTableJSONByteLength
    header.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchTableJSONByteLength
    header.writeUInt32LE(0, 24); // batchTableBinaryByteLength
    header.writeUInt32LE(5, 28); // gltfFormat: invalid

    return header;
}