'use strict';
var validateB3dm = require('../../lib/validateB3dm');
var specUtility = require('./specUtility.js');

var createB3dm = specUtility.createB3dm;
var createB3dmLegacy1 = specUtility.createB3dmLegacy1;
var createB3dmLegacy2 = specUtility.createB3dmLegacy2;

describe('validate b3dm', function() {
    it('returns error message if the b3dm buffer\'s byte length is less than its header length', function(done) {
        expect (validateB3dm(Buffer.alloc(0)).then(function(message) {
            expect(message).toBe('Header must be 28 bytes.');
        }), done).toResolve();
    });

    it('returns error message if the b3dm has invalid magic', function(done) {
        var b3dm = createB3dm();
        b3dm.write('xxxx', 0);
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBe('Invalid magic: xxxx');
        }), done).toResolve();
    });

    it('returns error message if the b3dm has an invalid version', function(done) {
        var b3dm = createB3dm();
        b3dm.writeUInt32LE(10, 4);
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBe('Invalid version: 10. Version must be 1.');
        }), done).toResolve();
    });

    it('returns error message if the b3dm has wrong byteLength', function(done) {
        var b3dm = createB3dm();
        b3dm.writeUInt32LE(0, 8);
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBeDefined();
            expect(message.indexOf('byteLength of 0 does not equal the tile\'s actual byte length of') === 0).toBe(true);
        }), done).toResolve();
    });

    it('returns error message if the b3dm header is a legacy version (1)', function(done) {
        expect (validateB3dm(createB3dmLegacy1()).then(function(message) {
            expect(message).toBe('Header is using the legacy format [batchLength] [batchTableByteLength]. The new format is [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength].');
        }), done).toResolve();
    });

    it('returns error message if the b3dm header is a legacy version (2)', function(done) {
        expect (validateB3dm(createB3dmLegacy2()).then(function(message) {
            expect(message).toBe('Header is using the legacy format [batchTableJsonByteLength] [batchTableBinaryByteLength] [batchLength]. The new format is [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength].');
        }), done).toResolve();
    });

    it('returns error message if the feature table binary is not aligned to an 8-byte boundary', function(done) {
        var b3dm = createB3dm({
            unalignedFeatureTableBinary : true
        });
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBe('Feature table binary must be aligned to an 8-byte boundary.');
        }), done).toResolve();
    });

    it('returns error message if the batch table binary is not aligned to an 8-byte boundary', function(done) {
        var b3dm = createB3dm({
            unalignedBatchTableBinary : true
        });
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBe('Batch table binary must be aligned to an 8-byte boundary.');
        }), done).toResolve();
    });

    it('returns error message if the glb is not aligned to an 8-byte boundary', function(done) {
        var b3dm = createB3dm({
            unalignedGlb : true
        });
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBe('Glb must be aligned to an 8-byte boundary.');
        }), done).toResolve();
    });

    it('returns error message if the byte lengths in the header exceed the tile\'s byte length', function(done) {
        var b3dm = createB3dm();
        b3dm.writeUInt32LE(b3dm.readUInt32LE(8), 24);
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBe('Feature table, batch table, and glb byte lengths exceed the tile\'s byte length.');
        }), done).toResolve();
    });

    it('returns error message if feature table JSON could not be parsed: ', function(done) {
        var b3dm = createB3dm();
        var charCode = '!'.charCodeAt(0);
        b3dm.writeUInt8(charCode, 28); // Replace '{' with '!'
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBe('Feature table JSON could not be parsed: Unexpected token ! in JSON at position 0');
        }), done).toResolve();
    });

    it('returns error message if batch table JSON could not be parsed: ', function(done) {
        var b3dm = createB3dm({
            featureTableJson : {
                BATCH_LENGTH : 1
            },
            batchTableJson : {
                height : [0.0]
            }
        });
        var featureTableJsonByteLength = b3dm.readUInt32LE(12);
        var featureTableBinaryByteLength = b3dm.readUInt32LE(16);
        var batchTableJsonByteOffset = 28 + featureTableJsonByteLength + featureTableBinaryByteLength;
        var charCode = '!'.charCodeAt(0);
        b3dm.writeUInt8(charCode, batchTableJsonByteOffset); // Replace '{' with '!'
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBe('Batch table JSON could not be parsed: Unexpected token ! in JSON at position 0');
        }), done).toResolve();
    });

    it('returns error message if feature table does not contain a BATCH_LENGTH property: ', function(done) {
        var b3dm = createB3dm({
            featureTableJson : {
                PROPERTY : 0
            }
        });
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBe('Feature table must contain a BATCH_LENGTH property.');
        }), done).toResolve();
    });

    it('returns error message if feature table is invalid', function(done) {
        var b3dm = createB3dm({
            featureTableJson : {
                BATCH_LENGTH : 0,
                INVALID : 0
            }
        });
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBe('Invalid feature table property "INVALID".');
        }), done).toResolve();
    });

    it('returns error message if batch table is invalid', function(done) {
        var b3dm = createB3dm({
            featureTableJson : {
                BATCH_LENGTH : 1
            },
            batchTableJson : {
                height : {
                    byteOffset : 0,
                    type : 'SCALAR',
                    componentType : 'FLOAT'
                }
            }
        });
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBe('Batch table binary property "height" exceeds batch table binary byte length.');
        }), done).toResolve();
    });

    it('succeeds for valid b3dm with BATCH_LENGTH 0 and no batch table', function(done) {
        var b3dm = createB3dm({
            featureTableJson : {
                BATCH_LENGTH : 0
            }
        });
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });

    it('succeeds for valid b3dm with a feature table binary', function(done) {
        var b3dm = createB3dm({
            featureTableJson : {
                BATCH_LENGTH : {
                    byteOffset : 0
                }
            },
            featureTableBinary : Buffer.alloc(4)
        });
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });

   it('succeeds for valid b3dm with a batch table', function(done) {
        var b3dm = createB3dm({
            featureTableJson : {
                BATCH_LENGTH : 1
            },
            batchTableJson : {
                height : {
                    byteOffset : 0,
                    type : 'SCALAR',
                    componentType : 'FLOAT'
                }
            },
            batchTableBinary : Buffer.alloc(4)
        });
        expect (validateB3dm(b3dm).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });
});
