'use strict';
var Cesium = require('cesium');
var defined  = Cesium.defined;
module.exports = injectTranslationNodeToGltf;

/**
 * Returns a list of root nodes by index
 * @param {Array.<Object>} nodes gltf nodes
 * @returns A list of integral keys where each key corresponds to
 *          an element in the nodes tree that is definitely a root
 *          (no other node claims it as a child).
 */

function getRootNodesInGltf(nodes) {
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

    return Object.keys(potentialRoot)
                 .map(function(v) { return parseInt(v); })
                 .sort();
}

/**
 * Inserts a translation node at the root or underneath the specified
 * parentIndex if provided.
 * @param {Object} gltf The GLTF asset to modify
 * @param {Array<number>} translationVector XYZ translation value
 * @param {Number=} parentIndex Optional parent index for the new node.
 *                              The injected translation node will become the sole child
 *                              of the provided parent, and orphaned children
 *                              will be 'adopted' by the injected translation node.
 *                              of being placed at the root.
 * @returns {Object} The modified GLTF asset.
 */

function injectTranslationNodeToGltf(gltf, rootNodeName, translationVector, parentIndex) {
    if (!defined(gltf.nodes) || gltf.nodes.length < 1) {
        throw new Error('gltf.nodes must be defined and have at least 1 node.');
    }

    var translationNode = {
        name: rootNodeName,
        translation: translationVector,
    };

    if (defined(parentIndex)) {
        var parent = gltf.nodes[parentIndex];
        if (!defined(parent)) {
            throw new Error('Cannot add translation root to non existent parentIndex: ' + parentIndex);
        }

        // Make the old parent's sole child the injected node, and the injected node's children
        // the parent's old children.
        var parentsChildren = parent.children;
        parent.children = [gltf.nodes.length];
        if (defined(parentsChildren)) {
            translationNode.children = parentsChildren;
        }
    }

    else {
        translationNode.children = getRootNodesInGltf(gltf.nodes);
    }

    gltf.nodes.push(translationNode);
    return gltf;
}