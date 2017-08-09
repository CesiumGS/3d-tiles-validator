'use strict';
var validatePnts = require('../../lib/validatePnts');
var specUtility = require('./specUtility.js');
//var Cesium = require('cesium');

//var Color = Cesium.Color;
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

    it('returns error message when RGBA is out of range [Test using feature table JSON]', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : [
                    0, 0, 0,
                    1, 0, 0,
                    0, 0, 1,
                    0, 1, 0],
                RGBA : [
                    255, 0, 0, 0,
                    0, 255, 0, 0,
                    0, 255, 255, 0,
                    256, 0, 0, 0]
            }
        });
        expect(validatePnts(pnts)).toBe('values of RGBA must be in the range 0-255 inclusive');
    });

    it('returns error message when RGBA is out of range [Test using feature table Binary]', function() {
        var positionArray = new Float32Array([
            0, 0, 0,
            1, 0, 0,
            0, 0, 1,
            0, 1, 0
        ]);
        var positionBinary = Buffer.from(positionArray.buffer);

        var rgbaArray = new Uint8Array([
            255, 0, 0, 0,
            0, 255, 0, 0,
            0, 255, 255, 0,
            255, 0, 0, 0
        ]);
        var rgbaBinary = Buffer.from(rgbaArray.buffer);

        var combinedBinary = Buffer.concat([positionBinary, rgbaBinary]);

        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : {
                    byteOffset : 0
                },
                RGBA : {
                    byteOffset : 48
                }
            },
            featureTableBinary : combinedBinary
        });
        expect(validatePnts(pnts)).toBe('values of RGBA must be in the range 0-255 inclusive');
    });

    it('returns error message when RGB is out of range [Test using feature table JSON]', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : [
                    0, 0, 0,
                    1, 0, 0,
                    0, 0, 1,
                    0, 1, 0],
                RGB : [
                    255, 0, 0,
                    0, 255, 0,
                    0, 255, 255,
                    256, 0, 0]
            }
        });
        expect(validatePnts(pnts)).toBe('values of RGB must be in the range 0-255 inclusive');
    });

    it('returns error message when RGB is out of range [Test using feature table Binary]', function() {
        var positionArray = new Float32Array([
            0, 0, 0,
            1, 0, 0,
            0, 0, 1,
            0, 1, 0
        ]);
        var positionBinary = Buffer.from(positionArray.buffer);

        var rgbArray = new Uint8Array([
            255, 0, 0,
            0, 255, 0,
            0, 255, 255,
            255, 0, 0
        ]);
        var rgbBinary = Buffer.from(rgbArray.buffer);

        var combinedBinary = Buffer.concat([positionBinary, rgbBinary]);

        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : {
                    byteOffset : 0
                },
                RGB : {
                    byteOffset : 48
                }
            },
            featureTableBinary : combinedBinary
        });
        expect(validatePnts(pnts)).toBe('values of RGB must be in the range 0-255 inclusive');
    });

    it('returns error message when CONSTANT_RGBA is out of range', function() {
        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : [
                    0, 0, 0,
                    1, 0, 0,
                    0, 0, 1,
                    0, 1, 0],
                CONSTANT_RGBA : [256, 0, 0, 1]
            }
        });
        expect(validatePnts(pnts)).toBe('values of CONSTANT_RGBA must be in the range 0-255 inclusive');
    });

    it('returns error message when RGB565 is out of range [Test using feature table JSON]', function() {
        // var col = [
        //     255, 0, 0,
        //     0, 255, 0,
        //     0, 0, 255,
        //     256, 0, 0];

        // var color565 = [];
        // for (var i=0; i<4; i++) {
        //     var colrgb = [col[i*3], col[i*3+1], col[i*3+2]];
        //     console.log('colrgb: '+colrgb);
        //     var col565 = getRGB565(colrgb);
        //     console.log('col565: '+col565);
        //     color565.push(col565);
        //     console.log(getRGB(col565));
        // }
        // console.log(color565);
///
        // var col = [0, 255, 0];
        // var color565 = getRGB565(col);
        // console.log('565: '+color565);
        // var colrgb = getRGB(color565);
        // console.log('rgb: '+colrgb);

        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : [
                    0, 0, 0,
                    1, 0, 0,
                    0, 0, 1,
                    0, 1, 0],
                RGB565 : [0, 1, 65535, 65536]
            }
        });
        expect(validatePnts(pnts)).toBe('value of RGB565 must be in the range 0-65535 inclusive');
    });

    it('returns error message when RGB565 is out of range [Test using feature table Binary]', function() {
        var positionArray = new Float32Array([
            0, 0, 0,
            1, 0, 0,
            0, 0, 1,
            0, 1, 0
        ]);
        var positionBinary = Buffer.from(positionArray.buffer);

        var rgbArray = new Uint32Array([0, 1, 65535, 65536]);
        var rgbBinary = Buffer.from(rgbArray.buffer);

        var combinedBinary = Buffer.concat([positionBinary, rgbBinary]);

        var pnts = createPnts({
            featureTableJson : {
                POINTS_LENGTH : 4,
                POSITION : {
                    byteOffset : 0
                },
                RGB565 : {
                    byteOffset : 48
                }
            },
            featureTableBinary : combinedBinary
        });
        expect(validatePnts(pnts)).toBe('value of RGB565 must be in the range 0-65535 inclusive');
    });
});

// function getRGB565(color) {
//     var SHIFT_LEFT_11 = 2048.0;
//     var SHIFT_LEFT_5 = 32.0;
//     var r = Math.floor(color[0] * 31); // 5 bits
//     console.log('r= '+r);
//     var g = Math.floor(color[1] * 63); // 6 bits
//     console.log('g= '+g);
//     var b = Math.floor(color[2] * 31); // 5 bits
//     console.log('b= '+b);
//     var packedColor = (r * SHIFT_LEFT_11) + (g * SHIFT_LEFT_5) + b;
//     // var buffer = Buffer.alloc(2);
//     // buffer.writeUInt16LE(packedColor);
//     return packedColor;
// }

// function getRGB(compressed) {
//     var SHIFT_RIGHT_11 = 1.0 / 2048.0;
//     var SHIFT_RIGHT_5 = 1.0 / 32.0;
//     var SHIFT_LEFT_11 = 2048.0;
//     var SHIFT_LEFT_5 = 32.0;
//     var NORMALIZE_6 = 1.0 / 64.0;
//     var NORMALIZE_5 = 1.0 / 32.0;

//     var r = Math.floor(compressed * SHIFT_RIGHT_11);
//     console.log('r= '+r);
//     compressed -= r * SHIFT_LEFT_11;
//     console.log('comp= '+compressed);
//     var g = Math.floor(compressed * SHIFT_RIGHT_5);
//     console.log('g= '+g);
//     compressed -= g * SHIFT_LEFT_5;
//     console.log('comp= '+compressed);
//     var b = compressed;
//     console.log('b= '+b);
//     console.log('comp= '+compressed);
//     var rgb = [r * NORMALIZE_5, g * NORMALIZE_6, b * NORMALIZE_5];
//     console.log('rgb= '+rgb);
//     return rgb;
// }
