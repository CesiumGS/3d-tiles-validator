'use strict';

var Cesium = require('cesium');
var readTileset = require('../../lib/readTileset');
var defined = Cesium.defined;

describe('readTileset', function() {
    it('reads a tileset', function(done) {
        expect(readTileset('./specs/data/Tileset/tileset.json')
            .then(function(tilesetData) {
                if (defined(tilesetData['asset'])) {
                    done();
                } else {
                    throwError("not a tileset");
                }
            }), done).toResolve();
    });

    it('reads a gzipped tileset', function(done) {
        expect(readTile('./specs/data/TilesetGzipped/tileset.json')
            .then(function(tilesetData) {
                 if (defined(tilesetData['asset'])) {
                     done();
                 } else {
                     throwError("not a tileset");
                 }
            }), done).toResolve();
    });

    it('rejects an invalid tileset', function(done) {
        expect(readTileset('./specs/data/Tileset/parent.b3dm'), done).toRejectWith(Error);
    });
});
