'use strict';
var Cesium = require('cesium');
var gltfPipeline = require('gltf-pipeline');

var defined = Cesium.defined;

var getBinaryGltf = gltfPipeline.getBinaryGltf;

var dataUriRegex = /^data\:/i;

module.exports = modifyGltfPaths;

/**
 * Modify uri paths to point to a different folder
 *
 * @param {Buffer} glb The binary glTF buffer.
 * @param {String} relativePath A new relative path for the external resources
 * @returns {Buffer} The modified glb buffer
 *
 * @private
 */
function modifyGltfPaths(glb, relativePath) {
    var gltf = gltfPipeline.parseBinaryGltf(glb);
    var resources = [];
    findResources(gltf, resources);
    var resourcesLength = resources.length;
    for (var i = 0; i < resourcesLength; ++i) {
        resources[i].uri = relativePath + resources[i].uri;
    }
    return getBinaryGltf(gltf, false, false).glb;
}

function findResources(object, resources) {
    for (var propertyId in object) {
        if (object.hasOwnProperty(propertyId)) {
            var property = object[propertyId];
            if (defined(property) && typeof property === 'object') {
                if (defined(property.uri) && !dataUriRegex.test(property.uri)) {
                    resources.push(property);
                }
                findResources(property, resources);
            }
        }
    }
}
