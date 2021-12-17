'use strict';
const isTile = require('../../lib/isTile');

describe('isTile', () => {
    it('detects if the file path is a tile', () => {
        expect(isTile('tile.b3dm')).toBe(true);
        expect(isTile('tile.i3dm')).toBe(true);
        expect(isTile('tile.pnts')).toBe(true);
        expect(isTile('tile.cmpt')).toBe(true);

        expect(isTile('tile')).toBe(false);
        expect(isTile('tile.xxxx')).toBe(false);
        expect(isTile('tileset.json')).toBe(false);
    });
});
