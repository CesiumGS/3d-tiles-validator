'use strict';
var validateCmpt = require('../../lib/validateCmpt');

var b3dmHeaderSize = 24;
var i3dmHeaderSize = 32;
var pntsHeaderSize = 28;
var cmptHeaderSize = 16;

describe('validateCmpt', function() {
    it('returns false if the cmpt header is too short', function() {
        var cmptTile = createCmptTile([]);
        cmptTile = cmptTile.slice(cmptHeaderSize - 4);

        expect(validateCmpt(cmptTile).result).toBe(false);
    });

    it('returns false if the cmpt has invalid magic', function() {
        var cmptTile = createCmptTile([]);
        cmptTile.write('xxxx', 0); // magic

        expect(validateCmpt(cmptTile).result).toBe(false);
    });

    it('returns false if the cmpt has invalid version', function() {
        var cmptTile = createCmptTile([]);
        cmptTile.writeUInt32LE(15, 4); // version

        expect(validateCmpt(cmptTile).result).toBe(false);
    });

    it('returns false if the cmpt has invalid byteLength', function() {
        var cmptTile = createCmptTile([]);
        cmptTile.writeUInt32LE(cmptHeaderSize - 1, 8); // byteLength

        expect(validateCmpt(cmptTile).result).toBe(false);
    });

    it('returns false if the cmpt has less inner tiles than tilesLength field', function() {
        var innerI3dm = createI3dmTile();
        var cmptTile = createCmptTile([innerI3dm]);
        cmptTile.writeUInt32LE(5, 12);

        expect(validateCmpt(cmptTile).result).toBe(false);
    });

    it('returns false if the cmpt has an unidentifiable inner tile', function() {
        var innerUnknown = createUnknownTile();
        var cmptTile = createCmptTile([innerUnknown]);

        expect(validateCmpt(cmptTile).result).toBe(false);
    });

    it('validates a cmpt tile with no inner tiles', function() {
        expect(validateCmpt(createCmptTile([])).result).toBe(true);
    });

    it('validates a cmpt tile with a valid b3dm inner tile', function() {
        var innerB3dm = createB3dmTile();
        var cmptTile = createCmptTile([innerB3dm]);

        expect(validateCmpt(cmptTile).result).toBe(true);
    });

    it('validates a cmpt tile with a valid i3dm inner tile', function() {
        var innerI3dm = createI3dmTile();
        var cmptTile = createCmptTile([innerI3dm]);

        expect(validateCmpt(cmptTile).result).toBe(true);
    });

    it('validates a cmpt tile with a valid pnts inner tile', function() {
        var innerPnts = createPntsTile();
        var cmptTile = createCmptTile([innerPnts]);

        expect(validateCmpt(cmptTile).result).toBe(true);
    });

    it('validates a cmpt tile with a valid combinations of inner tiles', function() {
        expect(validateCmpt(createCmptCombination()).result).toBe(true);
    });

    it('returns false if the cmpt has an invalid inner tile', function() {
        expect(validateCmpt(createCmptInvalidCombination()).result).toBe(false);
    });

    it('returns false if the cmpt has an invalid b3dm inner tile', function() {
        var innerB3dm = createB3dmTile();
        innerB3dm.writeUInt32LE(5, 4); // version
        var cmptTile = createCmptTile([innerB3dm]);

        expect(validateCmpt(cmptTile).result).toBe(false);
    });

    it('returns false if the cmpt has an invalid i3dm inner tile', function() {
        var innerI3dm = createI3dmTile();
        innerI3dm.writeUInt32LE(15, 28);
        var cmptTile = createCmptTile([innerI3dm]);

        expect(validateCmpt(cmptTile).result).toBe(false);
    });

    it('returns false if the cmpt has an invalid pnts inner tile', function() {
        var innerPnts = createPntsTile();
        innerPnts.writeUInt32LE(5, 4); // version
        var cmptTile = createCmptTile([innerPnts]);

        expect(validateCmpt(cmptTile).result).toBe(false);
    });

    it('returns false if the cmpt inner tiles contain an invalid batch table', function() {
        expect(validateCmpt(createCmptWithInvalidBatchTable()).result).toBe(false);
    });

    it('validates a cmpt tile with an inner tile containing a valid batch table', function() {
        console.log(validateCmpt(createCmptWithBatchTable()).message);
        expect(validateCmpt(createCmptWithBatchTable()).result).toBe(true);
    });
});

function createB3dmTile() {
    var b3dmTile = new Buffer(b3dmHeaderSize);
    b3dmTile.write('b3dm', 0); // magic
    b3dmTile.writeUInt32LE(1, 4); // version
    b3dmTile.writeUInt32LE(b3dmHeaderSize, 8); // byteLength

    return b3dmTile;
}

function createI3dmTile() {
    var i3dmTile = new Buffer(i3dmHeaderSize);
    i3dmTile.write('i3dm', 0); // magic
    i3dmTile.writeUInt32LE(1, 4); // version
    i3dmTile.writeUInt32LE(i3dmHeaderSize, 8); // byteLength
    i3dmTile.writeUInt32LE(0, 12); // featureTableJSONByteLength
    i3dmTile.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    i3dmTile.writeUInt32LE(0, 20); // batchTableJSONByteLength
    i3dmTile.writeUInt32LE(0, 24); // batchTableBinaryByteLength
    i3dmTile.writeUInt32LE(0, 28); // gltfFormat: 0 - url

    return i3dmTile;
}

function createCmptTile(tiles) {
    var innerTiles = Buffer.concat(tiles);
    var cmptHeader = new Buffer(cmptHeaderSize);
    cmptHeader.write('cmpt', 0); // magic
    cmptHeader.writeUInt32LE(1, 4); // version
    cmptHeader.writeUInt32LE(innerTiles.length + cmptHeaderSize, 8); // byteLength
    cmptHeader.writeUInt32LE(tiles.length, 12); // tilesLength
    tiles.unshift(cmptHeader);
    return Buffer.concat(tiles);
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

function createCmptCombination() {
    //cmpt1[b3dm, cmpt2[cmpt3[pnts], i3dm]]
    var innerB3dmTile = createB3dmTile();
    var innerPntsTile = createPntsTile();
    var innerI3dmTile = createI3dmTile();

    var cmptTile3 = createCmptTile([innerPntsTile]);
    var cmptTile2 = createCmptTile([cmptTile3, innerI3dmTile]);
    var cmptTile1 = createCmptTile([innerB3dmTile, cmptTile2]);

    return cmptTile1;
}

function createCmptInvalidCombination() {
    //cmpt1[b3dm, cmpt2[cmpt3[pnts], i3dm]] - i3dm is invalid
    var innerB3dmTile = createB3dmTile();
    var innerPntsTile = createPntsTile();
    var innerI3dmTile = createI3dmTile();
    innerI3dmTile.writeUInt32LE(15, 28);

    var cmptTile3 = createCmptTile([innerPntsTile]);
    var cmptTile2 = createCmptTile([cmptTile3, innerI3dmTile]);
    var cmptTile1 = createCmptTile([innerB3dmTile, cmptTile2]);

    return cmptTile1;
}

function createCmptWithBatchTable() {
    //cmpt1[b3dm, cmpt2[cmpt3[pnts], i3dm]]
    var innerB3dmTile = createB3dmTile();
    var innerPntsTile = createPntsTile();
    var innerI3dmTile = createI3dmTile();

    var batchTable = createBatchTableBinary();
    innerB3dmTile.writeUInt32LE(innerB3dmTile.length + batchTable.buffer.length, 8); // byteLength
    innerB3dmTile.writeUInt32LE(batchTable.batchTableJSONByteLength, 12); // batchTableJSONByteLength
    innerB3dmTile.writeUInt32LE(batchTable.batchTableBinaryByteLength, 16);
    innerB3dmTile = Buffer.concat([innerB3dmTile, batchTable.buffer]);

    var cmptTile3 = createCmptTile([innerPntsTile]);
    var cmptTile2 = createCmptTile([cmptTile3, innerI3dmTile]);
    var cmptTile1 = createCmptTile([innerB3dmTile, cmptTile2]);

    return cmptTile1;
}

function createCmptWithInvalidBatchTable() {
    //cmpt1[b3dm, cmpt2[cmpt3[pnts], i3dm]]
    var innerB3dmTile = createB3dmTile();
    var innerPntsTile = createPntsTile();
    var innerI3dmTile = createI3dmTile();

    var batchTable = createInvalidBatchTableBinary();
    innerB3dmTile.writeUInt32LE(innerB3dmTile.length + batchTable.buffer.length, 8); // byteLength
    innerB3dmTile.writeUInt32LE(batchTable.batchTableJSONByteLength, 12); // batchTableJSONByteLength
    innerB3dmTile.writeUInt32LE(batchTable.batchTableBinaryByteLength, 16); // batchTableBinaryByteLength

    var cmptTile3 = createCmptTile([innerPntsTile]);
    var cmptTile2 = createCmptTile([cmptTile3, innerI3dmTile]);
    var cmptTile1 = createCmptTile([innerB3dmTile, cmptTile2]);

    return cmptTile1;
}

function createBatchTableBinary() {
    var batchTableJSON = {
        id : [0, 1, 2],
        longitude :[-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        height : {
            "byteOffset" : 0,
            "componentType" : 'UNSIGNED_INT',
            "type" : 'SCALAR'
        }
    };

    var jsonHeader = new Buffer(JSON.stringify(batchTableJSON));

    var heightBinaryBody = new Buffer(12);
    heightBinaryBody.writeUInt32LE(8, 0);
    heightBinaryBody.writeUInt32LE(14, 4);
    heightBinaryBody.writeUInt32LE(14, 8);

    return {
        buffer: Buffer.concat([jsonHeader, heightBinaryBody]),
        batchTableJSONByteLength: jsonHeader.length,
        batchTableBinaryByteLength: heightBinaryBody.length
    };
}

function createInvalidBatchTableBinary() {
    var batchTableJSON = {
        id : [0, 1, 2],
        longitude :[-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        height : {
            "byteOffset" : 0,
            "componentType" : 'UNSIGNED_INT'
        }
    };

    var jsonHeader = new Buffer(JSON.stringify(batchTableJSON));

    var heightBinaryBody = new Buffer(12);
    heightBinaryBody.writeUInt32LE(8, 0);
    heightBinaryBody.writeUInt32LE(14, 4);
    heightBinaryBody.writeUInt32LE(14, 8);

    return {
        buffer: Buffer.concat([jsonHeader, heightBinaryBody]),
        batchTableJSONByteLength: jsonHeader.length,
        batchTableBinaryByteLength: heightBinaryBody.length
    };
}