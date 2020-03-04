'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var saveBinary = require('./saveBinary');

var defaultValue = Cesium.defaultValue;

module.exports = saveJson;

/**
 * Save a json file to disk.
 *
 * @param {String} path The path to save the tileset.json.
 * @param {Object} json The JSON.
 * @param {Boolean} [prettyJson=true] Whether to prettify the JSON.
 * @param {Boolean} [gzip=false] Whether to use GZIP or not
 *
 * @returns {Promise} A promise that resolves when the tileset.json is saved.
 */
function saveJson(path, json, prettyJson, gzip) {
    prettyJson = defaultValue(prettyJson, true);
    var options = {};
    if (prettyJson) {
        options.spaces = 2;
    }
    gzip = defaultValue(gzip, false);
    if (gzip) {
        return saveBinary(path, Buffer.from(json), gzip);
    }

    return fsExtra.outputJson(path, json, options);
}
