'use strict';
var Cesium = require('cesium');
var validateCmpt = require('../../lib/validateCmpt');
var specUtility = require('./specUtility.js');

var createB3dm = specUtility.createB3dm;
var createCmpt = specUtility.createCmpt;

xdescribe('validate cmpt', function() {
    it ('returns error message if the cmpt buffer\'s byte length is less than its header length', function() {
        expect(validateCmpt(Buffer.alloc(0))).toBe('Header must be 16 bytes.');
    });

    it('returns error message if the cmpt has invalid magic', function() {
        var cmpt = createCmpt();
        cmpt.write('xxxx', 0);
        expect(validateCmpt(cmpt)).toBe('Invalid magic: xxxx');
    });

    it('returns error message if the cmpt has an invalid version', function() {
        var cmpt = createCmpt();
        cmpt.writeUInt32LE(10, 4);
        expect(validateCmpt(cmpt)).toBe('Invalid version: 10. Version must be 1.');
    });

    it('returns error message if the cmpt has wrong byteLength', function() {
        var cmpt = createCmpt();
        cmpt.writeUInt32LE(0, 8);
        expect(validateCmpt(cmpt)).toBe('byteLength of 0 does not equal the tile\'s actual byte length of 52.');
    });

    it('returns error message if the cmpt header is a legacy version (1)', function() {
        expect(validateCmpt(createLegacyHeader1())).toBe('Header is using the legacy format [batchLength] [batchTableByteLength]. The new format is [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength].');
    });

    it('returns error message if the cmpt header is a legacy version (2)', function() {
        expect(validateCmpt(createLegacyHeader2())).toBe('Header is using the legacy format [batchTableJsonByteLength] [batchTableBinaryByteLength] [batchLength]. The new format is [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength].');
    });

    it('returns error message if the feature table binary is not aligned to an 8-byte boundary', function() {
        var cmpt = createCmpt({
            unalignedFeatureTableBinary : true
        });
        expect(validateCmpt(cmpt)).toBe('Feature table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the batch table binary is not aligned to an 8-byte boundary', function() {
        var cmpt = createCmpt({
            unalignedBatchTableBinary : true
        });
        expect(validateCmpt(cmpt)).toBe('Batch table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the glb is not aligned to an 8-byte boundary', function() {
        var cmpt = createCmpt({
            unalignedGlb : true
        });
        expect(validateCmpt(cmpt)).toBe('Glb must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the byte lengths in the header exceed the tile\'s byte length', function() {
        var cmpt = createCmpt();
        cmpt.writeUInt32LE(60, 12);
        expect(validateCmpt(cmpt)).toBe('Feature table, batch table, and glb byte lengths exceed the tile\'s byte length.');
    });

    it('returns error message if feature table JSON could not be parsed: ', function() {
        var cmpt = createCmpt();
        var charCode = '!'.charCodeAt(0);
        cmpt.writeUInt8(charCode, 28); // Replace '{' with '!'
        expect(validateCmpt(cmpt)).toBe('Feature table JSON could not be parsed: Unexpected token ! in JSON at position 0');
    });

    it('returns error message if batch table JSON could not be parsed: ', function() {
        var cmpt = createCmpt({
            featureTableJson : {
                BATCH_LENGTH : 1
            },
            batchTableJson : {
                height : [0.0]
            }
        });
        var featureTableJsonByteLength = cmpt.readUInt32LE(12);
        var featureTableBinaryByteLength = cmpt.readUInt32LE(16);
        var batchTableJsonByteOffset = 28 + featureTableJsonByteLength + featureTableBinaryByteLength;
        var charCode = '!'.charCodeAt(0);
        cmpt.writeUInt8(charCode, batchTableJsonByteOffset); // Replace '{' with '!'
        expect(validateCmpt(cmpt)).toBe('Batch table JSON could not be parsed: Unexpected token ! in JSON at position 0');
    });

    it('returns error message if feature table does not contain a BATCH_LENGTH property: ', function() {
        var cmpt = createCmpt({
            featureTableJson : {
                PROPERTY : 0
            }
        });
        expect(validateCmpt(cmpt)).toBe('Feature table must contain a BATCH_LENGTH property.');
    });

    it('returns error message if feature table is invalid: ', function() {
        var cmpt = createCmpt({
            featureTableJson : {
                BATCH_LENGTH : 0,
                INVALID : 0
            }
        });
        expect(validateCmpt(cmpt)).toBe('Invalid feature table property "INVALID".');
    });

    it('returns error message if batch table is invalid: ', function() {
        var cmpt = createCmpt({
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

        expect(validateCmpt(cmpt)).toBe('Batch table binary property "height" exceeds batch table binary byte length.');
    });

    it('succeeds for valid cmpt with BATCH_LENGTH 0 and no batch table', function() {
        var cmpt = createCmpt({
            featureTableJson : {
                BATCH_LENGTH : 0
            }
        });
        expect(validateCmpt(cmpt)).toBeUndefined();
    });

    it('succeeds for valid cmpt with a feature table binary', function() {
        var cmpt = createCmpt({
            featureTableJson : {
                BATCH_LENGTH : {
                    byteOffset : 0
                }
            },
            featureTableBinary : Buffer.alloc(4)
        });
        expect(validateCmpt(cmpt)).toBeUndefined();
    });

    it('succeeds for valid cmpt with a batch table', function() {
        var cmpt = createCmpt({
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
        expect(validateCmpt(cmpt)).toBeUndefined();
    });
});
