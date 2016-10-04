'use strict';
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
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

    it('writes a tile', function(done) {
        var path = testOutputPath + 'justmagic.b3dm';
        var data = new Buffer('b3dm');
        expect(writeTile(path, data)
            .then(function() {
                return fsExtraReadFile(path);
            })
            .then(function(tileData) {
                var magic = tileData.toString('utf8', 0, 4);
                expect(magic).toEqual('b3dm');
            }), done).toResolve();
    });

    it('writes a gzipped tile', function(done) {
        var path = testOutputPath + 'justmagic.b3dm';
        var data = new Buffer('b3dm');
        expect(writeTile(path, data, {gzip : true})
            .then(function() {
                return fsExtraReadFile(path);
            })
            .then(function(tileData) {
                expect(isGzipped(tileData)).toBe(true);
            }), done).toResolve();
    });
});
