'use strict';
const validateCmpt = require('../../lib/validateCmpt');
const specUtility = require('./specUtility.js');

const createB3dm = specUtility.createB3dm;
const createI3dm = specUtility.createI3dm;
const createPnts = specUtility.createPnts;
const createCmpt = specUtility.createCmpt;

describe('validate cmpt', () => {
    it ('returns error message if the cmpt buffer\'s byte length is less than its header length', async () => {
        const message = await validateCmpt({
            content: Buffer.alloc(0),
            filePath: 'filepath'
        });
        expect(message).toBe('Header must be 16 bytes.');
    });

    it('returns error message if the cmpt has invalid magic', async () => {
        const cmpt = createCmpt();
        cmpt.write('xxxx', 0);
        const message = await validateCmpt({
            content: cmpt,
            filePath: 'filepath'
        });
        expect(message).toBe('Invalid magic: xxxx');
    });

    it('returns error message if the cmpt has an invalid version', async () => {
        const cmpt = createCmpt();
        cmpt.writeUInt32LE(10, 4);
        const message = await validateCmpt({
            content: cmpt,
            filePath: 'filepath'
        });
        expect(message).toBe('Invalid version: 10. Version must be 1.');
    });

    it('returns error message if the cmpt has wrong byteLength', async () => {
        const cmpt = createCmpt();
        cmpt.writeUInt32LE(0, 8);
        const message = await validateCmpt({
            content: cmpt,
            filePath: 'filepath'
        });
        expect(message).toBeDefined();
        expect(message.indexOf('byteLength of 0 does not equal the tile\'s actual byte length of') === 0).toBe(true);
    });

    it('returns error message if an inner tile\'s byteLength cannot be read', async () => {
        const i3dm = createI3dm();
        const b3dmStub = Buffer.from('b3dm');
        const cmpt = createCmpt([i3dm, b3dmStub]);
        const message = await validateCmpt({
            content: cmpt,
            filePath: 'filepath'
        });
        expect(message).toBe('Cannot read byte length from inner tile, exceeds cmpt tile\'s byte length.');
    });

    it('returns error message if inner tile is not aligned to an 8-byte boundary', async () => {
        const pnts = createPnts({
            unalignedByteLength: true
        });
        const b3dm = createB3dm();
        const cmpt = createCmpt([pnts, b3dm]);
        const message = await validateCmpt({
            content: cmpt,
            filePath: 'filepath'
        });
        expect(message).toBe('Inner tile must be aligned to an 8-byte boundary');
    });

    it('returns error message if inner tile fails validation (1)', async () => {
        const i3dm = createI3dm();
        const b3dm = createB3dm({
            unalignedFeatureTableBinary: true
        });
        const cmpt = createCmpt([i3dm, b3dm]);
        const message = await validateCmpt({
            content: cmpt,
            filePath: 'filepath'
        });
        expect(message).toBe('Error in inner b3dm tile: Feature table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if inner tile fails validation (2)', async () => {
        const pnts = createPnts();
        const i3dm = createI3dm();
        const b3dm = createB3dm({
            unalignedFeatureTableBinary: true
        });
        const cmptInner = createCmpt([b3dm, i3dm]);
        const cmpt = createCmpt([pnts, cmptInner]);
        const message = await validateCmpt({
            content: cmpt,
            filePath: 'filepath'
        });
        expect(message).toBe('Error in inner cmpt tile: Error in inner b3dm tile: Feature table binary must be aligned to an 8-byte boundary.');
    });

    it('returns error message if inner tile magic is invalid', async () => {
        const i3dm = createI3dm();
        const b3dm = createB3dm();
        b3dm.write('xxxx', 0);
        const cmpt = createCmpt([b3dm, i3dm]);
        const message = await validateCmpt({
            content: cmpt,
            filePath: 'filepath'
        });
        expect(message).toBe('Invalid inner tile magic: xxxx');
    });

    it('validates cmpt with no inner tiles', async () => {
        const message = await validateCmpt({
            content: createCmpt(),
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });

    it('validates cmpt with inner tiles', async () => {
        const pnts = createPnts();
        const i3dm = createI3dm();
        const b3dm = createB3dm();
        const message = await validateCmpt({
            content: createCmpt([pnts, i3dm, b3dm]),
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });

    it('validates cmpt with inner composite tiles', async () => {
        const pnts = createPnts();
        const i3dm = createI3dm();
        const b3dm = createB3dm();
        const cmpt = createCmpt([b3dm, i3dm]);
        const message = await validateCmpt({
            content: createCmpt([pnts, cmpt]),
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });
});
