'use strict';
const fsExtra = require('fs-extra');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const readTile = require('../../lib/readTile');

function writeGzippedTile(url) {
    const buffer = fsExtra.readFileSync(url);
    const gzipped = zlib.gzipSync(buffer);
    const tempFile = path.join(os.tmpdir(), 'tile.b3dm');
    fsExtra.outputFileSync(tempFile, gzipped);
    return tempFile;
}

describe('readTile', () => {
    it('reads a tile', async () => {
        const content = await readTile('./specs/data/Tileset/parent.b3dm');
        const magic = content.toString('utf8', 0, 4);
        expect(magic).toEqual('b3dm');
    });

    it('reads a gzipped tile', async () => {
        const tilePath = writeGzippedTile('./specs/data/Tileset/parent.b3dm');
        const content = await readTile(tilePath);
        const magic = content.toString('utf8', 0, 4);
        expect(magic).toEqual('b3dm');
        fsExtra.removeSync(tilePath);
    });
});
