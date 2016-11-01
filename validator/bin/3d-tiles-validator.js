#!/usr/bin/env node
'use strict';

var argv = require('yargs').argv;

var readTileset = require('../lib/readTileset');
var validateTileset = require('../lib/validateTileset');

var filePath = argv._[0];
readTileset(filePath)
    .then(function(json) {
       validateTileset(json)
           .then(function(response) {
            console.log(response.message);
        })
    });
