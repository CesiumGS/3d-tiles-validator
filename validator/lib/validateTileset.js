'use strict';

var Promise = require('bluebird');

module.exports = validateTileset;

/**
 * Walks down the tree represented by the JSON object and checks if it is a valid tileset.
 *
 * @param {Object} tileset The JSON object representing the tileset.
 * @return {Promise} A promise that resolves with two parameters - (1) a boolean for whether the tileset is valid
 *                                                                 (2) the error message if the tileset is not valid.
 *
 */
function validateTileset(tileset) {
    return new Promise(function(resolve) {
        validateNode(tileset.root, tileset.geometricError, resolve);
    });
}

function validateNode(root, parentGeometricError, resolve) {
    var stack = [];
    stack.push({'node': root, 'parentError': parentGeometricError});

    while (stack.length > 0) {

        var obj = stack.pop();

        if (typeof obj !== "undefined") {

            if (obj['node'].geometricError > obj['parentError']) {
                return resolve(false, 'Child has geometricError greater than parent');
            }

            if (typeof obj['node'].children !== "undefined") {
                var length = obj['node'].children.length;
                for (var i = 0; i < length; i++) {
                    if (typeof obj['node'].children[i] !== "undefined") {
                        stack.push({'node': obj['node'].children[i], 'parentError': obj['node'].geometricError});
                    }
                }
            }

        }

    }

    return resolve(true, '');
}