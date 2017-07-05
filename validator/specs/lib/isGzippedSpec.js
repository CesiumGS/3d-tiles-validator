'use strict';
var Promise = require('bluebird');
var zlib = require('zlib');
var isGzipped = require('../../lib/isGzipped');

var zlibGzip = Promise.promisify(zlib.gzip);

describe('isGzipped', function() {
    it('detects when data is gzipped', function(done) {
        var data = Buffer.alloc(40);
        expect(isGzipped(data)).toBe(false);
        expect(zlibGzip(data)
            .then(function(zippedData) {
                expect(isGzipped(zippedData)).toBe(true);
            }), done).toResolve();
    });
});
