'use strict';

module.exports = validateGlb;
var cp = require('child_process');
/**
 * Check if the glb is valid binary glTF.
 *
 * @param {Buffer} glb The glb buffer.
 * @returns {String} An error message if validation fails, otherwise undefined.
 */
function validateGlb(glb) {
    var version = glb.readUInt32LE(4);

    cp.execFile('./GLTF/exec/gltf_validator', ['./GLTF/glb_sample/Box.glb'], function(err, stdout, stderr){
        if(err) {console.error(err);}    
        console.log('stdout', stdout);
        console.log('stderr', stderr);
    });

    if (version !== 2) {
        return 'Invalid Glb version: ' + version + '. Version must be 2.';
    }
}

