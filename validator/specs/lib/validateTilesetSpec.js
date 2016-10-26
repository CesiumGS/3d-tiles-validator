'use strict';

var validateTileset = require('../../lib/validateTileset');
var clone = require('clone');

describe('validateTileset', function() {

    it('reads a valid JSON', function(done) {
        var tileset = {
            "asset": {
                "version": "0.0"
            },
            "geometricError": 240,
            "root": {
                "boundingVolume": {
                    "region": [-1.3197209591796106, 0.6988424218, -1.3196390408203893, 0.6989055782, 0, 88]
                },
                "geometricError": 70,
                "refine": "add",
                "children": [
                    {
                        "boundingVolume": {
                            "region": [-1.3197209591796106, 0.6988424218, -1.31968, 0.698874, 0, 20]
                        },
                        "geometricError": 50,
                        "content": {
                            "url": "a.b3dm"
                        },
                        "children": [
                            {
                                "boundingVolume": {
                                    "region": [-1.3197209591796106, 0.6988424218, -1.31968, 0.698874, 0, 10]
                                },
                                "geometricError": 0,
                                "content": {
                                    "url": "b.b3dm"
                                }
                            }
                        ]
                    },
                    {
                        "boundingVolume": {
                            "region": [-1.31968, 0.6988424218, -1.3196390408203893, 0.698874, 0, 20]
                        },
                        "geometricError": 0,
                        "content": {
                            "url": "c.b3dm"
                        }
                    }
                ]
            }
        };
        expect(validateTileset(tileset)).then(function(data) {
           expect(data[0]).toBeTruthy();
        });
    });

    it('reads an invalid JSON', function(done) {
        // TODO
    });

    it('reads an invalid JSON', function(done) {
        // TODO
    });

});