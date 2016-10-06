'use strict';
var fs = require('fs-extra');
var Promise = require('bluebird');
var zlib = require('zlib');
var isGzipped = require('./isGzipped');

var fsReadFile = Promise.promisify(fs.readFile);
var zlibGunzip = Promise.promisify(zlib.gunzip);
var parseJson = Promise.promisify(JSON.parse)


function readTileset(filePath) {
    return fsReadFile(filePath)
        .then(function (buffer) {
            if (isGzipped(buffer)) {
                return zlibGunzip(buffer)
                    .then(function(data) {
                        return parseJson(data.toString());
                })
            } else {
                return parseJson(buffer.toString());
            }
        });
}