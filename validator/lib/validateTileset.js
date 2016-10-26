'use strict';
var Promise = require('bluebird');

module.exports = validateTileset;

/**
 * Checks whether the geometricError of each tile is <= the geometric error of its parent tile.
 *
 * @param {JSON} The JSON object representing the tileset.
 * @return {Promise} A promise that resolves with two parameters - (1) a boolean for whether the tileset is valid
 *                                                                 (2) the error message if the tileset is not valid.
 *
 */
function validateTileset(tileset) {
    if (tileset.root.geometricError > tileset.geometricError) {
        return Promise.resolve(false, "Root has geometricError greater than tileset");
    }

    return new Promise(function(resolve, reject) {
        checkGeometricError(tileset.root, tileset.geometricError, resolve);
    });

}

function checkGeometricError(root, testError, resolve) {
    // If we have reached a leaf, stop
    if (root === undefined) {
        return;
    }
    // Condition for invalid tileset
    if (root.geometricError > testError) {
        return resolve(false, "Child has geometricError greater than parent");
    } else {
        // Call the function with each child
        for (var child in root.children) {
            checkGeometricError(child, root.testError);
        }
    }
}