'use strict';

var clone = require('clone');
var validateTileset = require('../../lib/validateTileset');

describe('validateTileset', function() {
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

    it('reads a valid JSON', function(done) {
        expect(validateTileset(tileset)
            .then(function(result, errorMessage) {
           expect(result).toBe(true);
        }), done).toResolve();
    });

    var invalidTileset = clone(tileset);
    invalidTileset.root.children[0].children[0].geometricError = 100;

    it('reads an invalid JSON', function(done) {
        expect(validateTileset(invalidTileset)
            .then(function(result, errorMessage) {
                expect(result).toBe(false);
                expect(errorMessage).toBe('Child has geometricError greater than parent');
            }), done).toResolve();
    });

    invalidTileset = clone(tileset);
    invalidTileset.root.geometricError = 300;

    it('reads an invalid JSON', function(done) {
        expect(validateTileset(invalidTileset)
            .then(function(result, errorMessage) {
                expect(result).toBe(false);
                expect(errorMessage).toBe('Child has geometricError greater than parent');
            }), done).toResolve();
    });

});