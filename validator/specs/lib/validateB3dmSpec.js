'use strict';
var Cesium = require('cesium');
var getBufferPadded = require('../../lib/getBufferPadded');
var getJsonBufferPadded = require('../../lib/getJsonBufferPadded');
var validateB3dm = require('../../lib/validateB3dm');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

describe('validate b3dm', function() {
    it ('returns error message if the b3dm buffer\'s byte length is less than its header length', function() {
        expect(validateB3dm(Buffer.alloc(0))).toBe('Header must be 28 bytes.');
    });

    it('returns error message if the b3dm has invalid magic', function() {
        var b3dm = createB3dm();
        b3dm.write('xxxx', 0);
        expect(validateB3dm(b3dm)).toBe('Invalid magic: xxxx');
    });

    it('returns error message if the b3dm has an invalid version', function() {
        var b3dm = createB3dm();
        b3dm.writeUInt32LE(10, 4);
        expect(validateB3dm(b3dm)).toBe('Invalid version: 10. Version must be 1.');
    });

    it('returns error message if the b3dm has wrong byteLength', function() {
        var b3dm = createB3dm();
        b3dm.writeUInt32LE(0, 8);
        expect(validateB3dm(b3dm)).toBe('byteLength of 0 does not equal the tile\'s actual byte length of 52.');
    });

    it('returns error message if the b3dm header is a legacy version (1)', function() {
        expect(validateB3dm(createLegacyHeader1())).toBe('Header is using the legacy format [batchLength] [batchTableByteLength]. The new format is [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength].');
    });

    it('returns error message if the b3dm header is a legacy version (2)', function() {
        expect(validateB3dm(createLegacyHeader2())).toBe('Header is using the legacy format [batchTableJsonByteLength] [batchTableBinaryByteLength] [batchLength]. The new format is [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength].');
    });

    it('returns error message if the feature table binary is not aligned to an 8-byte boundary', function() {
        var b3dm = createB3dm({
            unalignedFeatureTableBinary : true
        });
        expect(validateB3dm(b3dm)).toBe('Feature table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the batch table binary is not aligned to an 8-byte boundary', function() {
        var b3dm = createB3dm({
            unalignedBatchTableBinary : true
        });
        expect(validateB3dm(b3dm)).toBe('Batch table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the glb is not aligned to an 8-byte boundary', function() {
        var b3dm = createB3dm({
            unalignedGlb : true
        });
        expect(validateB3dm(b3dm)).toBe('Glb must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the byte lengths in the header exceed the tile\'s byte length', function() {
        var b3dm = createB3dm();
        b3dm.writeUInt32LE(60, 12);
        expect(validateB3dm(b3dm)).toBe('Feature table, batch table, and glb byte lengths exceed the tile\'s byte length.');
    });

    it('returns error message if feature table JSON could not be parsed: ', function() {
        var b3dm = createB3dm();
        var charCode = '!'.charCodeAt(0);
        b3dm.writeUInt8(charCode, 28); // Replace '{' with '!'
        expect(validateB3dm(b3dm)).toBe('Feature table JSON could not be parsed: Unexpected token ! in JSON at position 0');
    });

    it('returns error message if batch table JSON could not be parsed: ', function() {
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
        expect(validateB3dm(b3dm)).toBe('Batch table JSON could not be parsed: Unexpected token ! in JSON at position 0');
    });

    it('returns error message if feature table does not contain a BATCH_LENGTH property: ', function() {
        var b3dm = createB3dm({
            featureTableJson : {
                PROPERTY : 0
            }
        });
        expect(validateB3dm(b3dm)).toBe('Feature table must contain a BATCH_LENGTH property.');
    });

    it('returns error message if feature table is invalid: ', function() {
        var b3dm = createB3dm({
            featureTableJson : {
                BATCH_LENGTH : 0,
                INVALID : 0
            }
        });
        expect(validateB3dm(b3dm)).toBe('Invalid feature table property "INVALID".');
    });

    it('returns error message if batch table is invalid: ', function() {
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

        expect(validateB3dm(b3dm)).toBe('Batch table binary property "height" exceeds batch table binary byte length.');
    });

    it('succeeds for valid b3dm with BATCH_LENGTH 0 and no batch table', function() {
        var b3dm = createB3dm({
            featureTableJson : {
                BATCH_LENGTH : 0
            }
        });
        expect(validateB3dm(b3dm)).toBeUndefined();
    });

    it('succeeds for valid b3dm with a feature table binary', function() {
        var b3dm = createB3dm({
            featureTableJson : {
                BATCH_LENGTH : {
                    byteOffset : 0
                }
            },
            featureTableBinary : Buffer.alloc(4)
        });
        expect(validateB3dm(b3dm)).toBeUndefined();
    });

    it('succeeds for valid b3dm with a batch table', function() {
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
        expect(validateB3dm(b3dm)).toBeUndefined();
    });
});

function createB3dm(options) {
    var headerByteLength = 28;
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var batchLength = defaultValue(options.batchLength, 0);
    var featureTableJson = defaultValue(options.featureTableJson, {
        BATCH_LENGTH : batchLength
    });

    var featureTableJsonBuffer = getJsonBufferPadded(featureTableJson, headerByteLength);
    var featureTableBinary = defined(options.featureTableBinary) ? getBufferPadded(options.featureTableBinary) : Buffer.alloc(0);
    var batchTableJsonBuffer = defined(options.batchTableJson) ? getJsonBufferPadded(options.batchTableJson) : Buffer.alloc(0);
    var batchTableBinary = defined(options.batchTableBinary) ? getBufferPadded(options.batchTableBinary) : Buffer.alloc(0);
    var glb = defaultValue(options.glb, Buffer.from('glTF'));

    if (options.unalignedFeatureTableBinary) {
        featureTableJsonBuffer = Buffer.concat([featureTableJsonBuffer, Buffer.from(' ')]);
    }
    if (options.unalignedBatchTableBinary) {
        batchTableJsonBuffer = Buffer.concat([batchTableJsonBuffer, Buffer.from(' ')]);
    }
    if (options.unalignedGlb) {
        batchTableBinary = Buffer.concat([batchTableJsonBuffer, Buffer.alloc(1)]);
    }

    var featureTableJsonByteLength = featureTableJsonBuffer.length;
    var featureTableBinaryByteLength = featureTableBinary.length;
    var batchTableJsonByteLength = batchTableJsonBuffer.length;
    var batchTableBinaryByteLength = batchTableBinary.length;
    var glbByteLength = glb.length;

    var byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + glbByteLength;

    var header = Buffer.alloc(headerByteLength);
    header.write('b3dm', 0);                                // magic
    header.writeUInt32LE(1, 4);                             // version
    header.writeUInt32LE(byteLength, 8);                    // byteLength
    header.writeUInt32LE(featureTableJsonByteLength, 12);   // featureTableJSONByteLength
    header.writeUInt32LE(featureTableBinaryByteLength, 16); // featureTableBinaryByteLength
    header.writeUInt32LE(batchTableJsonByteLength, 20);     // batchTableJSONByteLength
    header.writeUInt32LE(batchTableBinaryByteLength, 24);   // batchTableBinaryByteLength

    return Buffer.concat([header, featureTableJsonBuffer, featureTableBinary, batchTableJsonBuffer, batchTableBinary, glb]);
}

function createLegacyHeader1() {
    var b3dm = Buffer.alloc(28);
    b3dm.write('b3dm', 0);     // magic
    b3dm.writeUInt32LE(1, 4);  // version
    b3dm.writeUInt32LE(28, 8); // byteLength
    b3dm.writeUInt32LE(0, 12); // batchLength
    b3dm.writeUInt32LE(0, 16); // batchTableByteLength
    b3dm.write('glTF', 20);    // Start of glb
    return b3dm;
}

function createLegacyHeader2() {
    var b3dm = Buffer.alloc(28);
    b3dm.write('b3dm', 0);     // magic
    b3dm.writeUInt32LE(1, 4);  // version
    b3dm.writeUInt32LE(28, 8); // byteLength
    b3dm.writeUInt32LE(0, 12); // batchTableJsonByteLength
    b3dm.writeUInt32LE(0, 16); // batchTableBinaryByteLength
    b3dm.writeUInt32LE(0, 20); // batchLength
    b3dm.write('glTF', 24);    // Start of glb
    return b3dm;
}
