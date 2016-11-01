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

    it('validates a valid JSON', function(done) {
        expect(validateTileset(tileset)
            .then(function(response) {
                expect(response.result).toBe(true);
                expect(response.message).toBe('Tileset is valid');
            }), done).toResolve();
    });

    it('validates an invalid JSON', function(done) {
        var invalidTileset = clone(tileset);
        invalidTileset.root.children[0].children[0].geometricError = 100;
        expect(validateTileset(invalidTileset)
            .then(function(response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child has geometricError greater than parent');
            }), done).toResolve();
    });

    it('validates an invalid JSON', function(done) {
        var invalidTileset = clone(tileset);
        invalidTileset.root.geometricError = 300;
        expect(validateTileset(invalidTileset)
            .then(function(response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child has geometricError greater than parent');
            }), done).toResolve();
    });
});
