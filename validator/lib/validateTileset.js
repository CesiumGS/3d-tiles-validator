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
var boxInsideBox = utility.boxInsideBox;
var boxInsideSphere = utility.boxInsideSphere;
var Matrix4 = Cesium.Matrix4;
var Cartesian3 = Cesium.Cartesian3;
var Matrix3 = Cesium.Matrix3;
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
        return 'Tileset must declare its geometricError as a top-level property.';
    }

    if (!defined(tileset.root.refine)) {
        return 'Tileset must define refine property in root tile';
    }

    if (!defined(tileset.asset)) {
        return 'Tileset must declare its asset as a top-level property.';
    }

    if (!defined(tileset.asset.version)) {
        return 'Tileset must declare a version in its asset property';
    }

    if (tileset.asset.version !== '1.0') {
        return 'Tileset version must be 1.0. Tileset version provided: ' + tileset.asset.version;
    }

    var gltfUpAxis = tileset.asset.gltfUpAxis;
    if (defined(gltfUpAxis)) {
        if (gltfUpAxis !== 'X' && gltfUpAxis !== 'Y' && gltfUpAxis !== 'Z') {
            return 'gltfUpAxis should either be "X", "Y", or "Z".';
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
            return 'Each tile must define geometricError';
        }

        if (tile.geometricError < 0.0) {
            return 'geometricError must be greater than or equal to 0.0';
        }

        if (defined(parent) && (tile.geometricError > parent.geometricError)) {
            return 'Child has geometricError greater than parent';
        }

        if (defined(content) && defined(content.url)) {
            contentPaths.push(path.join(tilesetDirectory, content.url));
        }

        if (defined(content) && defined(content.boundingVolume)) {
            var contentRegion = content.boundingVolume.region;
            var contentSphere = content.boundingVolume.sphere;
            var contentBox = content.boundingVolume.box;
            var tileRegion = tile.boundingVolume.region;
            var tileSphere = tile.boundingVolume.sphere;
            var tileBox = tile.boundingVolume.box;

            if (defined(contentRegion) && defined(tileRegion) && !regionInsideRegion(contentRegion, tileRegion)) {
                return 'content region [' + contentRegion + '] is not within tile region + [' + tileRegion + ']';
            }

            if (defined(contentSphere) && defined(tileSphere) && !sphereInsideSphere(contentSphere, tileSphere)) {
                return 'content sphere [' + contentSphere + '] is not within tile sphere + [' + tileSphere + ']';
            }

            if (defined(contentBox) && defined(tileBox) && !boxInsideBox(contentBox, tileBox)) {
                return 'content box [' + contentBox + '] is not within tile box [' + tileBox + ']';
            }

            if (defined(contentBox) && defined(tileSphere) && !boxInsideSphere(contentBox, tileSphere)) {
                return 'content box [' + contentBox + '] is not within tile sphere [' + tileSphere + ']';
            }
        }

        if (defined(parent) && !defined(content) && defined(tile.boundingVolume) && defined(parent.boundingVolume)) {
            var tileBV = tile.boundingVolume;
            var parentBV = parent.boundingVolume;
            var tileTransform = Matrix4.IDENTITY;
            if(defined(tile.transform)) {
                tileTransform = tile.transform;
            }
            var parentTransform = Matrix4.IDENTITY;
            if(defined(parent.transform)) {
                parentTransform = parent.transform;
            }

            if(defined(tileBV) && defined(parentBV) && !checkBoundingVolume(tileBV, parentBV, tileTransform, parentTransform, 'BoxinBox')) {
                return 'tile box [' + tileBV.box + '] is not within parent box [' + parentBV.box + ']';
            }    
        }

        if (defined(tile.refine)) {
            if (tile.refine !== 'ADD' && tile.refine !== 'REPLACE') {
                return 'Refine property in tile must have either "ADD" or "REPLACE" as its value.';
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

function checkBoundingVolume(tileBV, parentBV, tileTransform, parentTransform, type) {
    var returnBool;
    switch(type) {
        case "BoxinBox":
            var transformed_tileBox = getTransformedBox(tileBV.box, tileTransform);
            var transformed_parentBox = getTransformedBox(parentBV.box, parentTransform);
            returnBool = boxInsideBox(transformed_tileBox, transformed_parentBox);
            break;
        default: 
            returnBool = false;
            break;
    }

    return returnBool;
}

function getTransformedBox(box, transform) {
    var scratchMatrix = new Matrix3();
    var scratchScale = new Cartesian3();
    var scratchHalfAxes = new Matrix3();
    var scratchCenter = new Cartesian3();

    var center = Cartesian3.fromElements(box[0], box[1], box[2], scratchCenter);
    var halfAxes = Matrix3.fromArray(box, 3, scratchHalfAxes);

    // Find the transformed center and halfAxes
    center = Matrix4.multiplyByPoint(transform, center, center);
    var rotationScale = Matrix4.getRotation(transform, scratchMatrix);
    halfAxes = Matrix3.multiply(rotationScale, halfAxes, halfAxes);

    // Return a Box array
    var returnBox = [center[0], center[1], center[2], halfAxes[0], halfAxes[3], halfAxes[6], halfAxes[1], halfAxes[4], halfAxes[7], halfAxes[2], halfAxes[5], halfAxes[8]];
    return returnBox;
}