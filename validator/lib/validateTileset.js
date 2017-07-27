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
            var contentBV = content.boundingVolume;
            var tileBV = tile.boundingVolume;
            var tileTransform = Matrix4.IDENTITY;
            if(defined(tile.transform)) {
                tileTransform = Matrix4.fromArray(tile.transform);
            }
            var contentTransform = Matrix4.IDENTITY;
            if(defined(content.transform)) {
                contentTransform = Matrix4.fromArray(content.transform);
            }
            var message = undefined;

            message = checkBoundingVolume(contentBV, tileBV, contentTransform, tileTransform);
            if(defined(message)) {
                return 'content bounding volume is not within tile bounding volume: ' + message;
            }
        }

        if (defined(parent) && !defined(content) && defined(tile.boundingVolume) && defined(parent.boundingVolume)) {
            var tileBV = tile.boundingVolume;
            var parentBV = parent.boundingVolume;
            var tileTransform = Matrix4.IDENTITY;
            if(defined(tile.transform)) {
                tileTransform = Matrix4.fromArray(tile.transform);
            }
            var parentTransform = Matrix4.IDENTITY;
            if(defined(parent.transform)) {
                parentTransform = Matrix4.fromArray(parent.transform);
            }
            var message = undefined;

            message = checkBoundingVolume(tileBV, parentBV, tileTransform, parentTransform);
            if(defined(message)) {
                return 'child bounding volume is not within parent bounding volume: ' + message;
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

function checkBoundingVolume(tileBV, parentBV, tileTransform, parentTransform) {
    var returnString = undefined;

    if (defined(tileBV) && defined(parentBV) && (defined(tileBV.box) || defined(tileBV.sphere) || defined(tileBV.region)) && (defined(parentBV.box) || defined(parentBV.sphere) || defined(parentBV.region))) {
        if (defined(tileBV.box) && defined(parentBV.box)) {
            // Box in Box check
            var transformed_tileBox = getTransformedBox(tileBV.box, tileTransform);
            var transformed_parentBox = getTransformedBox(parentBV.box, parentTransform);
            if (boxInsideBox(transformed_tileBox, transformed_parentBox) !== true) {
                returnString = 'box [' + tileBV.box + '] is not within box [' + parentBV.box + ']';
                return returnString;
            } else {
                return returnString;
            }
        } else if (defined(tileBV.sphere) && defined(parentBV.sphere)) {
            // Sphere in Sphere
            var transformed_tileSphere = getTransformedSphere(tileBV.sphere, tileTransform);
            var transformed_parentSphere = getTransformedSphere(parentBV.sphere, parentTransform);
            if (sphereInsideSphere(transformed_tileSphere, transformed_parentSphere) !== true) {
                returnString = 'sphere [' + tileBV.sphere + '] is not within sphere [' + parentBV.sphere + ']';
                return returnString;
            } else {
                return returnString;
            }
        } else if (defined(tileBV.region)&& defined(parentBV.region)) {
            // Region in Region
            // Region does not update with transform
            var transformed_tileRegion = tileBV.region;
            var transformed_parentRegion = parentBV.region;
            if (regionInsideRegion(transformed_tileRegion, transformed_parentRegion) !== true) {
                returnString = 'region [' + tileBV.region + '] is not within region [' + parentBV.region + ']';
                return returnString;
            } else {
                return returnString;
            }
        } else if (defined(tileBV.box) && defined(parentBV.sphere)) {
            // Box in Sphere
            var transformed_tileBox = getTransformedBox(tileBV.box, tileTransform);
            var transformed_parentSphere = getTransformedSphere(parentBV.sphere, parentTransform);
            if (boxInsideSphere(transformed_tileBox, transformed_parentSphere) !== true) {
                returnString = 'box [' + tileBV.box + '] is not within sphere [' + parentBV.sphere + ']';
                return returnString;
            } else {
                return returnString;
            }
        } else if (defined(tileBV.sphere) && defined(parentBV.box)) {
            // Sphere in Box
            var transformed_tileSphere = getTransformedSphere(tileBV.sphere, tileTransform);
            var transformed_parentBox = getTransformedBox(parentBV.box, parentTransform);
            if (sphereInsideBox(transformed_tileSphere, transformed_parentBox) !== true) {
                returnString = 'sphere [' + tileBV.sphere + '] is not within box [' + parentBV.box + ']';
                return returnString;
            } else {
                return returnString;
            }
        } else {
            // Add more test cases here!
            return returnString;
        }
    } else {
        return returnString;
    }
}

function getTransformedBox(box, transform) {
    var scratchMatrix = new Matrix3();
    var scratchHalfAxes = new Matrix3();
    var scratchCenter = new Cartesian3();

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
    var scratchScale = new Cartesian3();
    var scratchCenter = new Cartesian3();

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