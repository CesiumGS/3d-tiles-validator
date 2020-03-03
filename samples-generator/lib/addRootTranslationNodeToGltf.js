'use strict';
var Cesium = require('cesium');
var defined  = Cesium.defined;
module.exports = addRootTranslationNodeToGltf;

/**
 * Adorns a GLTF file with a RTC center.
 * @param {Object} gltf The GLTF asset to modify
 * @param {Array<number>} rtcCenter XYZ of the rtcCenter
 * @returns {Object} The modified GLTF asset.
 */

function addRootTranslationNodeToGltf(gltf, rootNodeName, rtcCenter) {
    if (!defined(gltf.nodes) || gltf.nodes.length < 1) {
        throw new Error('gltf.nodes must be defined and have at least 1 node.');
    }
    var nodes = gltf.nodes;
    var translationNode = {
        name: rootNodeName,
        translation: rtcCenter,
        children: []
    };


    var i = 0;
    var potentialRoot = {};
    for (; i < nodes.length; ++i) {
        potentialRoot[i] = true;
    }

    // filter potentialRoots to only contain keys that correspond to root indices in gltf.nodes
    for (i = 0; i < nodes.length; ++i) {
        for (var j = 0; defined(nodes[i].children) && j < nodes[i].children.length; ++j) {
            if (nodes[i].children[j] in potentialRoot) {
                delete potentialRoot[nodes[i].children[j]];
            }
        }
    }

    translationNode.children = Object.keys(potentialRoot).map(function(v) { return parseInt(v); }).sort();
    if (translationNode.children.length < 1) {
        throw new Error('Should have at least one child node.');
    }

    nodes.push(translationNode);
    return gltf;
}