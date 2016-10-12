'use strict';
var Promise = require('bluebird');
var fsExtra = require('fs-extra');
var isGzipped = require('../../lib/isGzipped');
var writeTile = require('../../lib/writeTile');

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);
var fsExtraRemove = Promise.promisify(fsExtra.remove);

var testOutputPath = './specs/data/.test/';

describe('writeTile', function() {
    afterAll(function(done) {
        fsExtraRemove(testOutputPath)
            .then(done);
    });

    it('throws DeveloperError if filePath is undefined', function() {
        expect(function() {
            writeTile(undefined, new Buffer(0));
        }).toThrowDeveloperError();
    });

    it('throws DeveloperError if tileData is undefined', function() {
        expect(function() {
            writeTile('', undefined);
        }).toThrowDeveloperError();
    });

    it('writes a tile', function(done) {
        var path = testOutputPath + 'justmagic.i3dm';
        var data = new Buffer('i3dm');
        expect(writeTile(path, data)
            .then(function() {
                return fsExtraReadFile(path);
            })
            .then(function(tileData) {
                var magic = tileData.toString('utf8', 0, 4);
                expect(magic).toEqual('i3dm');
            }), done).toResolve();
    });

    it('writes a gzipped tile', function(done) {
        var path = testOutputPath + 'justmagic.i3dm';
        var data = new Buffer('i3dm');
        expect(writeTile(path, data, {gzip : true})
            .then(function() {
                return fsExtraReadFile(path);
            })
            .then(function(tileData) {
                expect(isGzipped(tileData)).toBeTruthy();
            }), done).toResolve();
    });
});