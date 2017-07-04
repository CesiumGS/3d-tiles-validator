'use strict';
var zlib = require('zlib');
var isGzipped = require('../../lib/isGzipped');

describe('isGzipped', function() {
    it('detects when data is gzipped', function() {
        var data = Buffer.alloc(40);
        expect(isGzipped(data)).toBe(false);
        data = zlib.gzipSync(data);
        expect(isGzipped(data)).toBe(true);
    });
});
