'use strict';
var Promise = require('bluebird');
var fs = require('fs-extra');
var path = require('path');
var isTileFile = require('../../lib/isTileFile');
var getFilesInDirectory = require('../../lib/getFilesInDirectory');

var fsOutputFile = Promise.promisify(fs.outputFile);
var fsRemove = Promise.promisify(fs.remove);

describe('getFilesInDirectory', function() {
    beforeAll(function(done) {
        Promise.all([
            fsOutputFile('tmp/0.b3dm', ''),
            fsOutputFile('tmp/1.i3dm', ''),
            fsOutputFile('tmp/0/2.cmpt', ''),
            fsOutputFile('tmp/0/0/3.vctr', ''),
            fsOutputFile('tmp/1/4.pnts', ''),
            fsOutputFile('tmp/1/5.not-a-tile', '')
        ])
            .then(done);
    });

    afterAll(function(done) {
        fsRemove('tmp')
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