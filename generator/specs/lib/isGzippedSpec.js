'use strict';
var Promise = require('bluebird');
var zlib = require('zlib');

var isGzipped = require('../../lib/isGzipped');

var zlibGzip = Promise.promisify(zlib.gzip);

describe('isGzipped', function() {
    it('throws DeveloperError if data is undefined', function() {
        expect(function() {
            isGzipped(undefined);
        }).toThrowError();
    });

    it('detects when data is gzipped', function(done) {
        var data = new Buffer(40);
        expect(isGzipped(data)).toBeFalsy();
        expect(zlibGzip(data, undefined)
            .then(function(zippedData) {
                expect(isGzipped(zippedData)).toBeTruthy();
            }), done).toResolve();
    });
});