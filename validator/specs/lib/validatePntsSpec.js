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

    it('validates pnts tile with batch table JSON header matches spec', function() {
        expect(validatePnts(createPntsBatchJson()).result).toBe(true);
    });

    it('returns false if pnts tile with batch table JSON header does not match spec', function() {
        expect(validatePnts(createInvalidPntsBatchJson()).result).toBe(false);
    });

    it('returns false if pnts tile with batch table JSON header is too long', function() {
        expect(validatePnts(createPntsBatchJsonLong()).result).toBe(false);
    });

    it('validates pnts tile with batch table JSON header and binary body matches spec', function() {
        expect(validatePnts(createPntsBatchJsonBinary()).result).toBe(true);
    });

    it('returns false if pnts tile with batch table JSON header and binary body does not match spec', function() {
        expect(validatePnts(createInvalidPntsBatchJsonBinary()).result).toBe(false);
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
    var header = createPntsTile();
    header.write('xxxx', 0); // magic

    return header;
}

function createInvalidVersion() {
    var header = createPntsTile();
    header.writeUInt32LE(5, 4); // version

    return header;
}

function createWrongByteLength() {
    var header = createPntsTile();
    header.writeUInt32LE(header.length - 1, 8); // byteLength

    return header;
}

function createPntsBatchJson() {
    var header = createPntsTile();
    var batchJSON = createValidBatchTableJSON();
    header.writeUInt32LE(header.length + batchJSON.length, 8); // byteLength
    header.writeUInt32LE(batchJSON.length, 20); // batchTableJSONByteLength

    return Buffer.concat([header, batchJSON]);
}

function createInvalidPntsBatchJson() {
    var header = createPntsTile();
    var batchJSON = createInvalidBatchTableJSON();
    header.writeUInt32LE(header.length + batchJSON.length, 8); // byteLength
    header.writeUInt32LE(batchJSON.length, 20); // batchTableJSONByteLength

    return Buffer.concat([header, batchJSON]);
}

function createPntsBatchJsonLong() {
    var header = createPntsTile();
    var batchJSON = createValidBatchTableJSON();
    header.writeUInt32LE(header.length + batchJSON.length - 1, 8); // byteLength
    header.writeUInt32LE(batchJSON.length, 20); // batchTableJSONByteLength

    return Buffer.concat([header, batchJSON]);
}

function createPntsBatchJsonBinary() {
    var header = createPntsTile();
    var batchTable = createValidBatchTableBinary();

    header.writeUInt32LE(header.length + batchTable.buffer.length, 8); // byteLength
    header.writeUInt32LE(batchTable.batchTableJSONByteLength, 20); // batchTableJSONByteLength
    header.writeUInt32LE(batchTable.batchTableBinaryByteLength, 24); // batchTableBinaryByteLength

    return Buffer.concat([header, batchTable.buffer]);
}

function createInvalidPntsBatchJsonBinary() {
    var header = createPntsTile();
    var batchTable = createInvalidBatchTableBinary();

    header.writeUInt32LE(header.length + batchTable.buffer.length, 8); // byteLength
    header.writeUInt32LE(batchTable.batchTableJSONByteLength, 20); // batchTableJSONByteLength
    header.writeUInt32LE(batchTable.batchTableBinaryByteLength, 24); // batchTableBinaryByteLength

    return Buffer.concat([header, batchTable.buffer]);
}

function createValidBatchTableJSON() {
    var batchJson = {
        "id":[0,1,2],
        "longitude":[-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        "height":[8,14,14]
    };

    return new Buffer(JSON.stringify(batchJson));
}

function createInvalidBatchTableJSON() {
    var batchJson = {
        "id":[0],
        "longitude":[-1.3196595204101946],
        "height":8
    };

    return new Buffer(JSON.stringify(batchJson));
}

function createValidBatchTableBinary() {
    var batchJson = {
        "id" : [0, 1, 2],
        "longitude" :[-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        "height" : {
            "byteOffset" : 12,
            "componentType" : "UNSIGNED_INT",
            "type" : "SCALAR"
        }
    };

    var jsonHeader = new Buffer(JSON.stringify(batchJson));

    var heightBinaryBody = new Buffer(12);
    heightBinaryBody.writeUInt32LE(8, 0);
    heightBinaryBody.writeUInt32LE(14, 4);
    heightBinaryBody.writeUInt32LE(14, 8);

    return {
        buffer: Buffer.concat([jsonHeader, heightBinaryBody]),
        batchTableJSONByteLength: jsonHeader.length,
        batchTableBinaryByteLength: heightBinaryBody
    };
}

function createInvalidBatchTableBinary() {
    var batchJson = {
        "id" : [0, 1, 2],
        "longitude" :[-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        "height" : {
            "byteOffset" : 12,
            "componentType" : "UNSIGNED_INT"
        }
    };

    var jsonHeader = new Buffer(JSON.stringify(batchJson));

    var heightBinaryBody = new Buffer(12);
    heightBinaryBody.writeUInt32LE(8, 0);
    heightBinaryBody.writeUInt32LE(14, 4);
    heightBinaryBody.writeUInt32LE(14, 8);

    return {
        buffer: Buffer.concat([jsonHeader, heightBinaryBody]),
        batchTableJSONByteLength: jsonHeader.length,
        batchTableBinaryByteLength: heightBinaryBody
    };
}