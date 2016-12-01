'use strict';

var clone = require('clone');
var validateTileset = require('../../lib/validateTileset');
var validateBoundingVolume = require('../../lib/validateBoundingVolume');

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


describe('validateBoundingVolume', function() {
    var regionTileset = {
       "root": {
           "boundingVolume": {
               "region": [20, 40, 50, 10, 10, 88]
           },
           "content": {
               "boundingVolume": {
                   "region":  [18, 14, 15, 8, 20, 30]
               }
           }
       }
    };

    it('validates region inside region', function(done) {
        expect(validateBoundingVolume(regionTileset)
            .then(function(response) {
                expect(response.result).toBe(true);
                expect(response.message).toBe('Tileset is valid');
            }), done).toResolve();
    });

    it('invalidates when a content region exceeds the tile region', function(done) {
        var invalidTileset = clone(regionTileset);
        expect(validateBoundingVolume(invalidTileset)
            .then(function(response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child bounding volume is not contained within parent');
            }), done).toResolve();
    });

    it('invalidates when content region max height exceeds tile region max height', function(done) {
        var invalidTileset = clone(regionTileset);
        invalidTileset.root.content.boundingVolume.region[5] = 100;
        expect(validateBoundingVolume(invalidTileset)
            .then(function(response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child bounding volume is not contained within parent');
            }), done).toResolve();
    });

    it('invalidates when tile region min height exceeds content region min height', function(done) {
        var invalidTileset = clone(regionTileset);
        invalidTileset.root.content.boundingVolume.region[4] = 5;
        expect(validateBoundingVolume(invalidTileset)
            .then(function(response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child bounding volume is not contained within parent');
            }), done).toResolve();
    });

    var sphereTileset = {
        "root": {
            "boundingVolume": {
                "sphere": [0, 0, 0, 4]
            },
            "content": {
                "boundingVolume": {
                    "sphere": [0, 0, 0, 2]
                },
            }
        }
    };

    it('validates a sphere inside sphere', function(done) {
       expect(validateBoundingVolume(sphereTileset)
           .then(function(response) {
               expect(response.result).toBe(true);
               expect(response.message).toBe('Tileset is valid');
           }), done).toResolve();
    });

    it('invalidates a sphere with large radius', function(done) {
        var invalidSphere = clone(sphereTileset);
        invalidSphere.root.content.boundingVolume.sphere[3] = 6;
        expect(validateBoundingVolume(invalidSphere)
            .then(function(response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child bounding volume is not contained within parent');
            }), done).toResolve();
    });

    it('invalidates a sphere with large distance', function(done) {
        var invalidSphere = clone(sphereTileset);
        invalidSphere.root.content.boundingVolume.sphere[2] = 6;
        expect(validateBoundingVolume(invalidSphere)
            .then(function(response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child bounding volume is not contained within parent');
            }), done).toResolve();
    });

    

});
