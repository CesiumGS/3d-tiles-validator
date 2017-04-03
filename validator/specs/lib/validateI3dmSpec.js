'use strict';
var validateI3dm = require('../../lib/validateI3dm');

describe('validateI3dm', function() {
    it('returns false if the i3dm has invalid magic', function() {
        expect(validateI3dm(createInvalidMagic()).result).toBe(false);
    });

    it('returns false if the i3dm has invalid version', function() {
        expect(validateI3dm(createInvalidVersion()).result).toBe(false);
    });

    it('returns false if the i3dm has wrong byteLength', function() {
        expect(validateI3dm(createWrongByteLength()).result).toBe(false);
    });

    it('returns false if the i3dm has invalid gITF Format', function() {
        expect(validateI3dm(createInvalidGltfFormat()).result).toBe(false);
    });

    it('validates an i3dm tile with a url glTF', function() {
        expect(validateI3dm(createI3dmTileGltfUrl()).result).toBe(true);
    });

    it('validates an i3dm tile with an embedded binary glTF', function() {
        expect(validateI3dm(createI3dmTileGltfBinaryGITF()).result).toBe(true);
    });
});

describe('validateI3dm batch table', function() {
    it('validates i3dm tile contains a valid batch table JSON', function() {
        expect(validateI3dm(createI3dmWithBatchJSON()).result).toBe(true);
    });

    it('returns false if i3dm tile contains an invalid batch table JSON', function() {
        expect(validateI3dm(createI3dmWithInvalidBatchJSON()).result).toBe(false);
    });

    it('returns false if i3dm tile contains a batch table JSON that is too long', function() {
        expect(validateI3dm(createI3dmWithBatchJSONLong()).result).toBe(false);
    });

    it('validates i3dm tile contains a valid batch table JSON and binary body', function() {
        expect(validateI3dm(createI3dmWithBatchJSONBinary()).result).toBe(true);
    });

    it('returns false if i3dm tile contains an invalid batch table JSON and binary body', function() {
        expect(validateI3dm(createI3dmWithInvalidBatchJSONBinary()).result).toBe(false);
    });
});


function createI3dmTileGltfUrl() {
    var header = new Buffer(32);
    header.write('i3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // featureTableJSONByteLength
    header.writeUInt32LE(0, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchTableJSONByteLength
    header.writeUInt32LE(0, 24); // batchTableBinaryByteLength
    header.writeUInt32LE(0, 28); // gltfFormat: 0 - url

    return header;
}

function createI3dmTileGltfBinaryGITF() {
    var header = createI3dmTileGltfUrl();
    header.writeUInt32LE(1, 28); // gltfFormat: 1 - embedded binary gITF

    return header;
}

function createInvalidMagic() {
    var header = createI3dmTileGltfUrl();
    header.write('xxxx', 0); // magic

    return header;
}

function createInvalidVersion() {
    var header = createI3dmTileGltfUrl();
    header.writeUInt32LE(5, 4); // version

    return header;
}

function createWrongByteLength() {
    var header = createI3dmTileGltfUrl();
    header.writeUInt32LE(header.length - 1, 8); // byteLength

    return header;
}

function createInvalidGltfFormat() {
    var header = createI3dmTileGltfUrl();
    header.writeUInt32LE(5, 28); // gltfFormat: invalid

    return header;
}

function createI3dmWithBatchJSON() {
    var header = createI3dmTileGltfUrl();
    var batchTableJSON = createValidBatchTableJSON();
    header.writeUInt32LE(header.length + batchTableJSON.length, 8); // byteLength
    header.writeUInt32LE(batchTableJSON.length, 20); // batchTableJSONByteLength

    return Buffer.concat([header, batchTableJSON]);
}

function createI3dmWithInvalidBatchJSON() {
    var header = createI3dmTileGltfUrl();
    var batchTableJSON = createInvalidBatchTableJSON();
    header.writeUInt32LE(header.length + batchTableJSON.length, 8); // byteLength
    header.writeUInt32LE(batchTableJSON.length, 20); // batchTableJSONByteLength

    return Buffer.concat([header, batchTableJSON]);
}

function createI3dmWithBatchJSONLong() {
    var header = createI3dmTileGltfUrl();
    var batchTableJSON = createValidBatchTableJSON();
    header.writeUInt32LE(header.length + batchTableJSON.length - 1, 8); // byteLength
    header.writeUInt32LE(batchTableJSON.length, 20); // batchTableJSONByteLength

    return Buffer.concat([header, batchTableJSON]);
}

function createI3dmWithBatchJSONBinary() {
    var header = createI3dmTileGltfUrl();
    var batchTable = createValidBatchTableBinary();

    header.writeUInt32LE(header.length + batchTable.buffer.length, 8); // byteLength
    header.writeUInt32LE(batchTable.batchTableJSONByteLength, 20); // batchTableJSONByteLength
    header.writeUInt32LE(batchTable.batchTableBinaryByteLength, 24); // batchTableBinaryByteLength

    return Buffer.concat([header, batchTable.buffer]);
}

function createI3dmWithInvalidBatchJSONBinary() {
    var header = createI3dmTileGltfUrl();
    var batchTable = createInvalidBatchTableBinary();

    header.writeUInt32LE(header.length + batchTable.buffer.length, 8); // byteLength
    header.writeUInt32LE(batchTable.batchTableJSONByteLength, 20); // batchTableJSONByteLength
    header.writeUInt32LE(batchTable.batchTableBinaryByteLength, 24); // batchTableBinaryByteLength

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