'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');

var fsReaddir = Promise.promisify(fs.readdir);
var fsStat = Promise.promisify(fs.stat);

var defaultValue = Cesium.defaultValue;

module.exports = getFilesInDirectory;

function getFilesInDirectory(directory, options) {
    var files = [];
    options = defaultValue(options, {});
    var recursive = defaultValue(options.recursive, false);
    var filter = defaultValue(options.filter, function() {
        return true;
    });
    return findFiles(directory, files, recursive, filter);
}

function findFiles(directory, files, recursive, filter) {
    return fsReaddir(directory).map(function(fileName) {
        var fullPath = path.join(directory, fileName);
        return fsStat(fullPath)
            .then(function(stats) {
                if (stats.isFile() && filter(fullPath)) {
                    files.push(fullPath);
                } else if (recursive && stats.isDirectory()) {
                    return findFiles(fullPath, files, recursive, filter);
                }
            });
    })
        .then(function() {
            return files;
        });
}