'use strict';

var Promise = require('bluebird');
var Cesium = require('cesium');
var defined = Cesium.defined;
var Cartesian3 = Cesium.Cartesian3;
var Rectangle = Cesium.Rectangle;
var Cartographic = Cesium.Cartographic;

module.exports = validateVolume;

function validateVolume(tileset) {
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
    return (Rectangle.contains(tileRectangle,  Rectangle.northwest(contentRectangle, scratchCartographic))
        && Rectangle.contains(tileRectangle, Rectangle.southwest(contentRectangle, scratchCartographic))
        && Rectangle.contains(tileRectangle, Rectangle.northeast(contentRectangle, scratchCartographic))
        && Rectangle.contains(tileRectangle, Rectangle.southeast(contentRectangle, scratchCartographic)))
        && (maxContentHeight < maxTileHeight)
        && (minContentHeight > minTileHeight);
}

function sphereInsideSphere(contentSphere, tileSphere) {
    var contentRadius = contentSphere[3];
    var tileRadius = tileSphere[3];
    var contentCenter = Cartesian3.unpack(contentSphere, 0, scratchContentCartesian);
    var tileCenter = Cartesian3.unpack(tileSphere, 0, scratchTileCartesian);
    var distance = Cartesian3.distance(contentCenter, tileCenter);
    return distance  <= (tileRadius - contentRadius);
}

function sphereInsideRegion(contentSphere, tileRegion) {
    var contentRadius = contentSphere[3];
    Cartesian3.unpack(contentSphere, 0, scratchContentCartesian);
    Cartographic.fromCartesian(scratchContentCartesian, Cesium.Ellipsoid.WGS84, scratchCartographic);
    var tileRectangle = Rectangle.unpack(tileRegion, 0, scratchTileRectangle);
    var width = tileRegion[2] - tileRegion[0];
    var height = tileRegion[3] - tileRegion[1];
    return ((Rectangle.contains(tileRectangle, scratchCartographic)) &&
            (2*contentRadius <= width && 2*contentRadius <= height));
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
        var tileContent = tile.content;

        if (defined(tileContent) && defined(tileContent.boundingVolume)) {
            if (defined(tileContent.boundingVolume.region) && defined(tile.boundingVolume.region)) {
                var contentRegion = tileContent.boundingVolume.region;
                var tileRegion = tile.boundingVolume.region;

                if (!regionInsideRegion(contentRegion, tileRegion)) {
                    return resolve({
                        result: false,
                        message: 'Child bounding volume is not contained within parent'
                    });
                }
            }

            if (defined(tileContent.boundingVolume.sphere) && defined(tile.boundingVolume.sphere)) {
                var contentSphere = tileContent.boundingVolume.sphere;
                var tileSphere = tile.boundingVolume.sphere;
                if (!sphereInsideSphere(contentSphere, tileSphere)) {
                    return resolve({
                        result: false,
                        message: 'Child bounding volume is not contained within parent'
                    });
                }
            }

            if (defined(tileContent.boundingVolume.sphere) && defined(tile.boundingVolume.region)) {
                var contentSphere = tileContent.boundingVolume.sphere;
                var tileRegion = tile.boundingVolume.region;
                if (!sphereInsideRegion(contentSphere, tileRegion)) {
                    return resolve({
                        result: false,
                        message: 'Child bounding volume is not contained within parent'
                    });
                }
            }
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