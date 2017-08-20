'use strict';
var validateGlb = require('../../lib/validateGlb');
var specUtility = require('./specUtility.js');
var path = require('path');
var fs = require('fs');

describe('validate Glb', function() {
    it ('returns error message when Glb version is incorrect', function(done) {
        var glb = specUtility.createGlb();
        glb.writeUInt32LE(1, 4);  // version

        expect (validateGlb(glb).then(function(message) {
            var version = glb.readUInt32LE(4);
            expect(message).toBe('Invalid Glb version: ' + version + '. Version must be 2.');
        }), done).toResolve();
    });

    it ('returns error when GLTF gets incorrect binary tileset', function(done) {
        var glbfilepath_Box = path.join(__dirname, '../data/Tileset/IncorrectGLB.glb');
        
        var filehandle = fs.openSync(glbfilepath_Box, 'r');
        const stats = fs.statSync(glbfilepath_Box);
        const fileSizeInBytes = stats.size;
        var glb = new Buffer(fileSizeInBytes);
        fs.readSync(filehandle, glb, 0, glb.length, 0);
        fs.closeSync(filehandle);
        
        expect (validateGlb(glb).then(function(message) {
            expect(message).toBeDefined();
        }), done).toResolve();
    }, 10000); // Change timeout to 10 seconds

    it ('GLTF test passes for correct binary tileset', function(done) {
        var glbfilepath_Box = path.join(__dirname, '../data/Tileset/Box.glb');
        
        var filehandle = fs.openSync(glbfilepath_Box, 'r');
        const stats = fs.statSync(glbfilepath_Box);
        const fileSizeInBytes = stats.size;
        var glb = new Buffer(fileSizeInBytes);
        fs.readSync(filehandle, glb, 0, glb.length, 0);
        fs.closeSync(filehandle);

        expect (validateGlb(glb).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    }, 10000); // Change timeout to 10 seconds
});