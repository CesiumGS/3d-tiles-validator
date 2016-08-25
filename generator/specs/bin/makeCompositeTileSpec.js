'use strict';
var Promise = require('bluebird');
var childProcess = require('child_process');
var fs = require('fs-extra');
var rimraf = require('rimraf');
var isGzipped = require('../../lib/isGzipped');

var fsReadFile = Promise.promisify(fs.readFile);
var rimrafAsync = Promise.promisify(rimraf);

var justHeaderI3dmPath = './specs/data/justHeader.i3dm';
var justHeaderGzippedI3dmPath = './specs/data/justHeaderGzipped.i3dm';
var testOutputPath = './specs/data/.test/';

describe('makeCompositeTile cli', function() {
    afterAll(function(done) {
        rimrafAsync(testOutputPath, {})
            .then(done);
    });

    it('makes a composite tile', function(done) {
        var outputPath = testOutputPath + 'composite.cmpt';
        expect(makeCompositeTile([justHeaderI3dmPath, justHeaderI3dmPath, '-o', outputPath])
            .then(function() {
                return fsReadFile(outputPath);
            })
            .then(function(tileData) {
                var magic = tileData.toString('utf8', 0, 4);
                var byteLength = 16 + 32 + 32;
                expect(tileData.length).toBe(byteLength);
                expect(magic).toEqual('cmpt');                     // magic
                expect(tileData.readUInt32LE(4)).toBe(1);          // version
                expect(tileData.readUInt32LE(8)).toBe(byteLength); // byteLength
                expect(tileData.readUInt32LE(12)).toBe(2);         // tilesLength
                var tileMagic = tileData.toString('utf8', 16, 20);
                expect(tileMagic).toEqual('i3dm');
                tileMagic = tileData.toString('utf8', 48, 52);
                expect(tileMagic).toEqual('i3dm');
            }), done).toResolve();
    });

    it('makes a composite tile from gzipped tiles', function(done) {
        var outputPath = testOutputPath + 'compositeFromGzipped.cmpt';
        expect(makeCompositeTile([justHeaderGzippedI3dmPath, justHeaderGzippedI3dmPath, '-o', outputPath])
            .then(function() {
                return fsReadFile(outputPath);
            })
            .then(function(tileData) {
                var magic = tileData.toString('utf8', 0, 4);
                var byteLength = 16 + 32 + 32;
                expect(tileData.length).toBe(byteLength);
                expect(magic).toEqual('cmpt');                     // magic
                expect(tileData.readUInt32LE(4)).toBe(1);          // version
                expect(tileData.readUInt32LE(8)).toBe(byteLength); // byteLength
                expect(tileData.readUInt32LE(12)).toBe(2);         // tilesLength
                var tileMagic = tileData.toString('utf8', 16, 20);
                expect(tileMagic).toEqual('i3dm');
            }), done).toResolve();
    });

    it('makes a gzipped composite tile', function(done) {
        var outputPath = testOutputPath + 'compositeGzipped.cmpt';
        expect(makeCompositeTile([justHeaderI3dmPath, justHeaderI3dmPath, '-o', outputPath, '-z'])
            .then(function() {
                return fsReadFile(outputPath);
            })
            .then(function(tileData) {
                expect(isGzipped(tileData)).toBeTruthy();
            }), done).toResolve();
    });
});

function makeCompositeTile(args) {
    var makeCompositeTileProcess = childProcess.fork('./bin/makeCompositeTile', args);
    return new Promise(function(resolve, reject) {
        makeCompositeTileProcess.on('close', function() {
            resolve();
        });
        makeCompositeTileProcess.on('error', function() {
            reject();
        });
    });
}