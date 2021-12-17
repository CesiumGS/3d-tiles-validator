'use strict';
const Cesium = require('cesium');
const fsExtra = require('fs-extra');
const path = require('path');
const validator = require('gltf-validator');

const defaultValue = Cesium.defaultValue;

module.exports = validateGlb;

/**
 * Check if the glb is valid binary glTF.
 *
 * @param {Object} options An object with the following properties:
 * @param {Buffer} options.content The glb buffer.
 * @param {String} options.filePath The tile's file path.
 * @param {String} options.directory The tile's directory.
 * @param {Object} options.reader The file reader.
 * @param {Boolean} [options.writeReports=false] Write glTF error report next to the glTF file in question.
 * @returns {Promise} A promise that resolves when the validation completes. If the validation fails, the promise will resolve to an error message.
 */
async function validateGlb(options) {
    const glb = options.content;
    const filePath = options.filePath;
    const directory = options.directory;
    const reader = options.reader;
    const writeReports = defaultValue(options.writeReports, false);
    const version = glb.readUInt32LE(4);

    if (version !== 2) {
        return `Invalid Glb version: ${version}. Version must be 2.`;
    }

    try {
        const result = await validator.validateBytes(glb, {
            uri: filePath,
            externalResourceFunction: (uri) =>
                new Promise((resolve, reject) => {
                    uri = path.resolve(directory, decodeURIComponent(uri));
                    reader.readBinary(uri)
                        .then(data => resolve(data))
                        .catch(error => reject(error.toString()));
                })
        });

        if (result.issues.numErrors > 0) {
            const validationText = JSON.stringify(result, null, '  ');
            if (writeReports) {
                await fsExtra.writeFile(`${filePath}_report.json`, validationText);
            }
            return validationText;
        }
    } catch (error) {
        return `glTF validation could not be performed: ${error.message}`;
    }
}
