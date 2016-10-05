'use strict';
var fs = require('fs-extra');
var Promise = require('bluebird');

var fsReadFile = Promise.promisify(fs.readJson);

function readTileset(filePath) {
    return fsReadFile(filePath)
        .then(function (jsonObject) {
            return jsonObject;
        })
        .catch(function(error)  {
            throw error;
        });
}