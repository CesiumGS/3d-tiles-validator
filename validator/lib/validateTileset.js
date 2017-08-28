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
var sphereInsideBox = utility.sphereInsideBox;
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

        var outerTransform;
        var innerTransform;
        var message;
        if (defined(content) && defined(content.boundingVolume)) {
            outerTransform = Matrix4.IDENTITY;
            if (defined(tile.transform)) {
                outerTransform = Matrix4.fromArray(tile.transform);
            }
            innerTransform = Matrix4.IDENTITY;
            message = checkBoundingVolume(content.boundingVolume, tile.boundingVolume, innerTransform, outerTransform);
            if (defined(message)) {
                return errorMessage('content bounding volume is not within tile bounding volume: ' + message, tile);
            }
        }

        if (defined(parent) && !defined(content)) {
            innerTransform = Matrix4.IDENTITY;
            if (defined(tile.transform)) {
                innerTransform = Matrix4.fromArray(tile.transform);
            }
            outerTransform = Matrix4.IDENTITY;
            if (defined(parent.transform)) {
                outerTransform = Matrix4.fromArray(parent.transform);
            }
            message = checkBoundingVolume(tile.boundingVolume, parent.boundingVolume, innerTransform, outerTransform);
            if (defined(message)) {
                return errorMessage('child bounding volume is not within parent bounding volume: ' + message, tile);
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

function checkBoundingVolume(innerBoundingVolume, outerBoundingVolume, innerTransform, outerTransform) {
    var message;
    var transformedInnerTile;
    var transformedOuterTile;

    if (defined(innerBoundingVolume.box) && defined(outerBoundingVolume.box)) {
        // Box in Box check
        transformedInnerTile = getTransformedBox(innerBoundingVolume.box, innerTransform);
        transformedOuterTile = getTransformedBox(outerBoundingVolume.box, outerTransform);
        if (!boxInsideBox(transformedInnerTile, transformedOuterTile)) {
            message = 'box [' + innerBoundingVolume.box + '] is not within box [' + outerBoundingVolume.box + ']';
        }
        return message;
    } else if (defined(innerBoundingVolume.sphere) && defined(outerBoundingVolume.sphere)) {
        // Sphere in Sphere
        transformedInnerTile = getTransformedSphere(innerBoundingVolume.sphere, innerTransform);
        transformedOuterTile = getTransformedSphere(outerBoundingVolume.sphere, outerTransform);
        if (!sphereInsideSphere(transformedInnerTile, transformedOuterTile)) {
            message = 'sphere [' + innerBoundingVolume.sphere + '] is not within sphere [' + outerBoundingVolume.sphere + ']';
            return message;
        }
        return message
    } else if (defined(innerBoundingVolume.region)&& defined(outerBoundingVolume.region)) {
        // Region in Region
        // Region does not update with transform
        transformedInnerTile = innerBoundingVolume.region;
        transformedOuterTile = outerBoundingVolume.region;
        if (!regionInsideRegion(transformedInnerTile, transformedOuterTile)) {
            message = 'region [' + innerBoundingVolume.region + '] is not within region [' + outerBoundingVolume.region + ']';
            return message;
        }
        return message;
    } else if (defined(innerBoundingVolume.box) && defined(outerBoundingVolume.sphere)) {
        // Box in Sphere
        transformedInnerTile = getTransformedBox(innerBoundingVolume.box, innerTransform);
        transformedOuterTile = getTransformedSphere(outerBoundingVolume.sphere, outerTransform);
        if (!boxInsideSphere(transformedInnerTile, transformedOuterTile)) {
            message = 'box [' + innerBoundingVolume.box + '] is not within sphere [' + outerBoundingVolume.sphere + ']';
            return message;
        }
        return message;
    } else if (defined(innerBoundingVolume.sphere) && defined(outerBoundingVolume.box)) {
        // Sphere in Box
        transformedInnerTile = getTransformedSphere(innerBoundingVolume.sphere, innerTransform);
        transformedOuterTile = getTransformedBox(outerBoundingVolume.box, outerTransform);
        if (!sphereInsideBox(transformedInnerTile, transformedOuterTile)) {
            message = 'sphere [' + innerBoundingVolume.sphere + '] is not within box [' + outerBoundingVolume.box + ']';
            return message;
        }
        return message;
    }
}

var scratchMatrix = new Matrix3();
var scratchHalfAxes = new Matrix3();
var scratchCenter = new Cartesian3();
var scratchScale = new Cartesian3();
function getTransformedBox(box, transform) {
    var center = Cartesian3.fromElements(box[0], box[1], box[2], scratchCenter);
    var halfAxes = Matrix3.fromArray(box, 3, scratchHalfAxes);

    // Find the transformed center and halfAxes
    center = Matrix4.multiplyByPoint(transform, center, center);
    var rotationScale = Matrix4.getRotation(transform, scratchMatrix);
    halfAxes = Matrix3.multiply(rotationScale, halfAxes, halfAxes);

    // Return a Box array
    var returnBox = [center.x, center.y, center.z, halfAxes[0], halfAxes[3], halfAxes[6], halfAxes[1], halfAxes[4], halfAxes[7], halfAxes[2], halfAxes[5], halfAxes[8]];
    return returnBox;
}

function getTransformedSphere(sphere, transform) {
    var center = Cartesian3.fromElements(sphere[0], sphere[1], sphere[2], scratchCenter);
    var radius = sphere[3];

    // Find the transformed center and radius
    center = Matrix4.multiplyByPoint(transform, center, center);
    var scale = Matrix4.getScale(transform, scratchScale);
    var uniformScale = Cartesian3.maximumComponent(scale);
    radius *= uniformScale;

    // Return a Sphere array
    var returnSphere = [center.x, center.y, center.z, radius];
    return returnSphere;
}

function errorMessage(originalMessage, tile) {
    delete tile.children;
    var stringJson = JSON.stringify(tile, undefined, 4);
    var newMessage = originalMessage + ' \n ' + stringJson;
    return newMessage;
}
