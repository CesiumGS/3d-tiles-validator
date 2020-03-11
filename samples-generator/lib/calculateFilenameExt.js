'use strict';
module.exports = calculateFilenameExt;

/**
 * Calculates the filename extension suffix based off flags
 * @param {Boolean} use3dTilesNext If the extension is for use3dTilesNext
 * @param {Boolean} useGlb If the extension is for 3d-tiles-next, and we want
 * to use glb.
 * @param {String} defaultExt If use3dTilesNext and useGlb are both false,
 * then use defaultExt
 */

function calculateFilenameExt(use3dTilesNext, useGlb, defaultExt) {
    if (use3dTilesNext && !useGlb) {
        return '.gltf';
    } else if (useGlb) {
        return '.glb';
    }
    return defaultExt;
}