'use strict';

module.exports = modifyGltfPaths;

/**
 * TODO
 * Modify uri paths to point to a different folder
 *
 * @param {Buffer} glb The binary glTF buffer.
 * @param {String} relativePath A new relative path for the external resources
 * @returns {Buffer} The modified glb buffer
 *
 * @private
 */
function modifyGltfPaths(glb, relativePath) {
    return Buffer.alloc(0);
}
