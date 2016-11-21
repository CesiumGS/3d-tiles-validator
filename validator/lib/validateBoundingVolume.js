'use strict';

var Promise = require('bluebird');
var Cesium = require('cesium');
var defined = Cesium.defined;
var Rectangle = Cesium.Rectangle;
var Cartographic = Cesium.Cartographic;

module.exports = validateVolume;

function validateVolume(tileset) {
    return new Promise(function(resolve) {
        validateNode(tileset.root, tileset, resolve);
    });
}

var scratchCartographic = new Cartographic();

function regionInsideRegion(contentRect, tileRect) {
    return (Rectangle.contains(tileRect, Cartographic.fromRadians(contentRect.west,
        contentRect.north, 0.0, scratchCartographic))
    && Rectangle.contains(tileRect, Cartographic.fromRadians(contentRect.west,
        contentRect.south, 0.0, scratchCartographic))
    && Rectangle.contains(tileRect, Cartographic.fromRadians(contentRect.east,
        contentRect.north, 0.0, scratchCartographic))
    && Rectangle.contains(tileRect, Cartographic.fromRadians(contentRect.east,
        contentRect.south, 0.0, scratchCartographic)));
}

function sphereInsideSphere(contentSphere, tileSphere) {
    var contentSphereRadius = contentSphere[3];
    var tileRadius = tileSphere[3];
    var distance = CesiumMath.distance(Cartesian3.unpack(contentSphere, 0), Cartesian3.unpack(tileSphere, 0));
    if (Math.min(contentSphereRadius, tileRadius) == contentSphereRadius) {
        return ((distance + contentSphereRadius) <= tileRadius);
    } else {
        return false;
    }
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

                var contentRect = Rectangle.unpack(contentRegion, 0);
                var tileRect = Rectangle.unpack(tileRegion, 0);

                var maxRectHeight = contentRegion[5];
                var maxTileHeight = tileRegion[5];
                var minRectHeight = contentRegion[4];
                var minTileHeight = tileRegion[4];

                if (!regionInsideRegion(contentRect, tileRect) || (maxRectHeight > maxTileHeight) || (minRectHeight > minTileHeight)) {
                    return resolve({
                        result: false,
                        message: 'Child bounding volume is not contained within parent'
                    });
                }
            }

            if (defined(tileContent.boundingVolume.sphere) && defined(tile.boundingVolume.sphere)) {
                var sphere = tileContent.boundingVolume.sphere;
                var tileSphere = tile.boundingVolume.sphere;
                if (!sphereInsideSphere(sphere, tileSphere)) {
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