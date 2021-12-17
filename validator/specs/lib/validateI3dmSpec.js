'use strict';
const validateI3dm = require('../../lib/validateI3dm');
const specUtility = require('./specUtility.js');

const createI3dm = specUtility.createI3dm;

describe('validate i3dm', () => {
    it ('returns error message if the i3dm buffer\'s byte length is less than its header length', async () => {
        const message = await validateI3dm({
            content: Buffer.alloc(0),
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Header must be 32 bytes.');
    });

    it('returns error message if the i3dm has invalid magic', async () => {
        const i3dm = createI3dm();
        i3dm.write('xxxx', 0);
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Invalid magic: xxxx');
    });

    it('returns error message if the i3dm has an invalid version', async () => {
        const i3dm = createI3dm();
        i3dm.writeUInt32LE(10, 4);
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Invalid version: 10. Version must be 1.');
    });

    it('returns error message if the i3dm has wrong byteLength', async () => {
        const i3dm = createI3dm();
        i3dm.writeUInt32LE(0, 8);
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBeDefined();
        expect(message.indexOf('byteLength of 0 does not equal the tile\'s actual byte length of') === 0).toBe(true);
    });

    it('returns error message if the feature table binary is not aligned to an 8-byte boundary', async () => {
        const i3dm = createI3dm({
            unalignedFeatureTableBinary: true
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Feature table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the batch table binary is not aligned to an 8-byte boundary', async () => {
        const i3dm = createI3dm({
            unalignedBatchTableBinary: true
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Batch table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the glb is not aligned to an 8-byte boundary', async () => {
        const i3dm = createI3dm({
            unalignedGlb: true
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Glb must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the byte lengths in the header exceed the tile\'s byte length', async () => {
        const i3dm = createI3dm();
        i3dm.writeUInt32LE(6000, 12);
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Feature table, batch table, and glb byte lengths exceed the tile\'s byte length.');
    });

    it('returns error message if feature table JSON could not be parsed: ', async () => {
        const i3dm = createI3dm();
        const charCode = '!'.charCodeAt(0);
        i3dm.writeUInt8(charCode, 32); // Replace '{' with '!'
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Feature table JSON could not be parsed: Unexpected token ! in JSON at position 0');
    });

    it('returns error message if batch table JSON could not be parsed: ', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                INSTANCES_LENGTH: 1,
                POSITION: [0, 0, 0]
            },
            batchTableJson: {
                height: [0.0]
            }
        });
        const featureTableJsonByteLength = i3dm.readUInt32LE(12);
        const featureTableBinaryByteLength = i3dm.readUInt32LE(16);
        const batchTableJsonByteOffset = 32 + featureTableJsonByteLength + featureTableBinaryByteLength;
        const charCode = '!'.charCodeAt(0);
        i3dm.writeUInt8(charCode, batchTableJsonByteOffset); // Replace '{' with '!'
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Batch table JSON could not be parsed: Unexpected token ! in JSON at position 0');
    });

    it('returns error message if feature table does not contain an INSTANCES_LENGTH property: ', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                POSITION: [0, 0, 0]
            }
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Feature table must contain an INSTANCES_LENGTH property.');
    });

    it('returns error message if feature table does not contain either POSITION or POSITION_QUANTIZED properties: ', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                INSTANCES_LENGTH: 1
            }
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Feature table must contain either the POSITION or POSITION_QUANTIZED property.');
    });

    it('returns error message if feature table has a NORMAL_UP property but not a NORMAL_RIGHT property: ', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                INSTANCES_LENGTH: 1,
                POSITION: [0, 0, 0],
                NORMAL_UP: [1, 0, 0]
            }
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Feature table property NORMAL_RIGHT is required when NORMAL_UP is present.');
    });

    it('returns error message if feature table has a NORMAL_RIGHT property but not a NORMAL_UP property: ', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                INSTANCES_LENGTH: 1,
                POSITION: [0, 0, 0],
                NORMAL_RIGHT: [1, 0, 0]
            }
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Feature table property NORMAL_UP is required when NORMAL_RIGHT is present.');
    });

    it('returns error message if feature table has a NORMAL_UP_OCT32P property but not a NORMAL_RIGHT_OCT32P property: ', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                INSTANCES_LENGTH: 1,
                POSITION: [0, 0, 0],
                NORMAL_UP_OCT32P: [1, 0, 0]
            }
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Feature table property NORMAL_RIGHT_OCT32P is required when NORMAL_UP_OCT32P is present.');
    });

    it('returns error message if feature table has a NORMAL_RIGHT_OCT32P property but not a NORMAL_UP_OCT32P property: ', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                INSTANCES_LENGTH: 1,
                POSITION: [0, 0, 0],
                NORMAL_RIGHT_OCT32P: [1, 0, 0]
            }
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Feature table property NORMAL_UP_OCT32P is required when NORMAL_RIGHT_OCT32P is present.');
    });

    it('returns error message if feature table has a POSITION_QUANTIZED property but not QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE: ', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                INSTANCES_LENGTH: 1,
                POSITION_QUANTIZED: [0, 0, 0]
            }
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Feature table properties QUANTIZED_VOLUME_OFFSET and QUANTIZED_VOLUME_SCALE are required when POSITION_QUANTIZED is present.');
    });

    it('returns error message if feature table is invalid', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                INSTANCES_LENGTH: 1,
                POSITION: [0, 0, 0],
                INVALID: 0
            }
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Invalid feature table property "INVALID".');
    });

    it('returns error message if batch table is invalid', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                INSTANCES_LENGTH: 1,
                POSITION: [0, 0, 0]
            },
            batchTableJson: {
                height: {
                    byteOffset: 0,
                    type: 'SCALAR',
                    componentType: 'FLOAT'
                }
            }
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBe('Batch table binary property "height" exceeds batch table binary byte length.');
    });

    it('succeeds for valid i3dm', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                INSTANCES_LENGTH: 1,
                POSITION: [0, 0, 0]
            }
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBeUndefined();
    });

    it('succeeds for valid i3dm with a feature table binary', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                INSTANCES_LENGTH: {
                    byteOffset: 0
                },
                POSITION: {
                    byteOffset: 4
                }
            },
            featureTableBinary: Buffer.alloc(16)
        });
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBeUndefined();
    });

    it('succeeds for valid i3dm with a batch table', async () => {
        const i3dm = createI3dm({
            featureTableJson: {
                INSTANCES_LENGTH: 1,
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
        const message = await validateI3dm({
            content: i3dm,
            filePath: 'filepath',
            directory: '.'
        });
        expect(message).toBeUndefined();
    });
});
