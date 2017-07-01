'use strict';
var validatePnts = require('../../lib/validatePnts');

describe('validate pnts', function() {
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

describe('validate pnts batch table', function() {
    it('validates pnts tile contains a valid batch table JSON', function() {
        expect(validatePnts(createPntsWithBatchJSON()).result).toBe(true);
    });

    it('returns false if pnts tile contains an invalid batch table JSON', function() {
        expect(validatePnts(createPntsWithInvalidBatchJSON()).result).toBe(false);
    });

    it('returns false if pnts tile contains a batch table JSON that is too long', function() {
        expect(validatePnts(createPntsWithBatchJSONLong()).result).toBe(false);
    });

    it('validates pnts tile contains a valid batch table JSON and binary body', function() {
        expect(validatePnts(createPntsWithBatchJSONBinary()).result).toBe(true);
    });

    it('returns false if pnts contains an invalid batch table JSON and binary body', function() {
        expect(validatePnts(createPntsWithInvalidBatchJSONBinary()).result).toBe(false);
    });
});

var pntsHeaderSize = 28;
var magicOffset = 0;
var versionOffset = 4;
var byteLengthOffset = 8;
var featureTableJSONByteLengthOffset = 12;
var featureTableBinaryByteLengthOffset = 16;
var batchTableJSONByteLengthOffset = 20;
var batchTableBinaryByteLengthOffset = 24;

function createPntsTile() {
    var header = new Buffer(pntsHeaderSize);
    header.write('pnts', magicOffset); // magic
    header.writeUInt32LE(1, versionOffset); // version
    header.writeUInt32LE(header.length, byteLengthOffset); // byteLength
    header.writeUInt32LE(0, featureTableJSONByteLengthOffset); // featureTableJSONByteLength
    header.writeUInt32LE(0, featureTableBinaryByteLengthOffset); // featureTableBinaryByteLength
    header.writeUInt32LE(0, batchTableJSONByteLengthOffset); // batchTableJSONByteLength
    header.writeUInt32LE(0, batchTableBinaryByteLengthOffset); // batchTableBinaryByteLength

    return header;
}

function createInvalidMagic() {
    var header = createPntsTile();
    header.write('xxxx', magicOffset);

    return header;
}

function createInvalidVersion() {
    var header = createPntsTile();
    header.writeUInt32LE(5, versionOffset); // version

    return header;
}

function createWrongByteLength() {
    var header = createPntsTile();
    header.writeUInt32LE(header.length - 1, byteLengthOffset); // byteLength

    return header;
}

function createPntsWithBatchJSON() {
    var header = createPntsTile();
    var featureTableJSON = createBatchLengthFeatureTable(3);
    var batchTableJSON = createValidBatchTableJSON();
    header.writeUInt32LE(header.length + featureTableJSON.length + batchTableJSON.length, byteLengthOffset); // byteLength
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTableJSON.length, batchTableJSONByteLengthOffset); // batchTableJSONByteLength

    return Buffer.concat([header, featureTableJSON, batchTableJSON]);
}

function createPntsWithInvalidBatchJSON() {
    var header = createPntsTile();
    var featureTableJSON = createBatchLengthFeatureTable(1);
    var batchTableJSON = createInvalidBatchTableJSON();
    header.writeUInt32LE(header.length + featureTableJSON.length + batchTableJSON.length, byteLengthOffset); // byteLength
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTableJSON.length, batchTableJSONByteLengthOffset); // batchTableJSONByteLength

    return Buffer.concat([header, featureTableJSON, batchTableJSON]);
}

function createPntsWithBatchJSONLong() {
    var header = createPntsTile();
    var featureTableJSON = createBatchLengthFeatureTable(3);
    var batchTableJSON = createValidBatchTableJSON();
    header.writeUInt32LE(header.length + featureTableJSON.length + batchTableJSON.length - 1, byteLengthOffset); // byteLength
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTableJSON.length, batchTableJSONByteLengthOffset); // batchTableJSONByteLength

    return Buffer.concat([header, featureTableJSON, batchTableJSON]);
}

function createPntsWithBatchJSONBinary() {
    var header = createPntsTile();
    var featureTableJSON = createBatchLengthFeatureTable(3);
    var batchTable = createValidBatchTableBinary();

    header.writeUInt32LE(header.length + featureTableJSON.length + batchTable.buffer.length, byteLengthOffset); // byteLength
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTable.batchTableJSONByteLength, batchTableJSONByteLengthOffset); // batchTableJSONByteLength
    header.writeUInt32LE(batchTable.batchTableBinaryByteLength, batchTableBinaryByteLengthOffset); // batchTableBinaryByteLength

    return Buffer.concat([header, featureTableJSON, batchTable.buffer]);
}

function createPntsWithInvalidBatchJSONBinary() {
    var header = createPntsTile();
    var featureTableJSON = createBatchLengthFeatureTable(3);
    var batchTable = createInvalidBatchTableBinary();

    header.writeUInt32LE(header.length + featureTableJSON.length + batchTable.buffer.length, byteLengthOffset); // byteLength
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTable.batchTableJSONByteLength, batchTableJSONByteLengthOffset); // batchTableJSONByteLength
    header.writeUInt32LE(batchTable.batchTableBinaryByteLength, batchTableBinaryByteLengthOffset); // batchTableBinaryByteLength

    return Buffer.concat([header, featureTableJSON, batchTable.buffer]);
}

function createBatchLengthFeatureTable(batchLength) {
    var featureTableJSON = {
        BATCH_LENGTH : batchLength
    };

    return new Buffer(JSON.stringify(featureTableJSON));
}

function createValidBatchTableJSON() {
    var batchTableJSON = {
        id : [0,1,2],
        longitude : [-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        height : [8,14,14]
    };

    return new Buffer(JSON.stringify(batchTableJSON));
}

function createInvalidBatchTableJSON() {
    var batchTableJSON = {
        id : [0],
        longitude : [-1.3196595204101946],
        height : 8
    };

    return new Buffer(JSON.stringify(batchTableJSON));
}

function createValidBatchTableBinary() {
    var batchTableJSON = {
        id : [0, 1, 2],
        longitude : [-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        height : {
            byteOffset : 0,
            componentType : 'UNSIGNED_INT',
            type : 'SCALAR'
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
        longitude : [-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        height : {
            byteOffset : 0,
            componentType : 'UNSIGNED_INT'
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
