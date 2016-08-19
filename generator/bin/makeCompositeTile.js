#!/usr/bin/env node
'use strict';

var Cesium = require('cesium');
var Promise = require('bluebird');
var fs = require('fs-extra');

var defined = Cesium.defined;

var argv = require('yargs')
    .usage('Usage: $0 \<tilesets\> [options]')
    .example('$0 batched.b3dm instanced.i3dm points.pnts -o output/composite.cmpt')
    .alias('o', 'output')
    .nargs('o', 1)
    .describe('o', 'Output path where the composite tile should be written')
    .help('h')
    .alias('h', 'help')
    .demand(1)
    .argv;

var fsReadFile = Promise.promisify(fs.readFile);
var fsOutputFile = Promise.promisify(fs.outputFile);

var outputPath = argv.o;
if (!defined(outputPath)) {
    outputPath = 'output/composite.cmpt';
}

var tilePaths = argv._;

Promise.map(tilePaths, function(tilePath) {
    return fsReadFile(tilePath);
})
    .then(function(tiles) {
        var header = new Buffer(16);
        var buffers = [];
        buffers.push(header);
        var byteLength = header.length;
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            // Byte align all tiles to 4 bytes
            var tilePadding = tile.length % 4;
            if (tilePadding !== 0) {
                tile = Buffer.concat([tile, new Buffer(4 - tilePadding)]);
            }
            tile.writeUInt32LE(tile.length, 8); //byteLength
            byteLength += tile.length;
            buffers.push(tile);
        }
        header.write('cmpt', 0);                // magic
        header.writeUInt32LE(1, 4);             // version
        header.writeUInt32LE(byteLength, 8);    // byteLength
        header.writeUInt32LE(tiles.length, 12); // tilesLength
        return fsOutputFile(outputPath, Buffer.concat(buffers));
    });

