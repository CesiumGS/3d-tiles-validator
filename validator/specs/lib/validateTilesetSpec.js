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
                content: {
                    geometricError: 20
                },
                children: [
                    {
                        boundingVolume: {
                            region: [-1.3197209591796106, 0.6988424218, -1.31968, 0.698874, 0, 10]
                        },
                        geometricError: 0,
                        content: {
                            geometricError: 10
                        }
                    }
                ]
            },
            {
                boundingVolume: {
                    region: [-1.31968, 0.6988424218, -1.3196390408203893, 0.698874, 0, 20]
                },
                geometricError: 0,
                content: {
                    geometricError: 20
                }
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

    it('returns error message when a content\'s box type boundingVolume is not within it\'s tile\'s box type boundingVolume [invalid aligned bounding boxes]', function(done) {
        var tileBoundingVolume = {
            box: [
                0, 0, 0,
                7.0955, 0, 0,
                0, 3.1405, 0,
                0, 0, 5.0375
            ]
        };
        var contentBoundingVolume = {
            box: [
                0, 0, 0,
                7.0955, 0, 0,
                0, 3.1405, 0,
                0, 0, 5.04
            ]
        };
        var tileset = createSampleTileset(tileBoundingVolume, contentBoundingVolume);
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('content box [' + contentBoundingVolume.box + '] is not within tile box [' + tileBoundingVolume.box + ']');
            }), done).toResolve();
    });

    it('returns error message when a content\'s box type boundingVolume is not within it\'s tile\'s box type boundingVolume [invalid unaligned bounding boxes]', function(done) {
        var tileBoundingVolume = {
            box: [
                0, 0, 0,
                1, 0, 0,
                0, 1, 0,
                0, 0, 1
            ]
        };
        var contentBoundingVolume = {
            box: [
                0, 0, 0,
                1, 1, 0,
                1, 1, 0,
                0, 0, 1
            ]
        };
        var tileset = createSampleTileset(tileBoundingVolume, contentBoundingVolume);
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('content box [' + contentBoundingVolume.box + '] is not within tile box [' + tileBoundingVolume.box + ']');
            }), done).toResolve();
    });

    it('succeeds when a content\'s box type boundingVolume is within it\'s tile\'s box type boundingVolume [valid bounding boxes]', function(done) {
        var tileBoundingVolume = {
            box: [
                0, 0, 0,
                1, 0, 0,
                0, 1, 0,
                0, 0, 1
            ]
        };
        var contentBoundingVolume = {
            box: [
                0, 0, 0,
                0.5, 0.5, 0,
                0.5, 0.5, 0,
                0, 0, 1
            ]
        };
        var tileset = createSampleTileset(tileBoundingVolume, contentBoundingVolume);
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBeUndefined();
            }), done).toResolve();
    });

    it('returns error message when content\'s box type boundingVolume is not within it\'s tile\'s sphere type boundingVolume', function(done) {
        var tileBoundingVolume = {
            sphere: [0, 0, 0, 1]
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
                expect(message).toBe('content box [' + contentBoundingVolume.box + '] is not within tile sphere [' + tileBoundingVolume.sphere + ']');
            }), done).toResolve();
    });

    it('succeeds when content\'s box type boundingVolume is within it\'s tile\'s sphere type boundingVolume', function(done) {
        var tileBoundingVolume = {
            sphere: [0, 0, 0, 1]
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

    it('succeeds when child\'s box type boundingVolume is completely within it\'s parents\'s box type boundingVolume', function(done) {
        var parentBoundingVolume = {
            box: [
                0, 0, 0,
                1, 0, 0,
                0, 1, 0,
                0, 0, 1
            ]
        };
        var childBoundingVolume = {
            box: [
                0, 0, 0,
                0.5, 0, 0,
                0, 0.5, 0,
                0, 0, 0.5
            ]
        };
        var childTransform = {
            transform: [
                0.87, 0.5, 0, 0,
                -0.5, 0.87, 0, 0,
                0, 0 , 1, 0,
                0, 0, 0, 0
            ]
        }
        var tileset = createParentChildTileset(parentBoundingVolume, childBoundingVolume, childTransform, undefined);
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBeUndefined();
            }), done).toResolve();
    });

    it('fails when child\'s box type boundingVolume is not completely within it\'s parents\'s box type boundingVolume', function(done) {
        var parentBoundingVolume = {
            box: [
                0, 0, 0,
                1, 0, 0,
                0, 1, 0,
                0, 0, 1
            ]
        };
        var childBoundingVolume = {
            box: [
                0, 0, 0,
                1, 0, 0,
                5, 1, 0,
                0, 0, 1
            ]
        };
        var childTransform = {
            transform: [
                4, 0, 0, 0,
                0, 4, 0, 0,
                0, 0 , 4, 0,
                0, 0, 0, 1
            ]
        }
        var tileset = createParentChildTileset(parentBoundingVolume, childBoundingVolume, childTransform, undefined);
        expect(validateTileset(tileset)
            .then(function(message) {
                expect(message).toBe('tile box [' + childBoundingVolume.box + '] is not within parent box [' + parentBoundingVolume.box + ']');
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

function createParentChildTileset(parentBoundingVolume, childBoundingVolume, childTransform, parentTransform) {
    var sampleTileset = {
        asset: {
            version: '1.0'
        },
        geometricError: 500,
        root: {
            transform: parentTransform,
            boundingVolume: parentBoundingVolume,
            geometricError: 100,
            refine: 'ADD',
            children: [
                {
                    transform: childTransform.transform, 
                    boundingVolume: childBoundingVolume,
                    geometricError: 50,
                    refine: 'ADD'
                }
            ]
        }
    };
    return sampleTileset;
} 