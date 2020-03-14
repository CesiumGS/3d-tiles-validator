'use strict';
const validateTile = require('../../lib/validateTile');
const specUtility = require('./specUtility');

const createB3dm = specUtility.createB3dm;
const createI3dm = specUtility.createI3dm;
const createPnts = specUtility.createPnts;
const createCmpt = specUtility.createCmpt;

describe('validateTile', () => {
    it('returns error message if the tile format cannot be read from the tile', async () => {
        const message = await validateTile({
            content: Buffer.alloc(0),
            filePath: 'filepath'
        });
        expect(message).toBe('Cannot determine tile format from tile header, tile content is 0 bytes.');
    });

    it('returns error message if the tile has an invalid magic', async () => {
        const message = await validateTile({
            content: Buffer.from('xxxx'),
            filePath: 'filepath'
        });
        expect(message).toBe('Invalid magic: xxxx');
    });

    it('validates b3dm', async () => {
        const message = await validateTile({
            content: createB3dm(),
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });

    it('validates i3dm', async () => {
        const message = await validateTile({
            content: createI3dm(),
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });

    it('validates pnts', async () => {
        const message = await validateTile({
            content: createPnts(),
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });

    it('validates cmpt', async () => {
        const message = await validateTile({
            content: createCmpt(),
            filePath: 'filepath'
        });
        expect(message).toBeUndefined();
    });
});
