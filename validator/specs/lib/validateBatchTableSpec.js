'use strict';
var batchTableSchema = require('../data/schema/batchTable.schema.json');
var validateBatchTable = require('../../lib/validateBatchTable');

describe('validate batch table', function() {
    it('validates a batch table JSON matches schema', function() {
        var batchTableJSON = createValidBatchTableJSON();
        expect(validateBatchTable(batchTableSchema, batchTableJSON, 3).result).toBe(true);
    });

    it('validates a batch table JSON object matches schema with valid binary body', function() {
        var batchTableJSON = createValidBatchTableJSONBinary();
        var batchTableBinary = createValidBatchTableBinary();
        expect(validateBatchTable(batchTableSchema, batchTableJSON, batchTableBinary, 3).result).toBe(true);
    });

    it('returns false if batch table JSON does not match schema', function() {
        var batchTableJSON = createInvalidBatchTableJSON();
        expect(validateBatchTable(batchTableSchema, batchTableJSON, 1).result).toBe(false);
    });

    it('returns false if batch table JSON does not match schema with binary body', function() {
        var batchTableJSON = createInvalidBatchTableJSONBinary();
        var batchTableBinary = createValidBatchTableBinary();
        expect(validateBatchTable(batchTableSchema, batchTableJSON, batchTableBinary, 3).result).toBe(false);
    });

    it('Binary property byteOffset out of bounds', function() {
        var batchTableJSON = createValidBatchTableJSONBinary();
        var batchTableBinary = createValidBatchTableBinary();
        batchTableJSON.height.byteOffset = batchTableBinary.length + 5;
        expect(validateBatchTable(batchTableSchema, batchTableJSON, batchTableBinary, 3).result).toBe(false);
    });

    it('Binary property byteoffset within another', function() {
        var batchTableJSON = createValidBatchTableJSONBinary();
        var batchTableBinary = createValidBatchTableBinary();
        batchTableJSON.height.byteOffset = batchTableJSON.height.byteOffset - 1;
        expect(validateBatchTable(batchTableSchema, batchTableJSON, batchTableBinary, 3).result).toBe(false);
    });
});

function createValidBatchTableJSON() {
    var batchTableJSON = {
        id : [0,1,2],
        longitude : [-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        height : [8,14,14]
    };

    return batchTableJSON;
}

function createInvalidBatchTableJSON() {
    var batchTableJSON = {
        id : [0],
        longitude : [-1.3196595204101946],
        height : 8
    };

    return batchTableJSON;
}

function createValidBatchTableJSONBinary() {
    var batchTableJSON = {
        id : [0, 1, 2],
        longitude : [-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        height : {
            "byteOffset" : 0,
            "componentType" : 'UNSIGNED_INT',
            "type" : 'SCALAR'
        },
        width : {
            "byteOffset" : 12,
            "componentType" : 'UNSIGNED_INT',
            "type" : 'SCALAR'
        }
    };

    return batchTableJSON;
}

function createInvalidBatchTableJSONBinary() {
    var batchTableJSON = {
        id : [0, 1, 2],
        longitude : [-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        height : {
            "byteOffset" : 0,
            "componentType" : 'UNSIGNED_INT'
        }
    };

    return batchTableJSON;
}

function createValidBatchTableBinary() {
    var heightBinaryBody = new Buffer(12);
    heightBinaryBody.writeUInt32LE(8, 0);
    heightBinaryBody.writeUInt32LE(14, 4);
    heightBinaryBody.writeUInt32LE(14, 8);

    var widthBinaryBody = new Buffer(12);
    widthBinaryBody.writeUInt32LE(2, 0);
    widthBinaryBody.writeUInt32LE(3, 4);
    widthBinaryBody.writeUInt32LE(6, 8);
    return Buffer.concat([heightBinaryBody, widthBinaryBody]);
}
