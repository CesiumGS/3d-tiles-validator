'use strict';
var Promise = require('bluebird');
var Cesium = require('cesium');
var path = require('path');
var isTile = require('../lib/isTile');
var readTile = require('../lib/readTile');
var readTileset = require('../lib/readTileset');
var utility = require('../lib/utility');
var validateTile = require('../lib/validateTile');

var regionInsideRegion = utility.regionInsideRegion;
var sphereInsideSphere = utility.sphereInsideSphere;

var defined = Cesium.defined;

module.exports = validateTileset;

/**
 * Check if a tileset is valid, including the tileset JSON and all tiles referenced within.
 *
 * @param {Object} tileset The tileset JSON.
 * @param {String} tilesetDirectory The directory that all paths in the tileset JSON are relative to.
 * @return {Promise} A promise that resolves when the validation completes. If the validation fails, the promise will resolve to an error message.
 */
function validateTileset(tileset, tilesetDirectory) {
    var message = validateTopLevel(tileset);
    if (defined(message)) {
        return Promise.resolve(message);
    }

    return Promise.resolve(validateTileHierarchy(tileset.root, tilesetDirectory));
}

function validateTopLevel(tileset) {
    if (!defined(tileset.geometricError)) {
        return errorMessage('Tileset must declare its geometricError as a top-level property.', undefined);
    }

    if (!defined(tileset.root.refine)) {
        return errorMessage('Tileset must define refine property in root tile', tileset.root);
    }

    if (!defined(tileset.asset)) {
        return errorMessage('Tileset must declare its asset as a top-level property.', undefined);
    }

    if (!defined(tileset.asset.version)) {
        return errorMessage('Tileset must declare a version in its asset property', undefined);
    }

    if (tileset.asset.version !== '1.0') {
        return 'Tileset version must be 1.0. Tileset version provided: ' + tileset.asset.version;
    }

    var gltfUpAxis = tileset.asset.gltfUpAxis;
    if (defined(gltfUpAxis)) {
            if (gltfUpAxis !== 'X' && gltfUpAxis !== 'Y' && gltfUpAxis !== 'Z') {
            delete tileset.root;
            return errorMessage('gltfUpAxis should either be "X", "Y", or "Z".', tileset);
        }
    }
}

function validateTileHierarchy(root, tilesetDirectory) {
    var contentPaths = [];

    var stack = [];
    stack.push({
        tile : root,
        parent : undefined
    });

    while (stack.length > 0) {
        var node = stack.pop();
        var tile = node.tile;
        var parent = node.parent;
        var content = tile.content;

        if (!defined(tile.geometricError)) {
            return errorMessage('Each tile must define geometricError', tile);
        }

        if (tile.geometricError < 0.0) {
            return errorMessage('geometricError must be greater than or equal to 0.0', tile);
        }

        if (defined(parent) && (tile.geometricError > parent.geometricError)) {
            return errorMessage('Child has geometricError greater than parent', tile);
        }

        if (defined(content) && defined(content.url)) {
            contentPaths.push(path.join(tilesetDirectory, content.url));
        }

        if (defined(content) && defined(content.boundingVolume)) {
            var contentRegion = content.boundingVolume.region;
            var contentSphere = content.boundingVolume.sphere;
            var tileRegion = tile.boundingVolume.region;
            var tileSphere = tile.boundingVolume.sphere;

            if (defined(contentRegion) && defined(tileRegion) && !regionInsideRegion(contentRegion, tileRegion)) {
                return errorMessage('content region [' + contentRegion + '] is not within tile region + [' + tileRegion + ']', tile.content);
            }

            if (defined(contentSphere) && defined(tileSphere) && !sphereInsideSphere(contentSphere, tileSphere)) {
                return errorMessage('content sphere [' + contentSphere + '] is not within tile sphere + [' + tileSphere + ']', tile.content);
            }
        }

        if (defined(tile.refine)) {
            if (tile.refine !== 'ADD' && tile.refine !== 'REPLACE') {
                return errorMessage('Refine property in tile must have either "ADD" or "REPLACE" as its value.', tile);
            }
        }

        var children = tile.children;
        if (defined(children)) {
            var length = children.length;
            for (var i = 0; i < length; i++) {
                stack.push({
                    tile : children[i],
                    parent : tile
                });
            }
        }
    }

    return Promise.map(contentPaths, function(contentPath) {
        if (isTile(contentPath)) {
            return readTile(contentPath)
                .then(function(content) {
                    return validateTile(content);
                })
                .catch(function(error) {
                    return 'Could not read file: ' + error.message;
                });
        }
        return readTileset(contentPath)
            .then(function(tileset) {
                return validateTileset(tileset, path.dirname(contentPath));
            })
            .catch(function(error) {
                return 'Could not read file: ' + error.message;
            });
    })
        .then(function(messages) {
            var message = '';
            var length = messages.length;
            for (var i = 0; i < length; ++i) {
                if (defined(messages[i])) {
                    message += 'Error in ' + contentPaths[i] + ': ' + messages[i] + '\n';
                }
            }
            if (message === '') {
                return undefined;
            }
            return message;
        });
}

function errorMessage(originalMessage, tile) {
    if (defined(tile)) {
        delete tile.children;
        var stringJson = JSON.stringify(tile, undefined, 4);
        var newMessage = originalMessage + ' \n ' + stringJson;
        return newMessage;
    } else {
        return originalMessage;
    }
}