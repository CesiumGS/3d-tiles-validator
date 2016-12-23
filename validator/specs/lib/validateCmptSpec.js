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

    it('validates a cmpt tile with no inner tiles', function() {
        expect(validateCmpt(createCmptTile([])).result).toBe(true);
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

function createB3dmTile() {
    var b3dmTile = new Buffer(b3dmHeaderSize);
    b3dmTile.write('b3dm', 0); // magic
    b3dmTile.writeUInt32LE(1, 4); // version
    b3dmTile.writeUInt32LE(b3dmHeaderSize, 8); // byteLength

    return b3dmTile;
}

function createI3dmTile(gltfFormat) {
    var i3dmTile = new Buffer(i3dmHeaderSize);
    i3dmTile.write('i3dm', 0); // magic
    i3dmTile.writeUInt32LE(1, 4); // version
    i3dmTile.writeUInt32LE(i3dmHeaderSize, 8); // byteLength
    i3dmTile.writeUInt32LE(0, 12); // featureTableJSONByteLength
    i3dmTile.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    i3dmTile.writeUInt32LE(0, 20); // batchTableJSONByteLength
    i3dmTile.writeUInt32LE(0, 24); // batchTableBinaryByteLength
    i3dmTile.writeUInt32LE(gltfFormat, 28); // gltfFormat: 0 - url

    return i3dmTile;
}

function createCmptTile(tiles) {
    var byteLength = 16;
    for(var i = 0; i < tiles.length; i++) {
        byteLength += tiles[i].readUInt32LE(8);
    }

    var cmptTile = new Buffer(cmptHeaderSize);
    cmptTile.write('cmpt', 0); // magic
    cmptTile.writeUInt32LE(1, 4); // version
    cmptTile.writeUInt32LE(byteLength, 8); // byteLength
    cmptTile.writeUInt32LE(tiles.length, 12); // tilesLength

    tiles.unshift(cmptTile);
    return Buffer.concat(tiles, byteLength);
}

function createPntsTile() {
    var pntsTile = new Buffer(pntsHeaderSize);
    pntsTile.write('pnts', 0); // magic
    pntsTile.writeUInt32LE(1, 4); // version
    pntsTile.writeUInt32LE(pntsHeaderSize, 8); // byteLength
    pntsTile.writeUInt32LE(0, 12); // featureTableJSONByteLength
    pntsTile.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    pntsTile.writeUInt32LE(0, 20); // batchTableJSONByteLength
    pntsTile.writeUInt32LE(0, 24); // batchTableBinaryByteLength
    return pntsTile;
}

function createUnknownTile() {
    var unknownTile = createB3dmTile();
    unknownTile.write('xxxx', 0); // magic
    return unknownTile;
}

function createShortHeader() {
    var cmptTile = createCmptTile([]);
    return cmptTile.slice(cmptHeaderSize - 4);
}

function createInvalidMagic() {
    var cmptTile = createCmptTile([]);
    cmptTile.write('xxxx', 0); // magic

    return cmptTile;
}

function createInvalidVersion() {
    var cmptTile = createCmptTile([]);
    cmptTile.writeUInt32LE(15, 4); // magic

    return cmptTile;
}

function createInvalidByteLength() {
    var cmptTile = createCmptTile([]);
    cmptTile.writeUInt32LE(cmptHeaderSize - 1, 8); // magic

    return cmptTile;
}

function createCmptMissingInner() {
    var innerI3dm = createI3dmTile(0);
    var cmptTile = createCmptTile([innerI3dm]);
    cmptTile.writeUInt32LE(5, 12);

    return cmptTile;
}

function createCmptUnidentifiedInner() {
    var innerUnknown = createUnknownTile();
    return createCmptTile([innerUnknown]);
}

function createCmptB3dm() {
    var innerB3dm = createB3dmTile();
    return createCmptTile([innerB3dm]);
}

function createCmptI3dm() {
    var innerI3dm = createI3dmTile(0);
    return createCmptTile([innerI3dm]);
}

function createCmptPnts() {
    var innerPnts = createPntsTile();
    return createCmptTile([innerPnts]);
}

function createCmptCombination() {
    //cmpt1[b3dm, cmpt2[cmpt3[pnts], i3dm]]
    var innerB3dmTile = createB3dmTile();
    var innerPntsTile = createPntsTile();
    var innerI3dmTile = createI3dmTile(0);

    var cmptTile3 = createCmptTile([innerPntsTile]);
    var cmptTile2 = createCmptTile([cmptTile3, innerI3dmTile]);
    var cmptTile1 = createCmptTile([innerB3dmTile, cmptTile2]);

    return cmptTile1;
}

function createCmptInvalidB3dm() {
    var innerB3dm = createB3dmTile();
    innerB3dm.writeUInt32LE(5, 4); // version
    return createCmptTile([innerB3dm]);
}

function createCmptInvalidI3dm() {
    var innerI3dm = createI3dmTile(15);
    return createCmptTile([innerI3dm]);
}

function createCmptInvalidPnts() {
    var innerPnts = createPntsTile();
    innerPnts.writeUInt32LE(5, 4); // version
    return createCmptTile([innerPnts]);
}

function createCmptInvalidCombination() {
    //cmpt1[b3dm, cmpt2[cmpt3[pnts], i3dm]] - i3dm is invalid
    var innerB3dmTile = createB3dmTile();
    var innerPntsTile = createPntsTile();
    var innerI3dmTile = createI3dmTile(15);

    var cmptTile3 = createCmptTile([innerPntsTile]);
    var cmptTile2 = createCmptTile([cmptTile3, innerI3dmTile]);
    var cmptTile1 = createCmptTile([innerB3dmTile, cmptTile2]);

    return cmptTile1;
}
