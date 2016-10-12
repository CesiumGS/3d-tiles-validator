'use strict';
var Cesium = require('cesium');
var Promise = require('bluebird');
var fsExtra = require('fs-extra');
var path = require('path');

var defaultValue = Cesium.defaultValue;

var fsExtraReaddir = Promise.promisify(fsExtra.readdir);
var fsExtraStat = Promise.promisify(fsExtra.stat);

module.exports = getFilesInDirectory;

function getFilesInDirectory(directory, options) {
    var files = [];
    options = defaultValue(options, defaultValue);
    var recursive = defaultValue(options.recursive, false);
    var filter = defaultValue(options.filter, function() {
        return true;
    });
    return findFiles(directory, files, recursive, filter);
}

function findFiles(directory, files, recursive, filter) {
    return fsExtraReaddir(directory).map(function(fileName) {
        var fullPath = path.join(directory, fileName);
        return fsExtraStat(fullPath)
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