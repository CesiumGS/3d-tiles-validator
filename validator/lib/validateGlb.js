'use strict';
var fs = require('fs');
var os = require('os');
var path = require('path');
var uuid = require('uuid');
var childProcess = require('child_process');
var Cesium = require('cesium');
var fileExist = require('file-exists');
var Promise = require('bluebird');

var defined = Cesium.defined;

module.exports = validateGlb;

var gltfValidatorPath = path.join (__dirname, '../bin/gltf_validator');
var glbfilepath = path.join(os.tmpdir(), 'temp_glb_file.glb');

/**
 * Check if the glb is valid binary glTF.
 *
 * @param {Buffer} glb The glb buffer.
 * @returns {String} An error message if validation fails, otherwise undefined.
 */
function validateGlb(glb) {
    var version = glb.readUInt32LE(4);

    if (version !== 2) {
        var message = 'Invalid Glb version: ' + version + '. Version must be 2.';
        return Promise.resolve(message);
    }

    if (fileExist.sync(gltfValidatorPath)) {
        var filehandle = fs.openSync(glbfilepath, 'w+');
        fs.writeSync(filehandle, glb, 0, glb.length, 0);
        fs.closeSync(filehandle);
        return new Promise(function (resolve, reject) {
            var child = childProcess.spawn(gltfValidatorPath, [glbfilepath]);
            var message = undefined;
            child.stdout.on('data', function(data) {
                message += data.toString();
            });
            child.on('exit', function (code) {
                if (code == 0) {
                    message = undefined;
                    resolve(message);
                }
                else {
                    if (message == undefined) {message = 'Input GLTF is invalid';}
                    resolve(message);
                }
            });
        });
    }
}