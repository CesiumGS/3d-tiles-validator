'use strict';

var clone = require('clone');
var readTileset = require('../../lib/readTileset');
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
                    "children": [
                        {
                            "boundingVolume": {
                                "region": [-1.3197209591796106, 0.6988424218, -1.31968, 0.698874, 0, 10]
                            },
                            "geometricError": 0
                        }
                    ]
                },
                {
                    "boundingVolume": {
                        "region": [-1.31968, 0.6988424218, -1.3196390408203893, 0.698874, 0, 20]
                    },
                    "geometricError": 0
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
                "region": [20, 40, 50, 55, 10, 88]
            },
            "content": {
                "boundingVolume": {
                    "region": [22, 45, 25, 50, 20, 30]
                }
            }
        }
    };

    it('validates region inside region', function (done) {
        expect(validateTileset(regionTileset)
            .then(function (response) {
                expect(response.result).toBe(true);
                expect(response.message).toBe('Tileset is valid');
            }), done).toResolve();
    });

    it('invalidates when a content region west exceeds the tile region', function (done) {
        var invalidTileset = clone(regionTileset);
        invalidTileset.root.content.boundingVolume.region[0] = 18;
        expect(validateTileset(invalidTileset)
            .then(function (response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child bounding volume is not contained within parent');
            }), done).toResolve();
    });

    it('invalidates when a content region south exceeds the tile region', function (done) {
        var invalidTileset = clone(regionTileset);
        invalidTileset.root.content.boundingVolume.region[1] = 35;
        expect(validateTileset(invalidTileset)
            .then(function (response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child bounding volume is not contained within parent');
            }), done).toResolve();
    });

    it('invalidates when a content region east exceeds the tile region', function (done) {
        var invalidTileset = clone(regionTileset);
        invalidTileset.root.content.boundingVolume.region[2] = 55;
        expect(validateTileset(invalidTileset)
            .then(function (response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child bounding volume is not contained within parent');
            }), done).toResolve();
    });

    it('invalidates when a content region north exceeds the tile region', function (done) {
        var invalidTileset = clone(regionTileset);
        invalidTileset.root.content.boundingVolume.region[3] = 65;
        expect(validateTileset(invalidTileset)
            .then(function (response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child bounding volume is not contained within parent');
            }), done).toResolve();
    });

    it('invalidates when content region max height exceeds tile region max height', function (done) {
        var invalidTileset = clone(regionTileset);
        invalidTileset.root.content.boundingVolume.region[5] = 100;
        expect(validateTileset(invalidTileset)
            .then(function (response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child bounding volume is not contained within parent');
            }), done).toResolve();
    });

    it('invalidates when tile region min height exceeds content region min height', function (done) {
        var invalidTileset = clone(regionTileset);
        invalidTileset.root.content.boundingVolume.region[4] = 5;
        expect(validateTileset(invalidTileset)
            .then(function (response) {
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

    it('validates a sphere inside sphere', function (done) {
        expect(validateTileset(sphereTileset)
            .then(function (response) {
                expect(response.result).toBe(true);
                expect(response.message).toBe('Tileset is valid');
            }), done).toResolve();
    });

    it('invalidates a sphere with large radius', function (done) {
        var invalidSphere = clone(sphereTileset);
        invalidSphere.root.content.boundingVolume.sphere[3] = 6;
        expect(validateTileset(invalidSphere)
            .then(function (response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child bounding volume is not contained within parent');
            }), done).toResolve();
    });

    it('invalidates a sphere with large distance', function (done) {
        var invalidSphere = clone(sphereTileset);
        invalidSphere.root.content.boundingVolume.sphere[2] = 6;
        expect(validateTileset(invalidSphere)
            .then(function (response) {
                expect(response.result).toBe(false);
                expect(response.message).toBe('Child bounding volume is not contained within parent');
            }), done).toResolve();
    });

    it('reads a valid tileset', function (done) {
        expect(readTileset('../specs/data/TilesetGzipped/tileset.json')
            .then(function (tileset) {
                expect(validateTileset(tileset)
                    .then(function (response) {
                        expect(response.result).toBe(true);
                        expect(response.message).toBe('Tileset is valid');
                    }), done).toResolve();
            }), done).toResolve();
    });
});
