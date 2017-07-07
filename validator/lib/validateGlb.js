'use strict';

module.exports = validateGlb;

/**
 * Check if the glb is valid binary glTF.
 *
 * @param {Buffer} glb The glb buffer.
 * @returns {String} An error message if validation fails, otherwise undefined.
 */
function validateGlb(glb) {
    var version = glb.readUInt32LE(4);

    if (version !== 2) {
        return 'Invalid Glb version: ' + version + '. Version must be 2.';
    }
}
