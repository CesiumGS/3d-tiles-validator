'use strict';
var validateCmpt = require('../../lib/validateCmpt');
var specUtility = require('./specUtility.js');

var createB3dm = specUtility.createB3dm;
var createI3dm = specUtility.createI3dm;
var createPnts = specUtility.createPnts;
var createCmpt = specUtility.createCmpt;

describe('validate cmpt', function() {
    it ('returns error message if the cmpt buffer\'s byte length is less than its header length', function(done) {
        expect (validateCmpt(Buffer.alloc(0)).then(function(message) {
            expect(message).toBe('Header must be 16 bytes.');
        }), done).toResolve();
    });

    it ('returns error message if the cmpt has invalid magic', function(done) {
        var cmpt = createCmpt();
        cmpt.write('xxxx', 0);
        expect (validateCmpt(cmpt).then(function(message) {
            expect(message).toBe('Invalid magic: xxxx');
        }), done).toResolve();
    });

    it ('returns error message if the cmpt has an invalid version', function(done) {
        var cmpt = createCmpt();
        cmpt.writeUInt32LE(10, 4);
        expect (validateCmpt(cmpt).then(function(message) {
            expect(message).toBe('Invalid version: 10. Version must be 1.');
        }), done).toResolve();
    });

    it ('returns error message if the cmpt has wrong byteLength', function(done) {
        var cmpt = createCmpt();
        cmpt.writeUInt32LE(0, 8);
        expect (validateCmpt(cmpt).then(function(message) {
            expect(message).toBeDefined();
            expect(message.indexOf('byteLength of 0 does not equal the tile\'s actual byte length of') === 0).toBe(true);
        }), done).toResolve();
    });

    it ('returns error message if an inner tile\'s byteLength cannot be read', function(done) {
        var cmpt = Buffer.alloc(16);
        cmpt.write('cmpt', 0);      // magic
        cmpt.writeUInt32LE(1, 4);   // version
        cmpt.writeUInt32LE(16, 8);  // byteLength
        cmpt.writeUInt32LE(1, 12);  // tilesLength
        expect (validateCmpt(cmpt).then(function(message) {
            expect(message).toBe('Cannot read byte length from inner tile, exceeds cmpt tile\'s byte length.');
        }), done).toResolve();
    });

    it ('returns error message if inner tile is not aligned to an 8-byte boundary', function(done) {
        var i3dm = createI3dm({
            unalignedByteLength : true
        });
        var b3dm = createB3dm();
        var cmpt = createCmpt([i3dm, b3dm]);
        expect (validateCmpt(cmpt).then(function(message) {
            expect(message).toBe('Inner tile must be aligned to an 8-byte boundary');
        }), done).toResolve();
    });

    it ('returns error message if inner tile fails validation (1)', function(done) {
        var i3dm = createI3dm();
        var b3dm = createB3dm({
            unalignedFeatureTableBinary : true
        });
        var cmpt = createCmpt([i3dm, b3dm]);
        expect(validateCmpt(cmpt)).toBe('Error in inner b3dm tile: Feature table binary must be aligned to an 8-byte boundary.');
    });

    it ('returns error message if inner tile fails validation (2)', function() {
        var pnts = createPnts();
        var i3dm = createI3dm();
        var b3dm = createB3dm({
            unalignedFeatureTableBinary : true
        });
        var cmptInner = createCmpt([b3dm, i3dm]);
        var cmpt = createCmpt([pnts, cmptInner]);
        expect(validateCmpt(cmpt)).toBe('Error in inner cmpt tile: Error in inner b3dm tile: Feature table binary must be aligned to an 8-byte boundary.');
    });

    it ('returns error message if inner tile magic is invalid', function() {
        var i3dm = createI3dm();
        var b3dm = createB3dm();
        b3dm.write('xxxx', 0);
        var cmpt = createCmpt([b3dm, i3dm]);
        expect(validateCmpt(cmpt)).toBe('Invalid inner tile magic: xxxx');
    });

    it ('validates cmpt with no inner tiles', function(done) {
        expect (validateCmpt(createCmpt()).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });

    it ('validates cmpt with inner tiles', function(done) {
        var pnts = createPnts();
        var i3dm = createI3dm();
        var b3dm = createB3dm();
        expect (validateCmpt(createCmpt([pnts, i3dm, b3dm])).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });

    it ('validates cmpt with inner composite tiles', function(done) {
        var pnts = createPnts();
        var i3dm = createI3dm();
        var b3dm = createB3dm();
        var cmpt = createCmpt([b3dm, i3dm]);
        expect (validateCmpt(createCmpt([pnts, cmpt])).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });
});