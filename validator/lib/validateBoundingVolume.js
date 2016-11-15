'use strict';

var Promise = require('bluebird');
var Cesium = require('cesium');
var defined = Cesium.defined;

module.exports = validateVolume;

function validateVolume(tileset) {
    return new Promise(function(resolve) {
        validateNode(tileset.root, tileset, resolve);
    });
}

var scratchCartographic = new Cartographic();
var scratchRect;
var scratchTileRect;

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

        if (defined(tile.content)) {
            if (defined(tile.content.boundingVolume)) {
                if (defined(tile.content.boundingVolume.region) && defined(tile.boundingVolume.region)) {
                    var region = tile.content.boundingVolume.region;
                    var tileRegion = tile.boundingVolume.region;

                    Cesium.Rectangle.fromDegrees(region[0], region[1], region[2], region[3], scratchRect);
                    Cesium.Rectangle.fromDegrees(tileRegion[0], tileRegion[1], tileRegion[2], tileRegion[3],
                                                scratchTileRect);

                    var maxRectHeight = region[5];
                    var maxTileHeight = tileRegion[5];

                    if (Rectangle.contains(scratchTileRect, Cartographic.fromRadians(scratchRect.west,
                                                                scratchRect.north, 0.0, scratchCartographic))
                        && Rectangle.contains(scratchTileRect, Cartographic.fromRadians(scratchRect.west,
                                                                scratchRect.south, 0.0, scratchCartographic))
                        && Rectangle.contains(scratchTileRect, Cartographic.fromRadians(scratchRect.east,
                                                                scratchRect.north, 0.0, scratchCartographic))
                        && Rectangle.contains(scratchTileRect, Cartographic.fromRadians(scratchRect.east,
                                                                scratchRect.south, 0.0, scratchCartographic))) {
                        continue;
                    } else {
                        return resolve({
                            result: false,
                            message: 'Child bounding volume is not contained within parent'
                        });
                    }
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