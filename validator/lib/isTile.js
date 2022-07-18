'use strict';
const path = require('path');
const Cesium = require('cesium');
const defined = Cesium.defined;
module.exports = isTile;

/**
 * Checks whether the given file path is a tile file path.
 *
 * @param {String} filePath The file path.
 * @param {String} version The tileset version
 * @returns {Boolean} True if the file path is a tile file path, false if not.
 */
function isTile(filePath, version) {
    const extension = path.extname(filePath);
    if (defined(version)) {
        if (version === '1.0') {
            return (
                extension === '.b3dm' ||
                extension === '.i3dm' ||
                extension === '.pnts' ||
                extension === '.cmpt');
        } else if (version === '2.0.0-alpha.0') {
            return (
                extension === '.gltf' ||
                extension === '.glb');
        } 
            return false;
        
    }

    // if no version specified, match any
    return (
        extension === '.gltf' ||
        extension === '.glb' || 
        extension === '.b3dm' ||
        extension === '.i3dm' ||
        extension === '.pnts' ||
        extension === '.cmpt');
}
