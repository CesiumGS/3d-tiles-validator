'use strict';
var validateCmpt = require('../../lib/validateCmpt');
var validateB3dm = require('../../lib/validateB3dm');

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
        expect(validateCmpt(createCmptShort()).result).toBe(false);
    });

    it('returns false if the cmpt has an unidentifiable inner tile', function() {
        expect(validateCmpt(createCmptUnidentifierInner()).result).toBe(false);
    });

    it('returns false if the cmpt has an extra bytes in tiles[] field', function() {
        expect(validateCmpt(createCmptExtraBytes()).result).toBe(false);
    });

    it('validates a cmpt tile with no inner tiles', function() {
        expect(validateCmpt(createEmptyCmpt()).result).toBe(true);
    });

    it('validates a cmpt tile with a valid b3dm inner tile', function() {
        console.log(validateCmpt(createCmptB3dm()).message);
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

function createShortHeader() {
    var cmptTile = new Buffer(12);
    cmptTile.write('xxxx', 0); // magic
    cmptTile.writeUInt32LE(1, 4); // version
    cmptTile.writeUInt32LE(cmptTile.length, 8); // byteLength

    return cmptTile;
}

function createInvalidMagic() {
    var cmptTile = new Buffer(16);
    cmptTile.write('xxxx', 0); // magic
    cmptTile.writeUInt32LE(1, 4); // version
    cmptTile.writeUInt32LE(cmptTile.length, 8); // byteLength
    cmptTile.writeUInt32LE(0, 12); // tilesLength

    return cmptTile;
}

function createInvalidVersion() {
    var cmptTile = new Buffer(16);
    cmptTile.write('cmpt', 0); // magic
    cmptTile.writeUInt32LE(5, 4); // version
    cmptTile.writeUInt32LE(cmptTile.length, 8); // byteLength
    cmptTile.writeUInt32LE(0, 12); // tilesLength

    return cmptTile;
}

function createInvalidByteLength() {
    var cmptTile = new Buffer(16);
    cmptTile.write('cmpt', 0); // magic
    cmptTile.writeUInt32LE(1, 4); // version
    cmptTile.writeUInt32LE(cmptTile.length - 1, 8); // byteLength
    cmptTile.writeUInt32LE(0, 12); // tilesLength

    return cmptTile;
}

function createCmptShort() {
    var byteOffset = 0;
    var sizeU32Int = 4;
    var cmptTile = new Buffer(48);

    //cmpt header
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(5, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //i3dm header
    cmptTile.write('i3dm', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length - 16, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    byteOffset += sizeU32Int; // skip featureTableJSONByteLength
    byteOffset += sizeU32Int; // skip featureTableBinaryByteLength
    byteOffset += sizeU32Int; // skip batchTableJSONByteLength
    byteOffset += sizeU32Int; // skip batchTableBinaryByteLength
    cmptTile.writeUInt32LE(0, byteOffset); // gltfFormat: 0 - url

    return cmptTile;
}

function createCmptUnidentifierInner() {
    var byteOffset = 0;
    var sizeU32Int = 4;
    var cmptTile = new Buffer(40);

    //cmpt header
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //unknown header
    cmptTile.write('xxxx', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(28, byteOffset); // byteLength

    return cmptTile;
}

function createCmptExtraBytes() {
    var byteOffset = 0;
    var sizeU32Int = 4;
    var cmptTile = new Buffer(44);

    //cmpt header
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //b3dm header
    cmptTile.write('b3dm', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(24, byteOffset); // byteLength

    return cmptTile;
}

function createEmptyCmpt() {
    var cmptTile = new Buffer(16);
    cmptTile.write('cmpt', 0); // magic
    cmptTile.writeUInt32LE(1, 4); // version
    cmptTile.writeUInt32LE(cmptTile.length, 8); // byteLength
    cmptTile.writeUInt32LE(0, 12); // tilesLength

    return cmptTile;
}

function createCmptB3dm() {
    var byteOffset = 0;
    var sizeU32Int = 4;
    var cmptTile = new Buffer(40);

    //cmpt header
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //b3dm header
    cmptTile.write('b3dm', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length - 16, byteOffset); // byteLength

    return cmptTile;
}

function createCmptI3dm() {
    var byteOffset = 0;
    var sizeU32Int = 4;
    var cmptTile = new Buffer(48);

    //cmpt header
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //i3dm header
    cmptTile.write('i3dm', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length - 16, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    byteOffset += sizeU32Int; // skip featureTableJSONByteLength
    byteOffset += sizeU32Int; // skip featureTableBinaryByteLength
    byteOffset += sizeU32Int; // skip batchTableJSONByteLength
    byteOffset += sizeU32Int; // skip batchTableBinaryByteLength
    cmptTile.writeUInt32LE(0, byteOffset); // gltfFormat: 0 - url

    return cmptTile;
}

function createCmptPnts() {
    var byteOffset = 0;
    var sizeU32Int = 4;
    var cmptTile = new Buffer(44);

    //cmpt header
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //pnts header
    cmptTile.write('pnts', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length - 16, byteOffset); // byteLength

    return cmptTile;
}

function createCmptCombination() {
    //cmpt[b3dm, cmpt[cmpt[pnts], i3dm]]

    var byteOffset = 0;
    var sizeU32Int = 4;
    var cmptTile = new Buffer(132);

    //cmpt1 header - contains b3dm and then cmpt2
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(2, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //cmpt[b3dm] header
    cmptTile.write('b3dm', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(24, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    byteOffset += sizeU32Int; // skip batchTableJSONByteLength
    byteOffset += sizeU32Int; // skip batchTableBinaryByteLength
    byteOffset += sizeU32Int; // skip batchLength

    //cmpt[cmpt2] header - contains cmpt3 and then i3dm
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length - 40, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(2, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //cmpt[cmpt2[cmpt3] header - contains pnts
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length - 56 - 32, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //cmpt[cmpt2[cmpt3[pnt]] header
    cmptTile.write('pnts', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(28, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    byteOffset += sizeU32Int; // featureTableJSONByteLength
    byteOffset += sizeU32Int; // featureTableBinaryByteLength
    byteOffset += sizeU32Int; // batchTableJSONByteLength
    byteOffset += sizeU32Int; // batchTableBinaryByteLength

    //cmpt[cmpt2[i3dm] header
    cmptTile.write('i3dm', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(32, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    byteOffset += sizeU32Int; // skip featureTableJSONByteLength
    byteOffset += sizeU32Int; // skip featureTableBinaryByteLength
    byteOffset += sizeU32Int; // skip batchTableJSONByteLength
    byteOffset += sizeU32Int; // skip batchTableBinaryByteLength
    cmptTile.writeUInt32LE(0, byteOffset); // gltfFormat: 0 - url

    return cmptTile;
}

function createCmptInvalidB3dm() {
    var byteOffset = 0;
    var sizeU32Int = 4;
    var cmptTile = new Buffer(40);

    //cmpt header
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //b3dm header
    cmptTile.write('b3dm', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(5, byteOffset); // version: Invalid
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength

    return cmptTile;
}

function createCmptInvalidI3dm() {
    var byteOffset = 0;
    var sizeU32Int = 4;
    var cmptTile = new Buffer(48);

    //cmpt header
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //i3dm header
    cmptTile.write('i3dm', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length - 16, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    byteOffset += sizeU32Int; // skip featureTableJSONByteLength
    byteOffset += sizeU32Int; // skip featureTableBinaryByteLength
    byteOffset += sizeU32Int; // skip batchTableJSONByteLength
    byteOffset += sizeU32Int; // skip batchTableBinaryByteLength
    cmptTile.writeUInt32LE(15, byteOffset); // gltfFormat: invalid

    return cmptTile;
}

function createCmptInvalidPnts() {
    var byteOffset = 0;
    var sizeU32Int = 4;
    var cmptTile = new Buffer(44);

    //cmpt header
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //pnts header
    cmptTile.write('pnts', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length - 20, byteOffset); // byteLength: Invalid

    return cmptTile;
}

function createCmptInvalidCombination() {
    //cmpt[b3dm, cmpt[cmpt[pnts], i3dm]]

    var byteOffset = 0;
    var sizeU32Int = 4;
    var cmptTile = new Buffer(132);

    //cmpt1 header - contains b3dm and then cmpt2
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(2, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //cmpt[b3dm] header
    cmptTile.write('b3dm', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(24, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    byteOffset += sizeU32Int; // skip batchTableJSONByteLength
    byteOffset += sizeU32Int; // skip batchTableBinaryByteLength
    byteOffset += sizeU32Int; // skip batchLength

    //cmpt[cmpt2] header - contains cmpt3 and then i3dm
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length - 40, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(2, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //cmpt[cmpt2[cmpt3] header - contains pnts
    cmptTile.write('cmpt', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(cmptTile.length - 56 - 32, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // tilesLength
    byteOffset += sizeU32Int;

    //cmpt[cmpt2[cmpt3[pnt]] header
    cmptTile.write('pnts', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(28, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    byteOffset += sizeU32Int; // featureTableJSONByteLength
    byteOffset += sizeU32Int; // featureTableBinaryByteLength
    byteOffset += sizeU32Int; // batchTableJSONByteLength
    byteOffset += sizeU32Int; // batchTableBinaryByteLength

    //cmpt[cmpt2[i3dm] header
    cmptTile.write('i3dm', byteOffset); // magic
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(1, byteOffset); // version
    byteOffset += sizeU32Int;
    cmptTile.writeUInt32LE(32, byteOffset); // byteLength
    byteOffset += sizeU32Int;
    byteOffset += sizeU32Int; // skip featureTableJSONByteLength
    byteOffset += sizeU32Int; // skip featureTableBinaryByteLength
    byteOffset += sizeU32Int; // skip batchTableJSONByteLength
    byteOffset += sizeU32Int; // skip batchTableBinaryByteLength
    cmptTile.writeUInt32LE(15, byteOffset); // gltfFormat: invalid

    return cmptTile;
}
