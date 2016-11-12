'use strict';
var validatePnts = require('../../lib/validatePnts');

describe('validatePnts', function() {
    it('returns false if the pnts has invalid magic', function() {
        expect(validatePnts(createInvalidMagic()).result).toBe(false);
    });

    it('returns false if the pnts has invalid version', function() {
        expect(validatePnts(createInvalidVersion()).result).toBe(false);
    });

    it('returns false if the pnts has wrong byteLength', function() {
        expect(validatePnts(createWrongByteLength()).result).toBe(false);
    });

    it('validates that pnts tile matches spec', function() {
        expect(validatePnts(createPntsTile()).result).toBe(true);
    });
});

function createPntsTile() {
    var header = new Buffer(28);
    header.write('pnts', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // featureTableJSONByteLength
    header.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchTableJSONByteLength
    header.writeUInt32LE(0, 24); // batchTableBinaryByteLength

    return header;
}

function createInvalidMagic() {
    var header = new Buffer(28);
    header.write('xxxx', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // featureTableJSONByteLength
    header.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchTableJSONByteLength
    header.writeUInt32LE(0, 24); // batchTableBinaryByteLength

    return header;
}

function createInvalidVersion() {
    var header = new Buffer(28);
    header.write('pnts', 0); // magic
    header.writeUInt32LE(5, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // featureTableJSONByteLength
    header.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchTableJSONByteLength
    header.writeUInt32LE(0, 24); // batchTableBinaryByteLength

    return header;
}

function createWrongByteLength() {
    var header = new Buffer(24);
    header.write('pnts', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length - 1, 8); // byteLength
    header.writeUInt32LE(0, 12); // featureTableJSONByteLength
    header.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchTableJSONByteLength
    header.writeUInt32LE(0, 24); // batchTableBinaryByteLength

    return header;
}
