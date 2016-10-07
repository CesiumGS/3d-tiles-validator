'use strict';
var Promise = require('bluebird');
var fsExtra = require('fs-extra');
var path = require('path');
var isTileFile = require('../../lib/isTileFile');
var getFilesInDirectory = require('../../lib/getFilesInDirectory');

var fsExtraOutputFile = Promise.promisify(fsExtra.outputFile);
var fsExtraRemove = Promise.promisify(fsExtra.remove);

describe('getFilesInDirectory', function() {
    beforeAll(function(done) {
        Promise.all([
            fsExtraOutputFile('tmp/0.b3dm', ''),
            fsExtraOutputFile('tmp/1.i3dm', ''),
            fsExtraOutputFile('tmp/0/2.cmpt', ''),
            fsExtraOutputFile('tmp/0/0/3.vctr', ''),
            fsExtraOutputFile('tmp/1/4.pnts', ''),
            fsExtraOutputFile('tmp/1/5.not-a-tile', '')
        ])
            .then(done);
    });

    afterAll(function(done) {
        fsExtraRemove('tmp')
            .then(done);
    });

    it('gets files in a directory', function(done) {
        expect(getFilesInDirectory('tmp')
            .then(function(files) {
                files.sort();
                expect(files).toEqual([
                    path.normalize('tmp/0.b3dm'),
                    path.normalize('tmp/1.i3dm')
                ]);
            }), done).toResolve();
    });

    it('gets files in a directory recursively', function(done) {
        expect(getFilesInDirectory('tmp', {
            recursive : true
        })
            .then(function(files) {
                files.sort();
                expect(files).toEqual([
                    path.normalize('tmp/0.b3dm'),
                    path.normalize('tmp/0/0/3.vctr'),
                    path.normalize('tmp/0/2.cmpt'),
                    path.normalize('tmp/1.i3dm'),
                    path.normalize('tmp/1/4.pnts'),
                    path.normalize('tmp/1/5.not-a-tile')
                ]);
            }), done).toResolve();
    });

    it('gets files in a directory with a filter', function(done) {
        expect(getFilesInDirectory('tmp', {
            recursive : true,
            filter : isTileFile
        })
            .then(function(files) {
                files.sort();
                expect(files).toEqual([
                    path.normalize('tmp/0.b3dm'),
                    path.normalize('tmp/0/0/3.vctr'),
                    path.normalize('tmp/0/2.cmpt'),
                    path.normalize('tmp/1.i3dm'),
                    path.normalize('tmp/1/4.pnts')
                ]);
            }), done).toResolve();
    });
});