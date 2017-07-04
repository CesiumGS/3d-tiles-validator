'use strict';
var fsExtra = require('fs-extra');
var os = require('os');
var path = require('path');
var zlib = require('zlib');
var readTileset = require('../../lib/readTileset');

function writeGzippedTileset(url) {
    var buffer = fsExtra.readFileSync(url);
    var gzipped = zlib.gzipSync(buffer);
    var tempFile = path.join(os.tmpdir(), 'tileset.json');
    fsExtra.outputFileSync(tempFile, gzipped);
    return tempFile;
}

describe('readTileset', function() {
    it('reads a tileset', function(done) {
        expect(readTileset('./specs/data/Tileset/tileset.json')
            .then(function(json) {
                expect(json).toBeDefined();
                expect(json.root).toBeDefined();
            }), done).toResolve();
    });

    it('reads a gzipped tileset', function(done) {
        var tilesetPath = writeGzippedTileset('./specs/data/Tileset/tileset.json');
        expect(readTileset(tilesetPath)
            .then(function(json) {
                expect(json).toBeDefined();
                expect(json.root).toBeDefined();
            }), done).toResolve();
    });

    it('rejects an invalid tileset', function(done) {
        expect(readTileset('./specs/data/Tileset/parent.b3dm'), done).toRejectWith(Error);
    });
});
