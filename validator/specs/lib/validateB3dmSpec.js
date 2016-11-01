'use strict';
var validateB3dm = require('../../lib/validateB3dm');

describe('validateB3dm', function() {

    it('returns true if the b3dm tile is valid, returns false if the b3dm has invalid magic', function() {
        expect(validateB3dm(createInvalidMagic())).toBe(false);
    });

    it('returns true if the b3dm tile is valid, returns false if the b3dm has invalid version', function() {
        expect(validateB3dm(createInvalidVersion())).toBe(false);
    });

    it('returns true if the b3dm tile is valid, returns false if the b3dm has wrong byteLength', function() {
        expect(validateB3dm(createWrongByteLength())).toBe(false);
    });

    it('returns true if b3dm tile matches spec', function() {
        expect(validateB3dm(createB3dmTile())).toBe(true);
    });
});

function createB3dmTile() {
    var header = new Buffer(24);

    header.write('b3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // batchTableJSONByteLength
    header.writeUInt32LE(0, 16); // batchTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchLength

    return header;
}

function createInvalidMagic() {
    var header = new Buffer(24);

    header.write('xxxx', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // batchTableJSONByteLength
    header.writeUInt32LE(0, 16); // batchTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchLength

    return header;
}

function createInvalidVersion() {
    var header = new Buffer(24);
    header.write('b3dm', 0); // magic
    header.writeUInt32LE(5, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // batchTableJSONByteLength
    header.writeUInt32LE(0, 16); // batchTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchLength

    return header;
}

function createWrongByteLength() {
    var header = new Buffer(24);
    header.write('b3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(99, 8); // byteLength
    header.writeUInt32LE(0, 12); // batchTableJSONByteLength
    header.writeUInt32LE(0, 16); // batchTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchLength

    return header;
}