'use strict';
const validateB3dm = require('../../lib/validateB3dm');
const specUtility = require('./specUtility.js');

const createB3dm = specUtility.createB3dm;
const createB3dmLegacy1 = specUtility.createB3dmLegacy1;
const createB3dmLegacy2 = specUtility.createB3dmLegacy2;

describe('validate b3dm', () => {
    it ('returns error message if the b3dm buffer\'s byte length is less than its header length', async () => {
        const message = await validateB3dm({
            content: Buffer.alloc(0),
            filePath: 'filepath'
        });
        expect(message).toBe('Header must be 28 bytes.');
    });

    it('returns error message if the b3dm has invalid magic', async () => {
        const b3dm = createB3dm();
        b3dm.write('xxxx', 0);
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBe('Invalid magic: xxxx');
    });

    it('returns error message if the b3dm has an invalid version', async () => {
        const b3dm = createB3dm();
        b3dm.writeUInt32LE(10, 4);
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBe('Invalid version: 10. Version must be 1.');
    });

    it('returns error message if the b3dm has wrong byteLength', async () => {
        const b3dm = createB3dm();
        b3dm.writeUInt32LE(0, 8);

        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBeDefined();
        expect(message.indexOf('byteLength of 0 does not equal the tile\'s actual byte length of') === 0).toBe(true);
    });

    it('returns error message if the b3dm header is a legacy version (1)', async () => {
        const message = await validateB3dm({
            content: createB3dmLegacy1(),
            filePath: 'filepath'
        });
        expect(message).toBe('Header is using the legacy format [batchLength] [batchTableByteLength]. The new format is [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength].');
    });

    it('returns error message if the b3dm header is a legacy version (2)', async () => {
        const message = await validateB3dm({
            content: createB3dmLegacy2(),
            filePath: 'filepath'
        });
        expect(message).toBe('Header is using the legacy format [batchTableJsonByteLength] [batchTableBinaryByteLength] [batchLength]. The new format is [featureTableJsonByteLength] [featureTableBinaryByteLength] [batchTableJsonByteLength] [batchTableBinaryByteLength].');
    });

    it('returns error message if the feature table binary is not aligned to an 8-byte boundary', async () => {
        const b3dm = createB3dm({
            unalignedFeatureTableBinary: true
        });
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the batch table binary is not aligned to an 8-byte boundary', async () => {
        const b3dm = createB3dm({
            unalignedBatchTableBinary: true
        });
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBe('Batch table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the glb is not aligned to an 8-byte boundary', async () => {
        const b3dm = createB3dm({
            unalignedGlb: true
        });
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBe('Glb must be aligned to an 8-byte boundary.');
    });

    it('returns error message if the byte lengths in the header exceed the tile\'s byte length', async () => {
        const b3dm = createB3dm();
        b3dm.writeUInt32LE(6004, 12);
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table, batch table, and glb byte lengths exceed the tile\'s byte length.');
    });

    it('returns error message if feature table JSON could not be parsed: ', async () => {
        const b3dm = createB3dm();
        const charCode = '!'.charCodeAt(0);
        b3dm.writeUInt8(charCode, 28); // Replace '{' with '!'
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table JSON could not be parsed: Unexpected token ! in JSON at position 0');
    });

    it('returns error message if batch table JSON could not be parsed: ', async () => {
        const b3dm = createB3dm({
            featureTableJson: {
                BATCH_LENGTH: 1
            },
            batchTableJson: {
                height: [0.0]
            }
        });
        const featureTableJsonByteLength = b3dm.readUInt32LE(12);
        const featureTableBinaryByteLength = b3dm.readUInt32LE(16);
        const batchTableJsonByteOffset = 28 + featureTableJsonByteLength + featureTableBinaryByteLength;
        const charCode = '!'.charCodeAt(0);
        b3dm.writeUInt8(charCode, batchTableJsonByteOffset); // Replace '{' with '!'
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBe('Batch table JSON could not be parsed: Unexpected token ! in JSON at position 0');
    });

    it('returns error message if feature table does not contain a BATCH_LENGTH property: ', async () => {
        const b3dm = createB3dm({
            featureTableJson: {
                PROPERTY: 0
            }
        });
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBe('Feature table must contain a BATCH_LENGTH property.');
    });

    it('returns error message if feature table is invalid', async () => {
        const b3dm = createB3dm({
            featureTableJson: {
                BATCH_LENGTH: 0,
                INVALID: 0
            }
        });
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBe('Invalid feature table property "INVALID".');
    });

    it('returns error message if batch table is invalid', async () => {
        const b3dm = createB3dm({
            featureTableJson: {
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
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBe('Batch table binary property "height" exceeds batch table binary byte length.');
    });

    it('succeeds for valid b3dm with BATCH_LENGTH 0 and no batch table', async () => {
        const b3dm = createB3dm({
            featureTableJson: {
                BATCH_LENGTH: 0
            }
        });
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });

    it('succeeds for valid b3dm with a feature table binary', async () => {
        const b3dm = createB3dm({
            featureTableJson: {
                BATCH_LENGTH: {
                    byteOffset: 0
                }
            },
            featureTableBinary: Buffer.alloc(4)
        });
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });

    it('succeeds for valid b3dm with a batch table', async () => {
        const b3dm = createB3dm({
            featureTableJson: {
                BATCH_LENGTH: 1
            },
            batchTableJson: {
                height: {
                    byteOffset: 0,
                    type: 'SCALAR',
                    componentType: 'FLOAT'
                }
            },
            batchTableBinary: Buffer.alloc(4)
        });
        const message = await validateB3dm({
            content: b3dm,
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });
});
