'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');

var defaultValue = Cesium.defaultValue;

module.exports = saveJson;

/**
 * Save a json file to disk.
 *
 * @param {String} path The path to save the tileset.json.
 * @param {Object} json The JSON.
 * @param {Boolean} [prettyJson=true] Whether to prettify the JSON.
 *
 * @returns {Promise} A promise that resolves when the tileset.json is saved.
 */
function saveJson(path, json, prettyJson) {
    prettyJson = defaultValue(prettyJson, true);
    var options = {};
    if (prettyJson) {
        options.spaces = 2;
    }
    return fsExtra.outputJson(path, json, options);
}
