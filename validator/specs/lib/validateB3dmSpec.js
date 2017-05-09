'use strict';
var Cesium = require('cesium');
var validateB3dm = require('../../lib/validateB3dm');

describe('validate b3dm', function() {
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

describe('validate b3dm batch table', function() {
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

var b3dmHeaderSize = 28;
var magicOffset = 0;
var versionOffset = 4;
var byteLengthOffset = 8;
var featureTableJSONByteLengthOffset = 12;
var featureTableBinaryByteLengthOffset = 16;
var batchTableJSONByteLengthOffset = 20;
var batchTableBinaryByteLengthOffset = 24;

function createB3dmTile() {
    var header = new Buffer(b3dmHeaderSize);
    header.write('b3dm', magicOffset); // magic
    header.writeUInt32LE(1, versionOffset); // version
    header.writeUInt32LE(header.length, byteLengthOffset); // byteLength
    header.writeUInt32LE(0, featureTableJSONByteLengthOffset); // featureTableJSONByteLength
    header.writeUInt32LE(0, featureTableBinaryByteLengthOffset); // featureTableBinaryByteLength
    header.writeUInt32LE(0, batchTableJSONByteLengthOffset); // batchTableJSONByteLength
    header.writeUInt32LE(0, batchTableBinaryByteLengthOffset); // batchTableBinaryByteLength

    return header;
}

function createInvalidMagic() {
    var header = createB3dmTile();
    header.write('xxxx', magicOffset);
    return header;
}

function createInvalidVersion() {
    var header = createB3dmTile();
    header.writeUInt32LE(5, versionOffset);
    return header;
}

function createWrongByteLength() {
    var header = createB3dmTile();
    header.writeUInt32LE(header.length - 1, byteLengthOffset);
    return header;
}

function createB3dmWithBatchJSON() {
    var header = createB3dmTile();
    var featureTableJSON = createBatchLengthFeatureTable(3);
    var batchTableJSON = createValidBatchTableJSON();

    header.writeUInt32LE(header.length + featureTableJSON.length + batchTableJSON.length, byteLengthOffset);
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTableJSON.length, batchTableJSONByteLengthOffset);

    return Buffer.concat([header, featureTableJSON, batchTableJSON]);
}

function createB3dmWithInvalidBatchJSON() {
    var header = createB3dmTile();
    var featureTableJSON = createBatchLengthFeatureTable(1);
    var batchTableJSON = createInvalidBatchTableJSON();

    header.writeUInt32LE(header.length + + featureTableJSON.length + batchTableJSON.length, byteLengthOffset);
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);

    header.writeUInt32LE(batchTableJSON.length, batchTableJSONByteLengthOffset);

    return Buffer.concat([header, featureTableJSON, batchTableJSON]);
}

function createB3dmWithBatchJSONLong() {
    var header = createB3dmTile();
    var featureTableJSON = createBatchLengthFeatureTable(3);
    var batchTableJSON = createValidBatchTableJSON();

    header.writeUInt32LE(header.length + featureTableJSON.length + batchTableJSON.length - 1, byteLengthOffset);
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTableJSON.length, batchTableJSONByteLengthOffset);

    return Buffer.concat([header, featureTableJSON, batchTableJSON]);
}

function createB3dmWithBatchJSONBinary() {
    var header = createB3dmTile();
    var featureTableJSON = createBatchLengthFeatureTable(3);
    var batchTable = createValidBatchTableBinary();

    header.writeUInt32LE(header.length + featureTableJSON.length + batchTable.buffer.length, byteLengthOffset);
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTable.batchTableJSONByteLength, batchTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTable.batchTableBinaryByteLength, batchTableBinaryByteLengthOffset);

    return Buffer.concat([header, featureTableJSON, batchTable.buffer]);
}

function createB3dmWithInvalidBatchJSONBinary() {
    var header = createB3dmTile();
    var featureTableJSON = createBatchLengthFeatureTable(3);
    var batchTable = createInvalidBatchTableBinary();

    header.writeUInt32LE(header.length + featureTableJSON.length + batchTable.buffer.length, byteLengthOffset);
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTable.batchTableJSONByteLength, batchTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTable.batchTableBinaryByteLength, batchTableBinaryByteLengthOffset);

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
        longitude : [-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
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
