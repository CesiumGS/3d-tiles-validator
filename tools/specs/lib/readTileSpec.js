'use strict';
var readTile = require('../../lib/readTile');

describe('readTile', function() {
    it('throws DeveloperError if filePath is undefined', function() {
        expect(function() {
            readTile();
        }).toThrowDeveloperError();
    });

    it('reads a tile', function(done) {
        expect(readTile('./specs/data/justHeader.i3dm')
            .then(function(tileData) {
                var magic = tileData.toString('utf8', 0, 4);
                expect(magic).toEqual('i3dm');
            }), done).toResolve();
    });

    it('reads a gzipped tile', function(done) {
        expect(readTile('./specs/data/justHeaderGzipped.i3dm')
            .then(function(tileData) {
                var magic = tileData.toString('utf8', 0, 4);
                expect(magic).toEqual('i3dm');
            }), done).toResolve();
    });
});