'use strict';
var validatePnts = require('../../lib/validatePnts');
var specUtility = require('./specUtility.js');

var createPnts = specUtility.createPnts;

describe('validate pnts', function() {
    it ('returns error message if the pnts buffer\'s byte length is less than its header length', function() {
        expect(validatePnts(Buffer.alloc(0))).toBe('Header must be 28 bytes.');
    });

    it('returns error message if the pnts has invalid magic', function() {
        var pnts = createPnts();
        pnts.write('xxxx', 0);
        expect(validatePnts(pnts)).toBe('Invalid magic: xxxx');
    });

    it('returns error message if the pnts has an invalid version', function() {
        var pnts = createPnts();
        pnts.writeUInt32LE(10, 4);
        expect(validatePnts(pnts)).toBe('Invalid version: 10. Version must be 1.');
    });

    it('returns error message if the pnts has wrong byteLength', function() {
        var pnts = createPnts();
        pnts.writeUInt32LE(0, 8);
        var message = validatePnts(pnts);
        expect(message).toBeDefined();
        expect(message.indexOf('byteLength of 0 does not equal the tile\'s actual byte length of') === 0).toBe(true);
    });

    it('returns error message if the feature table binary is not aligned to an 8-byte boundary', function() {
        var pnts = createPnts({
            unalignedFeatureTableBinary : true
        });
        expect(validatePnts(pnts)).toBe('Feature table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the batch table binary is not aligned to an 8-byte boundary', function() {
        var pnts = createPnts({
            unalignedBatchTableBinary : true
        });
        expect(validatePnts(pnts)).toBe('Batch table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the byte lengths in the header exceed the tile\'s byte length', function() {
        var pnts = createPnts();
        pnts.writeUInt32LE(124, 12);
        expect(validatePnts(pnts)).toBe('Feature table and batch table exceed the tile\'s byte length.');
    });

    it('returns error message if feature table JSON could not be parsed: ', function() {
        var pnts = createPnts();
        var charCode = '!'.charCodeAt(0);
        pnts.writeUInt8(charCode, 28); // Replace '{' with '!'
        expect(validatePnts(pnts)).toBe('Feature table JSON could not be parsed: Unexpected token ! in JSON at position 0');
    });

    it('returns error message if batch table JSON could not be parsed: ', function() {
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
        expect(validatePnts(pnts)).toBe('Batch table JSON could not be parsed: Unexpected token ! in JSON at position 0');
    });

    it('returns error message if feature table does not contain a POINTS_LENGTH property: ', function() {
        var pnts = createPnts({
            featureTableJson : {
                POSITION : [0, 0, 0]
            }
        });
        expect(validatePnts(pnts)).toBe('Feature table must contain a POINTS_LENGTH property.');
    });

    it('returns error message if feature table does not contain either POSITION or POSITION_QUANTIZED properties: ', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1
            }
        });
        expect(validatePnts(pnts)).toBe('Feature table must contain either the POSITION or POSITION_QUANTIZED property.');
    });

    it('returns error message if feature table has a POSITION_QUANTIZED property but not QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE: ', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION_QUANTIZED : [0, 0, 0]
            }
        });
        expect(validatePnts(pnts)).toBe('Feature table properties QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE are required when POSITION_QUANTIZED is present.');
    });

    it('returns error message if feature table has a BATCH_ID property but not a BATCH_LENGTH: ', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : [0, 0, 0],
                BATCH_ID : [0]
            }
        });
        expect(validatePnts(pnts)).toBe('Feature table property BATCH_LENGTH is required when BATCH_ID is present.');
    });

    it('returns error message if feature table has a BATCH_LENGTH property but not a BATCH_ID: ', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : [0, 0, 0],
                BATCH_LENGTH : 1
            }
        });
        expect(validatePnts(pnts)).toBe('Feature table property BATCH_ID is required when BATCH_LENGTH is present.');
    });

    it('returns error message if BATCH_LENGTH is greater than POINTS_LENGTH: ', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : [0, 0, 0],
                BATCH_ID : [0, 1],
                BATCH_LENGTH : 2
            }
        });
        expect(validatePnts(pnts)).toBe('Feature table property BATCH_LENGTH must be less than or equal to POINTS_LENGTH.');
    });

    it('returns error message if any BATCH_ID is greater than BATCH_LENGTH [Test using feature table JSON]: ', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 3,
                POSITION : [1, 0, 0, 0, 1, 0, 0, 0, 1],
                BATCH_ID : [0, 1, 2],
                BATCH_LENGTH : 2
            }
        });
        expect(validatePnts(pnts)).toBe('All the BATCH_IDs must have values less than feature table property BATCH_LENGTH.');
    });

    it('returns error message if any BATCH_ID is greater than BATCH_LENGTH [Test using feature table binary]: ', function() {
        var positionArray = new Float32Array([
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0
        ]);
        var positionBinary = Buffer.from(positionArray.buffer);

        var batchIdArray = new Uint8Array([
            0,
            1,
            2
        ]);
        var batchIdBinary = Buffer.from(batchIdArray.buffer);

        var combinedBinary = Buffer.concat([positionBinary, batchIdBinary]);

        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 3,
                BATCH_LENGTH : 2,
                POSITION : {
                    byteOffset : 0
                },
                BATCH_ID : {
                    byteOffset : 36,
                    componentType : 'UNSIGNED_BYTE'
                }
            },
            featureTableBinary : combinedBinary
        });
        expect(validatePnts(pnts)).toBe('All the BATCH_IDs must have values less than feature table property BATCH_LENGTH.');
    });

    it('returns error message if feature table is invalid', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : [0, 0, 0],
                INVALID : 0
            }
        });
        expect(validatePnts(pnts)).toBe('Invalid feature table property "INVALID".');
    });

    it('returns error message if batch table is invalid', function() {
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
        expect(validatePnts(pnts)).toBe('Batch table binary property "height" exceeds batch table binary byte length.');
    });

    it('returns error message for normals with non-unit length when NORMAL is defined [Test using feature table JSON]', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : [
                    0, 0, 0,
                    1, 0, 0,
                    0, 0, 1,
                    0, 1, 0],
                NORMAL : [
                    0, 1, 0,
                    0, 0, 1,
                    1, 0, 0,
                    0, 2, 0]
            }
        });
        expect(validatePnts(pnts)).toBe('normal defined in NORMAL must be of length 1.0');
    });

    it('returns error message for normals with non-unit length when NORMAL is defined [Test using feature table Binary]', function() {
        var positionArray = new Float32Array([
            0, 0, 0,
            1, 0, 0,
            0, 0, 1,
            0, 1, 0
        ]);
        var positionBinary = Buffer.from(positionArray.buffer);

        var normalArray = new Float32Array([
            0, 1, 0,
            0, 0, 1,
            1, 0, 0,
            0, 2, 0
        ]);
        var normalBinary = Buffer.from(normalArray.buffer);

        var combinedBinary = Buffer.concat([positionBinary, normalBinary]);

        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : {
                    byteOffset : 0
                },
                NORMAL : {
                    byteOffset : 48,
                    componentType : 'FLOAT'
                }
            },
            featureTableBinary : combinedBinary
        });
        expect(validatePnts(pnts)).toBe('normal defined in NORMAL must be of length 1.0');
    });

    it('succeeds for normals with unit length when NORMAL is defined', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : [
                    0, 0, 0,
                    1, 0, 0,
                    0, 0, 1,
                    0, 1, 0],
                NORMAL : [
                    0, 1, 0,
                    0, 0, 1,
                    1, 0, 0,
                    0, 1, 0]
            }
        });
        expect(validatePnts(pnts)).toBeUndefined();
    });

    it('returns error message for normals with non-unit length when NORMAL_OCT16P is defined [Test using feature table JSON]', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : [
                    0, 0, 0,
                    1, 0, 0,
                    0, 0, 1,
                    1, 0, 1],
                NORMAL_OCT16P : [
                    191, 191,
                    191, 191,
                    191, 191,
                    191, 191]
            }
        });
        expect(validatePnts(pnts)).toBe('normal defined in NORMAL_OCT16P must be of length 1.0');
    });

    it('returns error message for normals with non-unit length when NORMAL_OCT16P is defined [Test using feature table Binary]', function() {
        var positionArray = new Float32Array([
            0, 0, 0,
            1, 0, 0,
            0, 0, 1,
            1, 0, 1
        ]);
        var positionBinary = Buffer.from(positionArray.buffer);

        var normalOct16PArray = new Uint8Array([
            191, 191,
            191, 191,
            191, 191,
            191, 191
        ]);
        var normalOct16PBinary = Buffer.from(normalOct16PArray.buffer);

        var combinedBinary = Buffer.concat([positionBinary, normalOct16PBinary]);

        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : {
                    byteOffset : 0
                },
                NORMAL_OCT16P : {
                    byteOffset : 48,
                    componentType : 'UNSIGNED_BYTE'
                }
            },
            featureTableBinary : combinedBinary
        });
        expect(validatePnts(pnts)).toBe('normal defined in NORMAL_OCT16P must be of length 1.0');
    });

    it('succeeds for normals with unit length when NORMAL_OCT16P is defined', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : [
                    0, 0, 0,
                    1, 0, 0,
                    0, 0, 1,
                    1, 0, 1],
                NORMAL_OCT16P : [
                    128, 255,
                    255, 128,
                    128, 128,
                    128, 255]
            }
        });
        expect(validatePnts(pnts)).toBeUndefined();
    });

    it('succeeds for valid pnts', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 1,
                POSITION : [0, 0, 0]
            }
        });
        expect(validatePnts(pnts)).toBeUndefined();
    });

    it('succeeds for valid pnts with a feature table binary', function() {
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
        expect(validatePnts(pnts)).toBeUndefined();
    });

    it('succeeds for valid pnts with a batch table', function() {
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
        expect(validatePnts(pnts)).toBeUndefined();
    });
});
