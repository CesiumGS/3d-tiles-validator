'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var Promise = require('bluebird');

var fsExtraOutputJson = Promise.promisify(fsExtra.outputJson);

var defaultValue = Cesium.defaultValue;

module.exports = saveTilesetJson;

/**
 * Save a tileset.json file to disk.
 *
 * @param {String} path The path to save the tileset.json.
 * @param {Object} json The JSON.
 * @param {Boolean} [prettyJson=true] Whether to prettify the JSON.
 *
 * @returns {Promise} A promise that resolves when the tileset.json is saved.
 */
function saveTilesetJson(path, json, prettyJson) {
    prettyJson = defaultValue(prettyJson, true);
    var options = {};
    if (prettyJson) {
        options.spaces = 2;
    }
    return fsExtraOutputJson(path, json, options);
}
