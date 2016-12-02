'use strict';
var validateCmpt = require('../../lib/validateCmpt');

describe('validateCmpt', function() {
    it('returns false if the cmpt header is too short', function() {
        expect(validateCmpt(createShortHeader()).result).toBe(false);
    });

    it('returns false if the cmpt has invalid magic', function() {
        expect(validateCmpt(createInvalidMagic()).result).toBe(false);
    });

    it('returns false if the cmpt has invalid version', function() {
        expect(validateCmpt(createInvalidVersion()).result).toBe(false);
    });

    it('returns false if the cmpt has invalid byteLength', function() {
        expect(validateCmpt(createInvalidByteLength()).result).toBe(false);
    });

    it('returns false if the cmpt has less inner tiles than tilesLength field', function() {
        expect(validateCmpt(createCmptMissingInner()).result).toBe(false);
    });

    it('returns false if the cmpt has an unidentifiable inner tile', function() {
        expect(validateCmpt(createCmptUnidentifiedInner()).result).toBe(false);
    });

    it('returns false if the cmpt has an extra bytes in tiles[] field', function() {
        expect(validateCmpt(createCmptExtraBytes()).result).toBe(false);
    });

    it('validates a cmpt tile with no inner tiles', function() {
        expect(validateCmpt(createEmptyCmpt()).result).toBe(true);
    });

    it('validates a cmpt tile with a valid b3dm inner tile', function() {
        expect(validateCmpt(createCmptB3dm()).result).toBe(true);
    });

    it('validates a cmpt tile with a valid i3dm inner tile', function() {
        expect(validateCmpt(createCmptI3dm()).result).toBe(true);
    });

    it('validates a cmpt tile with a valid pnts inner tile', function() {
        expect(validateCmpt(createCmptPnts()).result).toBe(true);
    });

    it('validates a cmpt tile with a valid combinations of inner tiles', function() {
        expect(validateCmpt(createCmptCombination()).result).toBe(true);
    });

    it('returns false if the cmpt has an invalid b3dm inner tile', function() {
        expect(validateCmpt(createCmptInvalidB3dm()).result).toBe(false);
    });

    it('returns false if the cmpt has an invalid i3dm inner tile', function() {
        expect(validateCmpt(createCmptInvalidI3dm()).result).toBe(false);
    });

    it('returns false if the cmpt has an invalid pnts inner tile', function() {
        expect(validateCmpt(createCmptInvalidPnts()).result).toBe(false);
    });

    it('returns false if the cmpt contains any invalid inner tiles', function() {
        expect(validateCmpt(createCmptInvalidCombination()).result).toBe(false);
    });
});

var b3dmHeaderSize = 24;
var i3dmHeaderSize = 32;
var pntsHeaderSize = 28;
var cmptHeaderSize = 16;
var unknownHeaderSize = 12;
var sizeU32Int = 4;

function createB3dmTile(version, byteLength) {
    var byteOffset = 0;

    var b3dmTile = new Buffer(b3dmHeaderSize);
    b3dmTile.write('b3dm', byteOffset); // magic
    byteOffset += sizeU32Int;
    b3dmTile.writeUInt32LE(version, byteOffset); // version
    byteOffset += sizeU32Int;
    b3dmTile.writeUInt32LE(byteLength, byteOffset); // byteLength

    return b3dmTile;
}

function createI3dmTile(version, byteLength, gltfFormat) {
    var byteOffset = 0;

    var i3dmTile = new Buffer(i3dmHeaderSize);
    i3dmTile.write('i3dm', byteOffset); // magic
    byteOffset += sizeU32Int;
    i3dmTile.writeUInt32LE(version, byteOffset); // version
    byteOffset += sizeU32Int;
    i3dmTile.writeUInt32LE(byteLength, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    byteOffset += sizeU32Int; // skip featureTableJSONByteLength
    byteOffset += sizeU32Int; // skip featureTableBinaryByteLength
    byteOffset += sizeU32Int; // skip batchTableJSONByteLength
    byteOffset += sizeU32Int; // skip batchTableBinaryByteLength
    i3dmTile.writeUInt32LE(gltfFormat, byteOffset); // gltfFormat: 0 - url

    return i3dmTile;
}

function createCmptTile(version, byteLength, tilesLength) {
    var byteOffset = 0;

    var cmptTile = new Buffer(cmptHeaderSize);
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(version, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(byteLength, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(tilesLength, byteOffset); // tilesLength

    return cmptTile;
}

function createPntsTile(version, byteLength) {
    var byteOffset = 0;

    var pntsTile = new Buffer(pntsHeaderSize);
    pntsTile.write('pnts', byteOffset); // magic
    byteOffset += sizeU32Int;
    pntsTile.writeUInt32LE(version, byteOffset); // version
    byteOffset += sizeU32Int;
    pntsTile.writeUInt32LE(byteLength, byteOffset); // byteLength

    return pntsTile;
}

function createUnknownTile(version, byteLength) {
    var byteOffset = 0;

    var unknownTile = new Buffer(12);
    unknownTile.write('xxxx', byteOffset); // magic
    byteOffset += sizeU32Int;
    unknownTile.writeUInt32LE(version, byteOffset); // version
    byteOffset += sizeU32Int;
    unknownTile.writeUInt32LE(byteLength, byteOffset); // byteLength

    return unknownTile;
}

function createShortHeader() {
    var byteOffset = 0;

    var cmptTile = new Buffer(cmptHeaderSize - 4);
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength

    return cmptTile;
}

function createInvalidMagic() {
    var byteOffset = 0;

    var cmptTile = new Buffer(16);
    cmptTile.write('xxxx', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(0, byteOffset); // tilesLength

    return cmptTile;
}

function createInvalidVersion() {
    var cmptTile = createCmptTile(5, cmptHeaderSize, 0);
    return cmptTile;
}

function createInvalidByteLength() {
    var cmptTile = createCmptTile(1, cmptHeaderSize - 1, 0);
    return cmptTile;
}

function createCmptMissingInner() {
    var cmptTile = createCmptTile(1, cmptHeaderSize + i3dmHeaderSize, 5);
    var innerI3dm = createI3dmTile(1, i3dmHeaderSize, 0);
    var buf = Buffer.concat([cmptTile, innerI3dm], cmptHeaderSize + i3dmHeaderSize);

    return buf;
}

function createCmptUnidentifiedInner() {
    var cmptTile = createCmptTile(1, cmptHeaderSize + unknownHeaderSize, 1);
    var innerUnknown = createUnknownTile(1, unknownHeaderSize);
    var buf = Buffer.concat([cmptTile, innerUnknown], cmptHeaderSize + unknownHeaderSize);

    return buf;
}

function createCmptExtraBytes() {
    var cmptTile = createCmptTile(1, cmptHeaderSize + b3dmHeaderSize + 4, 1);
    var innerB3dm = createB3dmTile(1, b3dmHeaderSize);
    var buf = Buffer.concat([cmptTile, innerB3dm], cmptHeaderSize + b3dmHeaderSize + 4);

    return buf;
}

function createEmptyCmpt() {
    var cmptTile = createCmptTile(1, cmptHeaderSize, 0);
    return cmptTile;
}

function createCmptB3dm() {
    var cmptTile = createCmptTile(1, cmptHeaderSize + b3dmHeaderSize, 1);
    var innerB3dm = createB3dmTile(1, b3dmHeaderSize);
    var buf = Buffer.concat([cmptTile, innerB3dm], cmptHeaderSize + b3dmHeaderSize);

    return buf;
}

function createCmptI3dm() {
    var cmptTile = createCmptTile(1, cmptHeaderSize + i3dmHeaderSize, 1);
    var innerI3dm = createI3dmTile(1, i3dmHeaderSize, 0);
    var buf = Buffer.concat([cmptTile, innerI3dm], cmptHeaderSize + i3dmHeaderSize);

    return buf;
}

function createCmptPnts() {
    var cmptTile = createCmptTile(1, cmptHeaderSize + pntsHeaderSize, 1);
    var innerPnts = createPntsTile(1, pntsHeaderSize);
    var buf = Buffer.concat([cmptTile, innerPnts], cmptHeaderSize + pntsHeaderSize);

    return buf;
}

function createCmptCombination() {
    //cmpt1[b3dm, cmpt2[cmpt3[pnts], i3dm]]
    var totalSize = 3 * cmptHeaderSize + b3dmHeaderSize + i3dmHeaderSize + pntsHeaderSize
    var cmptTile1 = createCmptTile(1, totalSize, 2);
    var cmptTile2 = createCmptTile(1, 2 * cmptHeaderSize + i3dmHeaderSize + pntsHeaderSize, 2);
    var cmptTile3 = createCmptTile(1, cmptHeaderSize + pntsHeaderSize, 1);
    var innerB3dmTile = createB3dmTile(1, b3dmHeaderSize);
    var innerPntsTile = createPntsTile(1, pntsHeaderSize);
    var innerI3dmTile = createI3dmTile(1, i3dmHeaderSize, 0);
    var buf = Buffer.concat([cmptTile1, innerB3dmTile, cmptTile2, cmptTile3, innerPntsTile, innerI3dmTile], totalSize);

    return buf;
}

function createCmptInvalidB3dm() {
    var cmptTile = createCmptTile(1, cmptHeaderSize + b3dmHeaderSize, 1);
    var innerB3dm = createB3dmTile(5, b3dmHeaderSize);
    var buf = Buffer.concat([cmptTile, innerB3dm], cmptHeaderSize + b3dmHeaderSize);

    return buf;
}

function createCmptInvalidI3dm() {
    var cmptTile = createCmptTile(1, cmptHeaderSize + i3dmHeaderSize, 1);
    var innerI3dm = createI3dmTile(1, i3dmHeaderSize, 15);
    var buf = Buffer.concat([cmptTile, innerI3dm], cmptHeaderSize + i3dmHeaderSize);

    return buf;
}

function createCmptInvalidPnts() {
    var cmptTile = createCmptTile(1, cmptHeaderSize + pntsHeaderSize, 1);
    var innerPnts = createPntsTile(5, pntsHeaderSize);
    var buf = Buffer.concat([cmptTile, innerPnts], cmptHeaderSize + pntsHeaderSize);

    return buf;
}

function createCmptInvalidCombination() {
    //cmpt1[b3dm, cmpt2[cmpt3[pnts], i3dm]] - i3dm is invalid
    var totalSize = 3 * cmptHeaderSize + b3dmHeaderSize + i3dmHeaderSize + pntsHeaderSize
    var cmptTile1 = createCmptTile(1, totalSize, 2);
    var cmptTile2 = createCmptTile(1, 2 * cmptHeaderSize + i3dmHeaderSize + pntsHeaderSize, 2);
    var cmptTile3 = createCmptTile(1, cmptHeaderSize + pntsHeaderSize, 1);
    var innerB3dmTile = createB3dmTile(1, b3dmHeaderSize);
    var innerPntsTile = createPntsTile(1, pntsHeaderSize);
    var innerI3dmTile = createI3dmTile(1, i3dmHeaderSize, 15);
    var buf = Buffer.concat([cmptTile1, innerB3dmTile, cmptTile2, cmptTile3, innerPntsTile, innerI3dmTile], totalSize);

    return buf;
}
