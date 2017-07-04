#!/usr/bin/env node
'use strict';
var Cesium = require('cesium');
var path = require('path');
var yargs = require('yargs');
var isTile = require('../lib/isTile');
var readTile = require('../lib/readTile');
var readTileset = require('../lib/readTileset');
var validateTile = require('../lib/validateTile');
var validateTileset = require('../lib/validateTileset');

var defined = Cesium.defined;

var args = process.argv.slice(2);
var argv = yargs
    .usage('Usage: node $0 -i <path>')
    .help('h')
    .alias('h', 'help')
    .options({
        'i': {
            alias: 'input',
            description: 'Input path for the tileset or tile.',
            normalize: true,
            demandOption: true,
            type: 'string'
        }
    })
    .recommendCommands()
    .strict()
    .parse(args);

var promise;
var filePath = argv.input;
var extension = path.extname(filePath);
if (extension === '') {
    filePath = path.join(filePath, 'tileset.json');
}

if (isTile(filePath)) {
    promise = readTile(filePath)
        .then(function(content) {
            return validateTile(content);
        });
} else {
    promise = readTileset(filePath)
        .then(function(tileset) {
            return validateTileset(tileset, path.dirname(filePath));
        });
}

promise.then(function(message) {
    if (defined(message)) {
        console.log(message);
    } else {
        console.log(filePath + ' is valid');
    }
}).catch(function(error) {
    console.log('Could not read ' + error.message);
});
