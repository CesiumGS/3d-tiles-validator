#!/usr/bin/env node
'use strict';
var Promise = require('bluebird');
var makeCompositeTile = require('../lib/makeCompositeTile');
var readTile = require('../lib/readTile');
var writeTile = require('../lib/writeTile');

var argv = require('yargs')
    .usage('Usage: $0 \<tiles\> [options]')
    .example('$0 batched.b3dm instanced.i3dm points.pnts -o output/composite.cmpt')
    .example('$0 *.b3dm -o output/composite.cmpt')
    .alias('o', 'output')
    .default('o', 'output/composite.cmpt')
    .nargs('o', 1)
    .describe('o', 'Output path where the composite tile should be written.')
    .boolean('z')
    .alias('z', 'gzip')
    .default('z', false)
    .describe('z', 'Flag to gzip the output composite tile.')
    .help('h')
    .alias('h', 'help')
    .demand(1)
    .argv;

var tilePaths = argv._;
var outputPath = argv.o;

Promise.map(tilePaths, function(tilePath) {
    return readTile(tilePath);
})
    .then(function(tiles) {
        var options = {};
        if (argv.z) {
            options.gzip = true;
        }
        return writeTile(outputPath, makeCompositeTile(tiles), options);
    });
