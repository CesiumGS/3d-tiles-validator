'use strict';
var child_process = require('child_process');
var path = require('path');

var scriptPath = path.join(__dirname, '../../bin/3d-tiles-samples-generator.js');

describe('3d-tiles-samples-generator', function () {
    it('runs', function (done) {
        var command = 'node';
        var args = [scriptPath, '--legacy'];
        var child = child_process.spawn(command, args);
        child.once('error', function (e) {
            fail(e);
        });
        child.once('exit', function (code) {
            if (code !== 0) {
                fail('3d-tiles-samples-generator.js exited with an error code of ' + code);
            } else {
                done();
            }
        });
    }, 20000);
});
