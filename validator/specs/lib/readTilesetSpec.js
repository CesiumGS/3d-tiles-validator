'use strict';
const fsExtra = require('fs-extra');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const readTileset = require('../../lib/readTileset');

function writeGzippedTileset(url) {
    const buffer = fsExtra.readFileSync(url);
    const gzipped = zlib.gzipSync(buffer);
    const tempFile = path.join(os.tmpdir(), 'tileset.json');
    fsExtra.outputFileSync(tempFile, gzipped);
    return tempFile;
}

describe('readTileset', () => {
    it('reads a tileset', async () => {
        const json = await readTileset('./specs/data/Tileset/tileset.json');
        expect(json).toBeDefined();
        expect(json.root).toBeDefined();
    });

    it('reads a gzipped tileset', async () => {
        const tilesetPath = writeGzippedTileset('./specs/data/Tileset/tileset.json');
        const json = await readTileset(tilesetPath);
        expect(json).toBeDefined();
        expect(json.root).toBeDefined();
    });

    it('rejects an invalid tileset', async () => {
        let error;
        try {
            await readTileset('./specs/data/Tileset/parent.b3dm');
        } catch (e) {
            error = e;
        }

        expect(() => { throw error; }).toThrowError();
    });
});
