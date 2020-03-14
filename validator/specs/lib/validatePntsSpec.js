'use strict';
const validatePnts = require('../../lib/validatePnts');
const specUtility = require('./specUtility.js');

const createPnts = specUtility.createPnts;

describe('validate pnts', () => {
    it ('returns error message if the pnts buffer\'s byte length is less than its header length', async () => {
        const message = await validatePnts({
            content: Buffer.alloc(0),
            filePath: 'filepath'
        });
        expect(message).toBe('Header must be 28 bytes.');
    });

    it('returns error message if the pnts has invalid magic', async () => {
        const pnts = createPnts();
        pnts.write('xxxx', 0);
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Invalid magic: xxxx');
    });

    it('returns error message if the pnts has an invalid version', async () => {
        const pnts = createPnts();
        pnts.writeUInt32LE(10, 4);
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Invalid version: 10. Version must be 1.');
    });

    it('returns error message if the pnts has wrong byteLength', async () => {
        const pnts = createPnts();
        pnts.writeUInt32LE(0, 8);
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBeDefined();
        expect(message.indexOf('byteLength of 0 does not equal the tile\'s actual byte length of') === 0).toBe(true);
    });

    it('returns error message if the feature table binary is not aligned to an 8-byte boundary', async () => {
        const pnts = createPnts({
            unalignedFeatureTableBinary: true
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the batch table binary is not aligned to an 8-byte boundary', async () => {
        const pnts = createPnts({
            unalignedBatchTableBinary: true
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Batch table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the byte lengths in the header exceed the tile\'s byte length', async () => {
        const pnts = createPnts();
        pnts.writeUInt32LE(124, 12);
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table and batch table exceed the tile\'s byte length.');
    });

    it('returns error message if feature table JSON could not be parsed: ', async () => {
        const pnts = createPnts();
        const charCode = '!'.charCodeAt(0);
        pnts.writeUInt8(charCode, 28); // Replace '{' with '!'
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table JSON could not be parsed: Unexpected token ! in JSON at position 0');
    });

    it('returns error message if batch table JSON could not be parsed: ', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: 1,
                POSITION: [0, 0, 0]
            },
            batchTableJson: {
                height: [0.0]
            }
        });
        const featureTableJsonByteLength = pnts.readUInt32LE(12);
        const featureTableBinaryByteLength = pnts.readUInt32LE(16);
        const batchTableJsonByteOffset = 28 + featureTableJsonByteLength + featureTableBinaryByteLength;
        const charCode = '!'.charCodeAt(0);
        pnts.writeUInt8(charCode, batchTableJsonByteOffset); // Replace '{' with '!'
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Batch table JSON could not be parsed: Unexpected token ! in JSON at position 0');
    });

    it('returns error message if feature table does not contain a POINTS_LENGTH property: ', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POSITION: [0, 0, 0]
            }
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table must contain a POINTS_LENGTH property.');
    });

    it('returns error message if feature table does not contain either POSITION or POSITION_QUANTIZED properties: ', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: 1
            }
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table must contain either the POSITION or POSITION_QUANTIZED property.');
    });

    it('returns error message if feature table has a POSITION_QUANTIZED property but not QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE: ', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: 1,
                POSITION_QUANTIZED: [0, 0, 0]
            }
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table properties QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE are required when POSITION_QUANTIZED is present.');
    });

    it('returns error message if feature table has a BATCH_ID property but not a BATCH_LENGTH: ', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: 1,
                POSITION: [0, 0, 0],
                BATCH_ID: [0]
            }
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table property BATCH_LENGTH is required when BATCH_ID is present.');
    });

    it('returns error message if feature table has a BATCH_LENGTH property but not a BATCH_ID: ', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: 1,
                POSITION: [0, 0, 0],
                BATCH_LENGTH: 1
            }
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table property BATCH_ID is required when BATCH_LENGTH is present.');
    });

    it('returns error message if BATCH_LENGTH is greater than POINTS_LENGTH: ', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: 1,
                POSITION: [0, 0, 0],
                BATCH_ID: [0, 1],
                BATCH_LENGTH: 2
            }
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table property BATCH_LENGTH must be less than or equal to POINTS_LENGTH.');
    });

    it('returns error message if any BATCH_ID is greater than BATCH_LENGTH [Test using feature table JSON]: ', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: 3,
                POSITION: [1, 0, 0, 0, 1, 0, 0, 0, 1],
                BATCH_ID: [0, 1, 2],
                BATCH_LENGTH: 2
            }
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('All the BATCH_IDs must have values less than feature table property BATCH_LENGTH.');
    });

    it('returns error message if any BATCH_ID is greater than BATCH_LENGTH [Test using feature table binary]: ', async () => {
        const positionArray = new Float32Array([
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0
        ]);
        const positionBinary = Buffer.from(positionArray.buffer);

        const batchIdArray = new Uint8Array([
            0,
            1,
            2
        ]);
        const batchIdBinary = Buffer.from(batchIdArray.buffer);

        const combinedBinary = Buffer.concat([positionBinary, batchIdBinary]);

        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: 3,
                BATCH_LENGTH: 2,
                POSITION: {
                    byteOffset: 0
                },
                BATCH_ID: {
                    byteOffset: 36,
                    componentType: 'UNSIGNED_BYTE'
                }
            },
            featureTableBinary: combinedBinary
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('All the BATCH_IDs must have values less than feature table property BATCH_LENGTH.');
    });

    it('returns error message if feature table is invalid', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: 1,
                POSITION: [0, 0, 0],
                INVALID: 0
            }
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Invalid feature table property "INVALID".');
    });

    it('returns error message if batch table is invalid', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: 1,
                POSITION: [0, 0, 0],
                BATCH_ID: [0],
                BATCH_LENGTH: 1
            },
            batchTableJson: {
                height: {
                    byteOffset: 0,
                    type: 'SCALAR',
                    componentType: 'FLOAT'
                }
            }
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBe('Batch table binary property "height" exceeds batch table binary byte length.');
    });

    it('succeeds for valid pnts', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: 1,
                POSITION: [0, 0, 0]
            }
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });

    it('succeeds for valid pnts with a feature table binary', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: {
                    byteOffset: 0
                },
                POSITION: {
                    byteOffset: 4
                }
            },
            featureTableBinary: Buffer.alloc(16)
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });

    it('succeeds for valid pnts with a batch table', async () => {
        const pnts = createPnts({
            featureTableJson: {
                POINTS_LENGTH: 1,
                POSITION: {
                    byteOffset: 0
                }
            },
            featureTableBinary: Buffer.alloc(12),
            batchTableJson: {
                height: {
                    byteOffset: 0,
                    type: 'SCALAR',
                    componentType: 'FLOAT'
                }
            },
            batchTableBinary: Buffer.alloc(4)
        });
        const message = await validatePnts({
            content: pnts,
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });
});
