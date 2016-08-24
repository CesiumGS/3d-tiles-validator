'use strict';
var Promise = require('bluebird');
var fs = require('fs-extra');
var rimraf = require('rimraf');

var isGzipped = require('../../lib/isGzipped');
var writeTile = require('../../lib/writeTile');

var fsReadFile = Promise.promisify(fs.readFile);
var rimrafAsync = Promise.promisify(rimraf);

var testOutputPath = './specs/data/.test/';

describe('writeTile', function() {
    afterAll(function(done) {
        rimrafAsync(testOutputPath, {})
            .then(done);
    });

    it('throws DeveloperError if filePath is undefined', function(done) {
        expect(writeTile(undefined, new Buffer(0))
            .catch(function(error) {
                expect(error).toBeDefined();
            }), done).toResolve();
    });

    it('throws DeveloperError if tileData is undefined', function(done) {
        expect(writeTile('', undefined)
            .catch(function(error) {
                expect(error).toBeDefined();
            }), done).toResolve();
    });

    it('writes a tile', function(done) {
        var path = testOutputPath + 'justmagic.i3dm';
        var data = new Buffer('i3dm');
        expect(writeTile(path, data)
            .then(function() {
                return fsReadFile(path);
            })
            .then(function(tileData) {
                var magic = tileData.toString('utf8', 0, 4);
                expect(magic).toEqual('i3dm');
            }),done).toResolve();
    });

    it('writes a gzipped tile', function(done) {
        var path = testOutputPath + 'justmagic.i3dm';
        var data = new Buffer('i3dm');
        expect(writeTile(path, data, {gzip : true})
            .then(function() {
                return fsReadFile(path);
            })
            .then(function(tileData) {
                expect(isGzipped(tileData)).toBeTruthy();
            }),done).toResolve();
    });
});