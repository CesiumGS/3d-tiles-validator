'use strict';
var validateGlb = require('../../lib/validateGlb');

describe('validate Glb', function() {
    it('returns error message when Glb version is incorrect', function() {
        var glb = createHeaderGlb();
        expect(validateGlb(glb)).toBe('Invalid Glb version: 1. Version must be 2.');
    });
});

function createHeaderGlb() {
    var Glb = Buffer.alloc(12);
    Glb.write('gltf', 0);     // magic
    Glb.writeUInt32LE(1, 4);  // version
    Glb.writeUInt32LE(28, 8); // byteLength
    return Glb;
}
