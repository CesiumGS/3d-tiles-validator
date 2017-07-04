'use strict';
var fsExtra = require('fs-extra');
var os = require('os');
var path = require('path');
var zlib = require('zlib');
var readTile = require('../../lib/readTile');

function writeGzippedTile(url) {
    var buffer = fsExtra.readFileSync(url);
    var gzipped = zlib.gzipSync(buffer);
    var tempFile = path.join(os.tmpdir(), 'tile.b3dm');
    fsExtra.outputFileSync(tempFile, gzipped);
    return tempFile;
}

describe('readTile', function() {
    it('reads a tile', function(done) {
        expect(readTile('./specs/data/Tileset/parent.b3dm')
            .then(function(content) {
                var magic = content.toString('utf8', 0, 4);
                expect(magic).toEqual('b3dm');
            }), done).toResolve();
    });

    it('reads a gzipped tile', function(done) {
        var tilePath = writeGzippedTile('./specs/data/Tileset/parent.b3dm');
        expect(readTile(tilePath)
            .then(function(content) {
                var magic = content.toString('utf8', 0, 4);
                expect(magic).toEqual('b3dm');
                fsExtra.removeSync(tilePath);
            }), done).toResolve();
    });
});
