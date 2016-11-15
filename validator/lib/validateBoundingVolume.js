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

                    var rect = Cesium.Rectangle(region[0], region[1], region[2], region[3]);
                    var tileRectangle = Cesium.Rectangle(tileRegion[0], tileRegion[1], tileRegion[2], tileRegion[3]);
                    var maxHeight = region[5];

                    if(rect.contains(tileRectangle, Cartographic(rect.west, rect.north, maxHeight))) {

                    } else if (rect.contains(tileRectangle, Cartographic(rect.west, rect.south, maxHeight))) {

                    } else if (rect.contains(tileRectangle, Cartographic(rect.east, rect.north, maxHeight))) {

                    } else if (rect.contains(tileRectangle, Cartographic(rect.east, rect.south, maxHeight))) {

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