'use strict';
var Cesium = require('cesium');
var validateTileset = require('../../lib/validateTileset');

var clone = Cesium.clone;

var sampleTileset = {
    asset: {
        version: '1.0'
    },
    geometricError: 240,
    root: {
        boundingVolume: {
            region: [-1.3197209591796106, 0.6988424218, -1.3196390408203893, 0.6989055782, 0, 88]
        },
        geometricError: 70,
        refine: 'ADD',
        children: [
            {
                boundingVolume: {
                    region: [-1.3197209591796106, 0.6988424218, -1.31968, 0.698874, 0, 20]
                },
                geometricError: 50,
                children: [
                    {
                        boundingVolume: {
                            region: [-1.3197209591796106, 0.6988424218, -1.31968, 0.698874, 0, 10]
                        },
                        geometricError: 0
                    }
                ]
            },
            {
                boundingVolume: {
                    region: [-1.31968, 0.6988424218, -1.3196390408203893, 0.698874, 0, 20]
                },
                geometricError: 0
            }
        ]
    }
};

describe('validateTileset', function() {
    it('succeeds for valid tileset', function(done) {
        var tileset = clone(sampleTileset, true);
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBeUndefined();
            }), done).toResolve();
    });

    it('returns error message when the top-level geometricError is missing', function(done) {
        var tileset = clone(sampleTileset, true);
        delete tileset.geometricError;
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('Tileset must declare its geometricError as a top-level property.');
            }), done).toResolve();
    });

    it('returns error message when the top-level asset is missing', function(done) {
        var tileset = clone(sampleTileset, true);
        delete tileset.asset;
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('Tileset must declare its asset as a top-level property.');
            }), done).toResolve();
    });

    it('returns error message when asset.version property is missing', function(done) {
        var tileset = clone(sampleTileset, true);
        delete tileset.asset.version;
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('Tileset must declare a version in its asset property');
            }), done).toResolve();
    });

    it('returns error message when asset.version property value is incorrect', function(done) {
        var tileset = clone(sampleTileset, true);
        tileset.asset.version = '0.0';
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('Tileset version must be 1.0. Tileset version provided: ' + tileset.asset.version);
            }), done).toResolve();
    });

    it('returns error message when the up-axis is not X, Y, or Z', function(done) {
        var tileset = clone(sampleTileset, true);
        tileset.asset.gltfUpAxis = 'A';
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('gltfUpAxis should either be "X", "Y", or "Z".');
            }), done).toResolve();
    });
});
