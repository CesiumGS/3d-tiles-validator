'use strict';
var Cesium = require('cesium');
var validateB3dm = require('../../lib/validateB3dm');

var loadJson = Cesium.loadJson;

describe('validateB3dm', function() {
    var batchSchema;
    beforeAll(function(done) {
        console.log("beforeAll");

        loadJson('https://raw.githubusercontent.com/AnalyticalGraphicsInc/3d-tiles/master/schema/batchTable.schema.json')
            .then(function(schema) {
                console.log("loadJson success");
                batchSchema = schema;
                done();
            }).otherwise(function(error){
                console.log("Error loading batch table schema");
                console.log(error);
                //done();
            });
    });
    it('returns true if the b3dm tile is valid, returns false if the b3dm has invalid magic', function() {
        console.log("first b3dm test");
        expect(validateB3dm(createInvalidMagic()).result).toBe(false);
    });

    it('returns true if the b3dm tile is valid, returns false if the b3dm has invalid version', function() {
        expect(validateB3dm(createInvalidVersion()).result).toBe(false);
    });

    it('returns true if the b3dm tile is valid, returns false if the b3dm has wrong byteLength', function() {
        expect(validateB3dm(createWrongByteLength()).result).toBe(false);
    });

    it('returns true if b3dm tile matches spec', function() {
        expect(validateB3dm(createB3dmTile()).result).toBe(true);
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
    var header = new Buffer(24);
    header.write('xxxx', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // batchTableJSONByteLength
    header.writeUInt32LE(0, 16); // batchTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchLength

    return header;
}

function createInvalidVersion() {
    var header = new Buffer(24);
    header.write('b3dm', 0); // magic
    header.writeUInt32LE(5, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength
    header.writeUInt32LE(0, 12); // batchTableJSONByteLength
    header.writeUInt32LE(0, 16); // batchTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchLength

    return header;
}

function createWrongByteLength() {
    var header = new Buffer(24);
    header.write('b3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length - 1, 8); // byteLength
    header.writeUInt32LE(0, 12); // batchTableJSONByteLength
    header.writeUInt32LE(0, 16); // batchTableBinaryByteLength
    header.writeUInt32LE(0, 20); // batchLength

    return header;
}