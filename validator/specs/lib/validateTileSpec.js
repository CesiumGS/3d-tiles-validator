'use strict';
var validateTile = require('../../lib/validateTile');
var specUtility = require('./specUtility');

var createB3dm = specUtility.createB3dm;
var createI3dm = specUtility.createI3dm;
var createPnts = specUtility.createPnts;
var createCmpt = specUtility.createCmpt;

describe('isTile', function() {
    it('returns error message if the tile format cannot be read from the tile', function() {
        expect(validateTile(Buffer.alloc(0))).toBe('Cannot determine tile format from tile header, tile content is 0 bytes.');
    });

    it('returns error message if the tile has an invalid magic', function() {
        expect(validateTile(Buffer.from('xxxx'))).toBe('Invalid magic: xxxx');
    });

    it('validates b3dm', function(done) {
        expect (validateTile(createB3dm()).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });

    it('validates i3dm', function(done) {
        expect (validateTile(createI3dm()).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });

    it('validates pnts', function() {
        expect(validateTile(createPnts())).toBeUndefined();
    });

    it('validates cmpt', function(done) {
        expect (validateTile(createCmpt()).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });
});
