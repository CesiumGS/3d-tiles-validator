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
            var contentBV = content.boundingVolume;
            var tileBV = tile.boundingVolume;

            if (!checkBoundingVolume(contentBV, tileBV, Matrix4.IDENTITY, Matrix4.IDENTITY, 'RegioninRegion')) {
                return 'content region [' + contentBV.region + '] is not within tile region + [' + tileBV.region + ']';
            }

            if (!checkBoundingVolume(contentBV, tileBV, Matrix4.IDENTITY, Matrix4.IDENTITY, 'SphereinSphere')) {
                return 'content sphere [' + contentBV.sphere + '] is not within tile sphere + [' + tileBV.sphere + ']';
            }

            if (!checkBoundingVolume(contentBV, tileBV, Matrix4.IDENTITY, Matrix4.IDENTITY, 'BoxinBox')) {
                return 'content box [' + contentBV.box + '] is not within tile box [' + tileBV.box + ']';
            }

            if (!checkBoundingVolume(contentBV, tileBV, Matrix4.IDENTITY, Matrix4.IDENTITY, 'BoxinSphere')) {
                return 'content box [' + contentBV.box + '] is not within tile sphere [' + tileBV.sphere + ']';
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
        case 'BoxinBox':
            if(defined(tileBV.box) && defined(parentBV.box)) {
                var transformed_tileBox = getTransformedBox(tileBV.box, tileTransform);
                var transformed_parentBox = getTransformedBox(parentBV.box, parentTransform);
                returnBool = boxInsideBox(transformed_tileBox, transformed_parentBox);
            } else {
                returnBool = true;
            }
            break;
        case 'SphereinSphere':
            if(defined(tileBV.sphere) && defined(parentBV.sphere)) {
                var transformed_tileSphere = getTransformedSphere(tileBV.sphere, tileTransform);
                var transformed_parentSphere = getTransformedSphere(parentBV.sphere, parentTransform);
                returnBool = sphereInsideSphere(transformed_tileSphere, transformed_parentSphere);
            } else {
                returnBool = true;
            }
            break;
        case 'RegioninRegion':
            if(defined(tileBV.region) && defined(parentBV.region)) {
                // Region does not update with transform
                var transformed_tileRegion = tileBV.region;
                var transformed_parentRegion = parentBV.region;
                returnBool = regionInsideRegion(transformed_tileRegion, transformed_parentRegion);
            } else {
                returnBool = true;
            }
            break;
        case 'BoxinSphere':
            if(defined(tileBV.box) && defined(parentBV.sphere)) {
                var transformed_tileBox = getTransformedBox(tileBV.box, tileTransform);
                var transformed_parentSphere = getTransformedSphere(parentBV.sphere, parentTransform);
                returnBool = boxInsideSphere(transformed_tileBox, transformed_parentSphere);
            } else {
                returnBool = true;
            }
            break;
        default:
            returnBool = false;
            break;
    }

    return returnBool;
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