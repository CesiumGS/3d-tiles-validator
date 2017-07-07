'use strict';
var validateGlb = require('../../lib/validateGlb');
var specUtility = require('./specUtility.js');

describe('validate Glb', function() {
    it('returns error message when Glb version is incorrect', function() {
        var glb = specUtility.createGlb();
        glb.writeUInt32LE(1, 4);  // version
        expect(validateGlb(glb)).toBe('Invalid Glb version: 1. Version must be 2.');
    });
});
