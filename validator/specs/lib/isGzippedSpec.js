'use strict';
const zlib = require('zlib');

const isGzipped = require('../../lib/isGzipped');

describe('isGzipped', () => {
    it('detects when data is gzipped', () => {
        let data = Buffer.alloc(40);
        expect(isGzipped(data)).toBe(false);
        data = zlib.gzipSync(data);
        expect(isGzipped(data)).toBe(true);
    });
});
