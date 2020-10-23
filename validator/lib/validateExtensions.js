'use strict';
const Cesium = require('cesium');

const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

module.exports = validateExtensions;

const EMPTY_ARRAY = [];

const requiredExtensions = ['3DTILES_content_gltf'];

/**
 * Check if a tileset's extensions are valid.
 *
 * @param {Object} options An object with the following properties:
 * @param {Object} options.tileset The tileset JSON.
 * @returns {String} An error message if validation fails, otherwise undefined.
 */
function validateExtensions(options) {
    const tileset = options.tileset;
    const extensions = tileset.extensions;
    const extensionsUsed = defaultValue(tileset.extensionsUsed, EMPTY_ARRAY);
    const extensionsRequired = defaultValue(tileset.extensionsRequired, EMPTY_ARRAY);

    if (defined(extensions)) {
        for (const extensionName in extensions) {
            if (extensions.hasOwnProperty(extensionName)) {
                const extension = extensions[extensionName];
                if (!extensionsUsed.includes(extensionName)) {
                    return `${extensionName} must be included in extensionsUsed`;
                }
                if (requiredExtensions.includes(extensionName) && !extensionsRequired.includes(extensionName)) {
                    return `${extensionName} must be included in extensionsRequired`;
                }

                let message;
                if (extensionName === '3DTILES_content_gltf') {
                    message = validate3DTilesContentGltf(extension);
                }
                if (defined(message)) {
                    return `Error in ${extensionName}: ${message}`;
                }
            }
        }
    }
}

function validate3DTilesContentGltf(extension) {
    const gltfExtensionsUsed = defaultValue(extension.extensionsUsed, EMPTY_ARRAY);
    const gltfExtensionsRequired = defaultValue(extension.extensionsRequired, EMPTY_ARRAY);

    if (!Array.isArray(gltfExtensionsUsed)) {
        return 'extensionsUsed must be an array of strings';
    }

    if (!Array.isArray(gltfExtensionsRequired)) {
        return 'extensionsRequired must be an array of strings';
    }

    for (let i = 0; i < gltfExtensionsUsed.length; ++i) {
        if (typeof gltfExtensionsUsed[i] !== 'string') {
            return 'extensionsUsed must be an array of strings';
        }
    }

    for (let i = 0; i < gltfExtensionsRequired.length; ++i) {
        if (typeof gltfExtensionsRequired[i] !== 'string') {
            return 'extensionsRequired must be an array of strings';
        }
    }
}
