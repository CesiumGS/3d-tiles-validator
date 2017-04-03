'use strict';
var Cesium = require('cesium');
var validateB3dm = require('../../lib/validateB3dm');

describe('validateB3dm', function() {
    it('returns false if the b3dm has invalid magic', function() {
        expect(validateB3dm(createInvalidMagic()).result).toBe(false);
    });

    it('returns false if the b3dm has invalid version', function() {
        expect(validateB3dm(createInvalidVersion()).result).toBe(false);
    });

    it('returns false if the b3dm has wrong byteLength', function() {
        expect(validateB3dm(createWrongByteLength()).result).toBe(false);
    });

    it('validates b3dm tile matches spec', function() {
        expect(validateB3dm(createB3dmTile()).result).toBe(true);
    });
});

describe('validateB3dm batch table', function() {
    it('validates b3dm tile contains a valid batch table JSON', function() {
        expect(validateB3dm(createB3dmWithBatchJSON()).result).toBe(true);
    });

    it('returns false if b3dm tile contains an invalid batch table JSON', function() {
        expect(validateB3dm(createB3dmWithInvalidBatchJSON()).result).toBe(false);
    });

    it('returns false if b3dm tile contains a batch table JSON that is too long', function() {
        expect(validateB3dm(createB3dmWithBatchJSONLong()).result).toBe(false);
    });

    it('validates b3dm tile contains a valid batch table JSON and binary body', function() {
        expect(validateB3dm(createB3dmWithBatchJSONBinary()).result).toBe(true);
    });

    it('returns false if b3dm tile contains an invalid batch table JSON and binary body', function() {
        expect(validateB3dm(createB3dmWithInvalidBatchJSONBinary()).result).toBe(false);
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
    var header = createB3dmTile();
    header.write('xxxx', 0); // magic
    return header;
}

function createInvalidVersion() {
    var header = createB3dmTile();
    header.writeUInt32LE(5, 4); // version

    return header;
}

function createWrongByteLength() {
    var header = createB3dmTile();
    header.writeUInt32LE(header.length - 1, 8); // byteLength

    return header;
}

function createB3dmWithBatchJSON() {
    var header = createB3dmTile();
    var batchTableJSON = createValidBatchTableJSON();
    header.writeUInt32LE(header.length + batchTableJSON.length, 8); // byteLength
    header.writeUInt32LE(batchTableJSON.length, 12); // batchTableJSONByteLength

    return Buffer.concat([header, batchTableJSON]);
}

function createB3dmWithInvalidBatchJSON() {
    var header = createB3dmTile();
    var batchTableJSON = createInvalidBatchTableJSON();
    header.writeUInt32LE(header.length + batchTableJSON.length, 8); // byteLength
    header.writeUInt32LE(batchTableJSON.length, 12); // batchTableJSONByteLength

    return Buffer.concat([header, batchTableJSON]);
}

function createB3dmWithBatchJSONLong() {
    var header = createB3dmTile();
    var batchTableJSON = createValidBatchTableJSON();
    header.writeUInt32LE(header.length + batchTableJSON.length - 1, 8); // byteLength
    header.writeUInt32LE(batchTableJSON.length, 12); // batchTableJSONByteLength

    return Buffer.concat([header, batchTableJSON]);
}

function createB3dmWithBatchJSONBinary() {
    var header = createB3dmTile();
    var batchTable = createValidBatchTableBinary();

    header.writeUInt32LE(header.length + batchTable.buffer.length, 8); // byteLength
    header.writeUInt32LE(batchTable.batchTableJSONByteLength, 12); // batchTableJSONByteLength
    header.writeUInt32LE(batchTable.batchTableBinaryByteLength, 16); // batchTableBinaryByteLength

    return Buffer.concat([header, batchTable.buffer]);
}

function createB3dmWithInvalidBatchJSONBinary() {
    var header = createB3dmTile();
    var batchTable = createInvalidBatchTableBinary();

    header.writeUInt32LE(header.length + batchTable.buffer.length, 8); // byteLength
    header.writeUInt32LE(batchTable.batchTableJSONByteLength, 12); // batchTableJSONByteLength
    header.writeUInt32LE(batchTable.batchTableBinaryByteLength, 16); // batchTableBinaryByteLength

    return Buffer.concat([header, batchTable.buffer]);
}

function createValidBatchTableJSON() {
    var batchTableJSON = {
        id:[0,1,2],
        longitude:[-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        height:[8,14,14]
    };

    return new Buffer(JSON.stringify(batchTableJSON));
}

function createInvalidBatchTableJSON() {
    var batchTableJSON = {
        id:[0],
        longitude:[-1.3196595204101946],
        height:8
    };

    return new Buffer(JSON.stringify(batchTableJSON));
}

function createValidBatchTableBinary() {
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