'use strict';
var fs = require('fs');
var path = require('path');
var nestingBoxPath = path.join(__dirname, '..', 'data', 'nestingBoxes.gltf');
var originalNestingBoxGltf = JSON.parse(fs.readFileSync(nestingBoxPath, 'utf8'));
var injectTranslationNodeToGltf = require('../../lib/injectTranslationNodeToGltf');

describe('injectTranslationNodeToGltfSpec', function() {
    var rtcCenter = [1, 2, 3];
    var rootNodeName = 'RTC_CENTER';
    var nestingBoxesWithRootTranslationNode = injectTranslationNodeToGltf(originalNestingBoxGltf, rootNodeName, rtcCenter);
    var lastNode = nestingBoxesWithRootTranslationNode.nodes[nestingBoxesWithRootTranslationNode.nodes.length - 1];

    it('root translation node is appended to gltf.nodes', function() {
        expect(lastNode.name).toEqual(rootNodeName);
    });

    it('root translation node has translation key equal to rtcCenter', function() {
        expect(lastNode.translation).toEqual(rtcCenter);
    });

    it('root translation has a single child pointing to the largest box in the nestingBoxes gltf', function() {
        expect(lastNode.children.length).toEqual(1);
        expect(lastNode.children[0]).toEqual(2);
    });

    it('gltf nodes with multiple root nodes / orphans are supported', function() {
        var gltfWithComplexNodes = {
            nodes: [                        //  A-B-C       |--rtcCenter-|
                {name: 'A', children: [3]}, //  |   |   ->  |     |      |
                {name: 'B'},                //  D   E       A     B      C
                {name: 'C', children: [4]}, //              |            |
                {name: 'D'},                //              D            E
                {name: 'E'}
            ]
        };

        gltfWithComplexNodes = injectTranslationNodeToGltf(gltfWithComplexNodes, rootNodeName, rtcCenter);
        var complexRoot = gltfWithComplexNodes.nodes[gltfWithComplexNodes.nodes.length - 1];
        expect(gltfWithComplexNodes.nodes.length).toEqual(6);
        expect(complexRoot.children).toEqual([0, 1, 2]);
    });

    it('injecting a translation node with a valid parentIndex', function() {
        var gltfWithComplexNodes = {
            nodes: [                              //  --A--         A
                {name: 'A', children: [1, 2, 3]}, //  | | | ->      |
                {name: 'B'},                      //  B C D      --rtc--
                {name: 'C'},                      //             |  -  |
                {name: 'D'},                      //             B  C  D
            ]
        };

        gltfWithComplexNodes = injectTranslationNodeToGltf(gltfWithComplexNodes, rootNodeName, rtcCenter, 0);
        var realRoot = gltfWithComplexNodes.nodes[0];
        var injectedRoot = gltfWithComplexNodes.nodes[gltfWithComplexNodes.nodes.length - 1];
        expect(injectedRoot.children).toEqual([1, 2, 3]);
        expect(realRoot.children).toEqual([gltfWithComplexNodes.nodes.length - 1]);
    });
});
