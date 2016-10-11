'use strict';
var readTileset = require('../../lib/readTileset');

describe('readTileset', function() {
    it('reads a tileset', function(done) {
        expect(readTileset('./specs/data/Tileset/tileset.json')
            .then(function(tilesetData) {
                return (tilesetData['asset'] !== undefined)
            }), done).toResolve();
    });

    it('reads a gzipped tileset', function(done) {
        expect(readTile('./specs/data/TilesetGzipped/tileset.json')
            .then(function(tilesetData) {
                return (tilesetData['asset'] !== undefined)
            }), done).toResolve();
    });

    it('rejects an invalid tileset', function(done) {
        expect(readTileset('./specs/data/Tileset/parent.b3dm'), done).toRejectWith(Error);
    });
});
