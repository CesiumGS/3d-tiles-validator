'use strict';
var path = require('path');
var createGltf = require('./createGltf');
var gltfPipeline = require('gltf-pipeline');
var gltfToGlb = gltfPipeline.gltfToGlb;
var gltfConversionOptions = { resourceDirectory: path.join(__dirname, '../')};

module.exports = createGlb;

/**
 * Create a glb from a Mesh.
 *
 * @param {Object} options An object with the following properties:
 * @param {Mesh} options.mesh The mesh.
 * @param {Boolean} [options.useBatchIds=true] Modify the glTF to include the batchId vertex attribute.
 * @param {Boolean} [options.relativeToCenter=false] Set mesh positions relative to center.
 * @param {Boolean} [options.deprecated=false] Save the glTF with the old BATCHID semantic.
 *
 * @returns {Promise} A promise that resolves with the binary glb buffer.
 */

function createGlb(options) {
    var gltf = createGltf(options);
    return gltfToGlb(gltf, gltfConversionOptions).then(function(results) {
        return results.glb;
    });
}
