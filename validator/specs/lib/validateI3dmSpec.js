'use strict';
var validateI3dm = require('../../lib/validateI3dm');

describe('validateI3dm', function() {

    it('returns false if the i3dm has invalid magic', function() {
        expect(validateI3dm(createInvalidMagic()).result).toBe(false);
    });

    it('returns false if the i3dm has invalid version', function() {
        expect(validateI3dm(createInvalidVersion()).result).toBe(false);
    });

    it('returns false if the i3dm has wrong byteLength', function() {
        expect(validateI3dm(createWrongByteLength()).result).toBe(false);
    });

    it('returns false if the i3dm has invalid gITF Format', function() {
        expect(validateI3dm(createInvalidGltfFormat()).result).toBe(false);
    });

    it('validates an i3dm tile with a url glTF', function() {
        expect(validateI3dm(createI3dmTileGltfUrl()).result).toBe(true);
    });

    it('validates an i3dm tile with an embedded binary glTF', function() {
        expect(validateI3dm(createI3dmTileGltfBinaryGITF()).result).toBe(true);
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