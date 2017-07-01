'use strict';
var GltfPipeline = require('gltf-pipeline');

var getBinaryGltf = GltfPipeline.getBinaryGltf;
var loadGltfUris = GltfPipeline.loadGltfUris;
var parseBinaryGltf = GltfPipeline.parseBinaryGltf;
var Pipeline = GltfPipeline.Pipeline;

module.exports = optimizeGltf;

/**
 * Given an input buffer containing a binary glTF asset, optimize it using gltf-pipeline with the provided options
 *
 * @param {Buffer} glb The buffer containing the binary glTF.
 * @param {Object} [options] Options specifying custom gltf-pipeline behavior.
 * @returns {Promise} A promise that resolves to the optimized binary glTF.
 *
 * @private
 */
function optimizeGltf(glb, options) {
    var gltf = parseBinaryGltf(glb);
    return loadGltfUris(gltf)
        .then(function() {
            return Pipeline.processJSONWithExtras(gltf, options)
                .then(function(gltf) {
                    return getBinaryGltf(gltf, true, true).glb;
                });
        });
}
