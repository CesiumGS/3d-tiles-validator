'use strict';
var isTile = require('../../lib/isTile');

describe('isTile', function() {
    it('detects if the file path is a tile', function() {
        expect(isTile('tile.b3dm')).toBe(true);
        expect(isTile('tile.i3dm')).toBe(true);
        expect(isTile('tile.pnts')).toBe(true);
        expect(isTile('tile.cmpt')).toBe(true);

        expect(isTile('tile')).toBe(false);
        expect(isTile('tile.xxxx')).toBe(false);
        expect(isTile('tile.json')).toBe(false);
    });
});