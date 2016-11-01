'use strict';

var Promise = require('bluebird');
var Cesium = require('cesium');
var defined = Cesium.defined;

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
        validateNode(tileset.root, tileset, resolve);
    });
}

function validateNode(root, parent, resolve) {
    var stack = [];
    stack.push({
          node: root,
          parent: parent
    });

    while (stack.length > 0) {
        var node = stack.pop();
        var tile = node.node;
        var parent = node.parent;

        if (tile.geometricError > parent.geometricError) {
            return resolve({
                result : false,
                message : 'Child has geometricError greater than parent'
            });
        }

        if (defined(tile.children)) {
            var length = tile.children.length;
            for (var i = 0; i < length; i++) {
                stack.push({
                    node: tile.children[i],
                    parent: tile
                });
            }
        }
    }
    return resolve({
        result : true,
        message : 'Tileset is valid'
    });
}