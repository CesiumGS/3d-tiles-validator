'use strict';

var makeCompositeTile = require('../../lib/makeCompositeTile');
var readTile = require('../../lib/readTile');
var justHeaderI3dmPath = './specs/data/justHeader.i3dm';

describe('makeCompositeTile', function() {
    it('makes a composite tile', function(done) {
        expect(readTile(justHeaderI3dmPath)
            .then(function(tile) {
                var tiles = [tile, tile];
                return makeCompositeTile(tiles);
            })
            .then(function(tileData) {
                var magic = tileData.toString('utf8', 0, 4);
                var byteLength = 16 + 32 + 32;
                expect(tileData.length).toBe(byteLength);
                expect(magic).toEqual('cmpt');                     // magic
                expect(tileData.readUInt32LE(4)).toBe(1);          // version
                expect(tileData.readUInt32LE(8)).toBe(byteLength); // byteLength
                expect(tileData.readUInt32LE(12)).toBe(2);         // tilesLength
                var tileMagic = tileData.toString('utf8', 16, 20);
                expect(tileMagic).toEqual('i3dm');
                tileMagic = tileData.toString('utf8', 48, 52);
                expect(tileMagic).toEqual('i3dm');
            }), done).toResolve();
    });
});