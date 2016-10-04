'use strict';
var readTile = require('../../lib/readTile');

describe('readTile', function() {
    it('reads a tile', function(done) {
        expect(readTile('./specs/data/Tileset/parent.b3dm')
            .then(function(tileData) {
                var magic = tileData.toString('utf8', 0, 4);
                expect(magic).toEqual('b3dm');
            }), done).toResolve();
    });

    it('reads a gzipped tile', function(done) {
        expect(readTile('./specs/data/Tileset/parent.b3dm')
            .then(function(tileData) {
                var magic = tileData.toString('utf8', 0, 4);
                expect(magic).toEqual('b3dm');
            }), done).toResolve();
    });
});
