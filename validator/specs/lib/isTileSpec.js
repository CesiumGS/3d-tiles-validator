'use strict';
var isTile = require('../../lib/isTile');

describe('isTile', function() {
    it('detects if the file path is a tile', function(done) {
        expect (isTile('tile.b3dm').then(function(message) {
            expect(message).toBe(true);
        }), done).toResolve();
        expect (isTile('tile.i3dm').then(function(message) {
            expect(message).toBe(true);
        }), done).toResolve();
        expect (isTile('tile.pnts').then(function(message) {
            expect(message).toBe(true);
        }), done).toResolve();
        expect (isTile('tile.cmpt').then(function(message) {
            expect(message).toBe(true);
        }), done).toResolve();

        expect (isTile('tile').then(function(message) {
            expect(message).toBe(false);
        }), done).toResolve();
        expect (isTile('tile.xxxx').then(function(message) {
            expect(message).toBe(false);
        }), done).toResolve();
        expect (isTile('tile.json').then(function(message) {
            expect(message).toBe(false);
        }), done).toResolve();
    });
});
