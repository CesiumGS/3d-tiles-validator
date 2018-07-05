'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

var Extensions = {};

module.exports = Extensions;

/**
 * Add an extension to the list of extensions used for a tileset JSON.
 * @param {Object} tilesetJson The root tileset JSON object to which to add the extension.
 * @param {String} extensionName The name of the extension to add.
 */
Extensions.addExtensionsUsed = function(tilesetJson, extensionName) {
    var extensionsRequired = tilesetJson.extensionsUsed;

    if (!defined(extensionsRequired)) {
        extensionsRequired = tilesetJson.extensionsUsed = [];
    }

    extensionsRequired.push(extensionName);
};

/**
 * Add an extension to the list of extensions required for a tileset JSON.
 * @param {Object} tilesetJson The root tileset JSON object to which to add the extension.
 * @param {String} extensionName The name of the extension to add.
 */
Extensions.addExtensionsRequired = function(tilesetJson, extensionName) {
    var extensionsRequired = tilesetJson.extensionsRequired;

    if (!defined(extensionsRequired)) {
        extensionsRequired = tilesetJson.extensionsRequired = [];
    }

    extensionsRequired.push(extensionName);
};

/**
 * Add an extension to the extensions dictionary object for a JSON object.
 * @param {Object} tilesetJson The JSON object to which to add the extension.
 * @param {String} extensionName The name of the extension to add.
 * @param {*} extension The contents of the extension.
 */
Extensions.addExtension = function(objectJson, extensionName, extension) {
    var extensions = objectJson.extensions;

    if (!defined(extensions)) {
        extensions = objectJson.extensions = {};
    }

    extensions[extensionName] = extension;
};