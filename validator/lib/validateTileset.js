'use strict';

var Promise = require('bluebird');
var Cesium = require('cesium');
var defined = Cesium.defined;
var readTile = require('../lib/readTile');
var validateB3dm = require('../lib/validateB3dm');
var validateI3dm = require('../lib/validateI3dm');
var validatePnts = require('../lib/validatePnts');
var Cartesian3 = Cesium.Cartesian3;
var Rectangle = Cesium.Rectangle;
var Cartographic = Cesium.Cartographic;

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

var scratchCartographic = new Cartographic();
var scratchContentCartesian = new Cartesian3();
var scratchTileCartesian = new Cartesian3();
var scratchContentRectangle = new Rectangle();
var scratchTileRectangle = new Rectangle();

function regionInsideRegion(contentRegion, tileRegion) {
    var contentRectangle = Rectangle.unpack(contentRegion, 0, scratchContentRectangle);
    var tileRectangle = Rectangle.unpack(tileRegion, 0, scratchTileRectangle);
    var maxContentHeight = contentRegion[5];
    var minContentHeight = contentRegion[4];
    var maxTileHeight = tileRegion[5];
    var minTileHeight = tileRegion[4];
    return (Rectangle.contains(tileRectangle,  Rectangle.northwest(contentRectangle, scratchCartographic)) &&
        Rectangle.contains(tileRectangle, Rectangle.southwest(contentRectangle, scratchCartographic)) &&
        Rectangle.contains(tileRectangle, Rectangle.northeast(contentRectangle, scratchCartographic)) &&
        Rectangle.contains(tileRectangle, Rectangle.southeast(contentRectangle, scratchCartographic))) &&
        (maxContentHeight <= maxTileHeight) && (minContentHeight >= minTileHeight);
}

function sphereInsideSphere(contentSphere, tileSphere) {
    var contentRadius = contentSphere[3];
    var tileRadius = tileSphere[3];
    var contentCenter = Cartesian3.unpack(contentSphere, 0, scratchContentCartesian);
    var tileCenter = Cartesian3.unpack(tileSphere, 0, scratchTileCartesian);
    var distance = Cartesian3.distance(contentCenter, tileCenter);
    return distance <= (tileRadius - contentRadius);
}

function validateContent(tilePromises, tileContent) {
    tilePromises.push(readTile(tileContent.url)
        .then(function(tileBuffer) {
            if (defined(tileBuffer)) {
                var magic = tileBuffer.toString('utf8', 0, 4);
                if (magic === 'b3dm') {
                    var validateB3dmTest = validateB3dm(tileBuffer);
                    if (!validateB3dmTest.result) {
                        resolve({
                            result: false,
                            message: 'invalid b3dm'
                        });
                    }
                } else if (magic === 'i3dm') {
                    var validateI3dmTest = validateI3dm(tileBuffer);
                    if (!validateI3dmTest.result) {
                        resolve({
                            result: false,
                            message: 'invalid i3dm'
                        });
                    }
                } else if (magic === 'pnts') {
                    var validatePntsTest = validatePnts(tileBuffer);
                    if (!validatePntsTest.result) {
                        resolve({
                            result: false,
                            message: 'invalid pnts'
                        });
                    }
                }
            }
        }));
}

function validateNode(root, parent, resolve) {
    var tilePromises = [];

    var stack = [];
    stack.push({
        node: root,
        parent: parent
    });

    while (stack.length > 0) {
        var node = stack.pop();
        var tile = node.node;
        var tileContent = tile.content;
        var nodeParent = node.parent;

        if (defined(tile.content)) {
            if (defined(tile.content.boundingVolume)) {
                var region = tile.content.boundingVolume.region;
                var parentRegion = tile.boundingVolume.region;
                for (var i = 0; i < region.length; i++) {
                    if (region[i] > parentRegion[i]) {
                        resolve({
                            result: false,
                            message: 'Child occupies region greater than parent'
                        });
                    }
                }
            }
        }

        if (defined(tile.content) && defined(tile.content.url)) {
            validateContent(tilePromises, tile.content);
        }

        if (defined(tileContent) && defined(tileContent.boundingVolume)) {
            var contentRegion = tileContent.boundingVolume.region;
            var tileRegion = tile.boundingVolume.region;
            var contentSphere = tileContent.boundingVolume.sphere;
            var tileSphere = tile.boundingVolume.sphere;

            if (defined(contentRegion) && defined(tileRegion)) {
                if (!regionInsideRegion(contentRegion, tileRegion)) {
                    return resolve({
                        result: false,
                        message: 'Child bounding volume is not contained within parent'
                    });
                }
            }

            if (defined(contentSphere) && defined(tileSphere)) {
                if (!sphereInsideSphere(contentSphere, tileSphere)) {
                    return resolve({
                        result: false,
                        message: 'Child bounding volume is not contained within parent'
                    });
                }
            }
        }

        if (tile.geometricError > nodeParent.geometricError) {
             resolve({
                result : false,
                message : 'Child has geometricError greater than parent'
            });
        }

        if (defined(tile.children)) {
            var length = tile.children.length;
            for (var j = 0; j < length; j++) {
                stack.push({
                    node: tile.children[j],
                    parent: tile
                });
            }
        }
    }

    Promise.all(tilePromises).then(function() {
        return resolve({
            result : true,
            message : 'Tileset is valid'
        });
    });
}
