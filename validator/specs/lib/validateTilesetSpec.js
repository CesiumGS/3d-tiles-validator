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
    it('returns error message when the geometricError is not defined', function(done) {
        var tileset = clone(sampleTileset, true);
        delete tileset.root.children[0].geometricError;
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('Each tile must define geometricError');
            }), done).toResolve();
    });

    it('returns error message when the geometricError is less than 0.0', function(done) {
        var tileset = clone(sampleTileset, true);
        tileset.root.children[0].geometricError = -1;
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('geometricError must be greater than or equal to 0.0');
            }), done).toResolve();
    });

    it('returns error message when child has geometricError greater than parent', function(done) {
        var tileset = clone(sampleTileset, true);
        tileset.root.children[0].geometricError = 80;
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('Child has geometricError greater than parent');
            }), done).toResolve();
    });

    it('returns error message when refine property of tile has incorrect value', function(done) {
        var tileset = clone(sampleTileset, true);
        tileset.root.children[0].refine = 'NEW';
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('Refine property in tile must have either "ADD" or "REPLACE" as its value.');
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

    it('returns error message when refine property is not defined in root tile', function(done) {
        var tileset = clone(sampleTileset, true);
        delete tileset.root.refine;
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('Tileset must define refine property in root tile');
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

    it('returns error message when a content\'s box type boundingVolume is not within it\'s tile\'s sphere type boundingVolume [invalid bounding boxes]', function(done) {
        var tileBoundingVolume = {
            sphere: [
                0, 0, 0,
                1
            ]
        };
        var contentBoundingVolume = {
            box: [
                0, 0, 0,
                1, 0, 0,
                0, 0.5, 0,
                0, 0, 0.7
            ]
        };
        var tileset = createSampleTileset(tileBoundingVolume, contentBoundingVolume);
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('content box [' + contentBoundingVolume.box + '] is not within tile box [' + tileBoundingVolume.sphere + ']');
            }), done).toResolve();
    });

    it('returns error message when a content\'s box type boundingVolume is not within it\'s tile\'s sphere type boundingVolume [valid bounding boxes]', function(done) {
        var tileBoundingVolume = {
            sphere: [
                0, 0, 0,
                1
            ]
        };
        var contentBoundingVolume = {
            box: [
                0, 0, 0,
                0.5, 0, 0,
                0, 0.5, 0,
                0, 0, 0.5
            ]
        };
        var tileset = createSampleTileset(tileBoundingVolume, contentBoundingVolume);
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBeUndefined();
            }), done).toResolve();
    });

    it('succeeds for valid tileset', function(done) {
        expect(validateTileset(sampleTileset)
            .then(function(message) {
                expect(message).toBeUndefined();
            }), done).toResolve();
    });
});

function createSampleTileset(tileBoundingVolume, contentBoundingVolume) {
    var sampleTileset = {
        asset: {
            version: '1.0'
        },
        geometricError: 500,
        root: {
            transform: [96.86356343768793, 24.848542777253734, 0, 0,
                -15.986465724980844, 62.317780594908875, 76.5566922962899, 0,
                19.02322243409411, -74.15554020821229, 64.3356267137516, 0,
                1215107.7612304366, -4736682.902037748, 4081926.095098698, 1
            ],
            boundingVolume: tileBoundingVolume,
            geometricError: 100,
            refine: 'ADD',
            content: {
                boundingVolume: contentBoundingVolume
            }
        }
    };
    return sampleTileset;
}
