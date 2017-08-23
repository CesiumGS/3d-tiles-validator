'use strict';
var validateI3dm = require('../../lib/validateI3dm');
var specUtility = require('./specUtility.js');

var createI3dm = specUtility.createI3dm;

describe('validate i3dm', function() {
    it('returns error message if the i3dm buffer\'s byte length is less than its header length', function(done) {
        expect (validateI3dm(Buffer.alloc(0)).then(function(message) {
            expect(message).toBe('Header must be 32 bytes.');
        }), done).toResolve();
    });

    it('returns error message if the i3dm has invalid magic', function(done) {
        var i3dm = createI3dm();
        i3dm.write('xxxx', 0);
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Invalid magic: xxxx');
        }), done).toResolve();
    });

    it('returns error message if the i3dm has an invalid version', function(done) {
        var i3dm = createI3dm();
        i3dm.writeUInt32LE(10, 4);
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Invalid version: 10. Version must be 1.');
        }), done).toResolve();
    });

    it('returns error message if the i3dm has wrong byteLength', function(done) {
        var i3dm = createI3dm();
        i3dm.writeUInt32LE(0, 8);
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBeDefined();
            expect(message.indexOf('byteLength of 0 does not equal the tile\'s actual byte length of') === 0).toBe(true);
        }), done).toResolve();
    });

    it('returns error message if the feature table binary is not aligned to an 8-byte boundary', function(done) {
        var i3dm = createI3dm({
            unalignedFeatureTableBinary : true
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Feature table binary must be aligned to an 8-byte boundary.');
        }), done).toResolve();
    });

    it('returns error message if the batch table binary is not aligned to an 8-byte boundary', function(done) {
        var i3dm = createI3dm({
            unalignedBatchTableBinary : true
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Batch table binary must be aligned to an 8-byte boundary.');
        }), done).toResolve();
    });

    it('returns error message if the glb is not aligned to an 8-byte boundary', function(done) {
        var i3dm = createI3dm({
            unalignedGlb : true
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Glb must be aligned to an 8-byte boundary.');
        }), done).toResolve();
    });

    it('returns error message if the byte lengths in the header exceed the tile\'s byte length', function(done) {
        var i3dm = createI3dm();
        i3dm.writeUInt32LE(i3dm.readUInt32LE(8), 24);
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Feature table, batch table, and glb byte lengths exceed the tile\'s byte length.');
        }), done).toResolve();
    });

    it('returns error message if feature table JSON could not be parsed: ', function(done) {
        var i3dm = createI3dm();
        var charCode = '!'.charCodeAt(0);
        i3dm.writeUInt8(charCode, 32); // Replace '{' with '!'
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Feature table JSON could not be parsed: Unexpected token ! in JSON at position 0');
        }), done).toResolve();
    });

    it('returns error message if batch table JSON could not be parsed: ', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                INSTANCES_LENGTH : 1,
                POSITION : [0, 0, 0]
            },
            batchTableJson : {
                height : [0.0]
            }
        });
        var featureTableJsonByteLength = i3dm.readUInt32LE(12);
        var featureTableBinaryByteLength = i3dm.readUInt32LE(16);
        var batchTableJsonByteOffset = 32 + featureTableJsonByteLength + featureTableBinaryByteLength;
        var charCode = '!'.charCodeAt(0);
        i3dm.writeUInt8(charCode, batchTableJsonByteOffset); // Replace '{' with '!'
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Batch table JSON could not be parsed: Unexpected token ! in JSON at position 0');
        }), done).toResolve();
    });

    it('returns error message if feature table does not contain an INSTANCES_LENGTH property: ', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                POSITION : [0, 0, 0]
            }
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Feature table must contain an INSTANCES_LENGTH property.');
        }), done).toResolve();
    });

    it('returns error message if feature table does not contain either POSITION or POSITION_QUANTIZED properties: ', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                INSTANCES_LENGTH : 1
            }
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Feature table must contain either the POSITION or POSITION_QUANTIZED property.');
        }), done).toResolve();
    });

    it('returns error message if feature table has a NORMAL_UP property but not a NORMAL_RIGHT property: ', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                INSTANCES_LENGTH : 1,
                POSITION : [0, 0, 0],
                NORMAL_UP : [1, 0, 0]
            }
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Feature table property NORMAL_RIGHT is required when NORMAL_UP is present.');
        }), done).toResolve();
    });

    it('returns error message if feature table has a NORMAL_RIGHT property but not a NORMAL_UP property: ', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                INSTANCES_LENGTH : 1,
                POSITION : [0, 0, 0],
                NORMAL_RIGHT : [1, 0, 0]
            }
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Feature table property NORMAL_UP is required when NORMAL_RIGHT is present.');
        }), done).toResolve();
    });

    it('returns error message if feature table has a NORMAL_UP_OCT32P property but not a NORMAL_RIGHT_OCT32P property: ', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                INSTANCES_LENGTH : 1,
                POSITION : [0, 0, 0],
                NORMAL_UP_OCT32P : [1, 0, 0]
            }
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Feature table property NORMAL_RIGHT_OCT32P is required when NORMAL_UP_OCT32P is present.');
        }), done).toResolve();
    });

    it('returns error message if feature table has a NORMAL_RIGHT_OCT32P property but not a NORMAL_UP_OCT32P property: ', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                INSTANCES_LENGTH : 1,
                POSITION : [0, 0, 0],
                NORMAL_RIGHT_OCT32P : [1, 0, 0]
            }
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Feature table property NORMAL_UP_OCT32P is required when NORMAL_RIGHT_OCT32P is present.');
        }), done).toResolve();
    });

    it('returns error message if feature table has a POSITION_QUANTIZED property but not QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE: ', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                INSTANCES_LENGTH : 1,
                POSITION_QUANTIZED : [0, 0, 0]
            }
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Feature table properties QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE are required when POSITION_QUANTIZED is present.');
        }), done).toResolve();
    });

    it('returns error message if feature table is invalid', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                INSTANCES_LENGTH : 1,
                POSITION : [0, 0, 0],
                INVALID : 0
            }
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Invalid feature table property "INVALID".');
        }), done).toResolve();
    });

    it('returns error message if batch table is invalid', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                INSTANCES_LENGTH : 1,
                POSITION : [0, 0, 0]
            },
            batchTableJson : {
                height : {
                    byteOffset : 0,
                    type : 'SCALAR',
                    componentType : 'FLOAT'
                }
            }
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBe('Batch table binary property "height" exceeds batch table binary byte length.');
        }), done).toResolve();
    });

    it('succeeds for valid i3dm', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                INSTANCES_LENGTH : 1,
                POSITION : [0, 0, 0]
            }
        });
        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });

    it('succeeds for valid i3dm with a feature table binary', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                INSTANCES_LENGTH : {
                    byteOffset : 0
                },
                POSITION : {
                    byteOffset : 4
                }
            },
            featureTableBinary : Buffer.alloc(16)
        });

        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });

    it('succeeds for valid i3dm with a batch table', function(done) {
        var i3dm = createI3dm({
            featureTableJson : {
                INSTANCES_LENGTH : 1,
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

        expect (validateI3dm(i3dm).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });
});
