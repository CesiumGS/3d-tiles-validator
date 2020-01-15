'use strict';

module.exports = validateGlb;
const path = require('path');
const os = require('os');
const fs = require('fs');
const validator = require('gltf-validator');

/**
 * Check if the glb is valid binary glTF.
 *
 * @param {Buffer} glb The glb buffer.
 * @returns {String} An error message if validation fails, otherwise undefined.
 */
function validateGlb(glb, filePath) {
    var version = glb.readUInt32LE(4);

    if (version !== 2) {
        return 'Invalid Glb version: ' + version + '. Version must be 2.';
    }

    return validator.validateBytes(glb, {
        uri: filePath,
        externalResourceFunction: (uri) =>
            new Promise((resolve, reject) => {
                uri = path.resolve(path.dirname(filePath), decodeURIComponent(uri));
                console.info("Loading external file: " + uri);
                fs.readFile(uri, (err, data) => {
                    if (err) {
                        console.error(err.toString());
                        reject(err.toString());
                        return;
                    }
                    resolve(data);
                });
            })
    }).then((result) => {
        // [result] will contain validation report in object form.
        // You can convert it to JSON to see its internal structure. 
        if (result.issues.numErrors > 0) {
            let validationText = JSON.stringify(result, null, '  ');
            if (argv.writeReports) {
                fs.writeFile(`${filePath}_report.json`, validationText, (err) => {
                    if (err) { throw err; }
                });
            }
            return validationText;
        }
        return;
    }, (result) => {
        // Promise rejection means that arguments were invalid or validator was unable 
        // to detect file format (glTF or GLB). 
        // [result] will contain exception string.
        //console.error(result);
        return result;
    });
}
