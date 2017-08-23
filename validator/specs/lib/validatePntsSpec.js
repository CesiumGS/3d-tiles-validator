'use strict';
var validatePnts = require('../../lib/validatePnts');
var specUtility = require('./specUtility.js');

var createPnts = specUtility.createPnts;

describe('validate pnts', function() {
    it('returns error message if the pnts buffer\'s byte length is less than its header length', function(done) {
        expect (validatePnts(Buffer.alloc(0)).then(function(message) {
            expect(message).toBe('Header must be 28 bytes.');
        }), done).toResolve();
    });

    it('returns error message if the pnts has invalid magic', function(done) {
        var pnts = createPnts();
        pnts.write('xxxx', 0);
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Invalid magic: xxxx');
        }), done).toResolve();
    });

    it('returns error message if the pnts has an invalid version', function(done) {
        var pnts = createPnts();
        pnts.writeUInt32LE(10, 4);
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Invalid version: 10. Version must be 1.');
        }), done).toResolve();
    });

    it('returns error message if the pnts has wrong byteLength', function(done) {
        var pnts = createPnts();
        pnts.writeUInt32LE(0, 8);
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBeDefined();
            expect(message.indexOf('byteLength of 0 does not equal the tile\'s actual byte length of') === 0).toBe(true);
        }), done).toResolve();
    });

    it('returns error message if the feature table binary is not aligned to an 8-byte boundary', function(done) {
        var pnts = createPnts({
            unalignedFeatureTableBinary : true
        });
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Feature table binary must be aligned to an 8-byte boundary.');
        }), done).toResolve();
    });

    it('returns error message if the batch table binary is not aligned to an 8-byte boundary', function(done) {
        var pnts = createPnts({
            unalignedBatchTableBinary : true
        });
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Batch table binary must be aligned to an 8-byte boundary.');
        }), done).toResolve();
    });

    it('returns error message if the byte lengths in the header exceed the tile\'s byte length', function(done) {
        var pnts = createPnts();
        pnts.writeUInt32LE(124, 12);
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Feature table and batch table exceed the tile\'s byte length.');
        }), done).toResolve();
    });

    it('returns error message if feature table JSON could not be parsed: ', function(done) {
        var pnts = createPnts();
        var charCode = '!'.charCodeAt(0);
        pnts.writeUInt8(charCode, 28); // Replace '{' with '!'
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Feature table JSON could not be parsed: Unexpected token ! in JSON at position 0');
        }), done).toResolve();
    });

    it('returns error message if batch table JSON could not be parsed: ', function(done) {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : [0, 0, 0]
            },
            batchTableJson : {
                height : [0.0]
            }
        });
        var featureTableJsonByteLength = pnts.readUInt32LE(12);
        var featureTableBinaryByteLength = pnts.readUInt32LE(16);
        var batchTableJsonByteOffset = 28 + featureTableJsonByteLength + featureTableBinaryByteLength;
        var charCode = '!'.charCodeAt(0);
        pnts.writeUInt8(charCode, batchTableJsonByteOffset); // Replace '{' with '!'
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Batch table JSON could not be parsed: Unexpected token ! in JSON at position 0');
        }), done).toResolve();
    });

    it('returns error message if feature table does not contain a POINTS_LENGTH property: ', function(done) {
        var pnts = createPnts({
            featureTableJson : {
                POSITION : [0, 0, 0]
            }
        });
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Feature table must contain a POINTS_LENGTH property.');
        }), done).toResolve();
    });

    it('returns error message if feature table does not contain either POSITION or POSITION_QUANTIZED properties: ', function(done) {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1
            }
        });
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Feature table must contain either the POSITION or POSITION_QUANTIZED property.');
        }), done).toResolve();
    });

    it('returns error message if feature table has a POSITION_QUANTIZED property but not QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE: ', function(done) {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION_QUANTIZED : [0, 0, 0]
            }
        });
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Feature table properties QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE are required when POSITION_QUANTIZED is present.');
        }), done).toResolve();
    });

    it('returns error message if feature table has a BATCH_ID property but not a BATCH_LENGTH: ', function(done) {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : [0, 0, 0],
                BATCH_ID : [0]
            }
        });
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Feature table property BATCH_LENGTH is required when BATCH_ID is present.');
        }), done).toResolve();
    });

    it('returns error message if feature table has a BATCH_LENGTH property but not a BATCH_ID: ', function(done) {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : [0, 0, 0],
                BATCH_LENGTH : 1
            }
        });
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Feature table property BATCH_ID is required when BATCH_LENGTH is present.');
        }), done).toResolve();
    });

    it('returns error message if BATCH_LENGTH is greater than POINTS_LENGTH: ', function(done) {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : [0, 0, 0],
                BATCH_ID : [0, 1],
                BATCH_LENGTH : 2
            }
        });
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Feature table property BATCH_LENGTH must be less than or equal to POINTS_LENGTH.');
        }), done).toResolve();
    });

    it('returns error message if feature table is invalid', function(done) {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : [0, 0, 0],
                INVALID : 0
            }
        });
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Invalid feature table property "INVALID".');
        }), done).toResolve();
    });

    it('returns error message if batch table is invalid', function(done) {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : [0, 0, 0],
                BATCH_ID : [0],
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
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBe('Batch table binary property "height" exceeds batch table binary byte length.');
        }), done).toResolve();
    });

    it('succeeds for valid pnts', function(done) {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : [0, 0, 0]
            }
        });
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });

    it('succeeds for valid pnts with a feature table binary', function(done) {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : {
                    byteOffset : 0
                },
                POSITION : {
                    byteOffset : 4
                }
            },
            featureTableBinary : Buffer.alloc(16)
        });
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });

    it('succeeds for valid pnts with a batch table', function(done) {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : {
                    byteOffset : 0
                }
            },
            featureTableBinary : Buffer.alloc(12),
            batchTableJson : {
                height : {
                    byteOffset : 0,
                    type : 'SCALAR',
                    componentType : 'FLOAT'
                }
            },
            batchTableBinary : Buffer.alloc(4)
        });
        expect (validatePnts(pnts).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });
});
