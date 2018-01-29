'use strict';

var Promise = require('bluebird');
var Cesium = require('cesium');
var child_process = require('child_process');
var gulp = require('gulp');
var Jasmine = require('jasmine');
var SpecReporter = require('jasmine-spec-reporter').SpecReporter;
var path = require('path');
var yargs = require('yargs');
var fsExtra = require('fs-extra');
var open = require('open');

var defined = Cesium.defined;
var argv = yargs.argv;

// Add third-party node module binaries to the system path
// since some tasks need to call them directly.
var environmentSeparator = process.platform === 'win32' ? ';' : ':';
var nodeBinaries = path.join(__dirname, 'node_modules', '.bin');
process.env.PATH += environmentSeparator + nodeBinaries;

var specFiles = ['**/*.js', '!node_modules/**'];

gulp.task('test', function (done) {
    var jasmine = new Jasmine();
    jasmine.loadConfigFile('specs/jasmine.json');
    jasmine.addReporter(new SpecReporter({
        displaySuccessfulSpec: !defined(argv.suppressPassed) || !argv.suppressPassed
    }));
    jasmine.execute();
    jasmine.onComplete(function (passed) {
        done(argv.failTaskOnError && !passed ? 1 : 0);
    });
});

gulp.task('test-watch', function () {
    gulp.watch(specFiles).on('change', function () {
        // We can't simply depend on the test task because Jasmine
        // does not like being run multiple times in the same process.
        try {
            child_process.execSync('jasmine JASMINE_CONFIG_PATH=specs/jasmine.json', {
                stdio: [process.stdin, process.stdout, process.stderr]
            });
        } catch (exception) {
            console.log('Tests failed to execute.');
        }
    });
});

gulp.task('coverage', function () {
    fsExtra.removeSync('coverage');
    child_process.execSync('nyc' +
        ' --all' +
        ' --reporter=lcov' +
        ' --dir coverage' +
        ' -x "specs/**"' +
        ' -x "coverage/**"' +
        ' -x "gulpfile.js"' +
        ' -x "index.js"' +
        ' node_modules/jasmine/bin/jasmine.js' +
        ' JASMINE_CONFIG_PATH=specs/jasmine.json', {
        stdio: [process.stdin, process.stdout, process.stderr]
    });
    open('coverage/lcov-report/index.html');
});

gulp.task('cloc', function() {
    var cmdLine;
    var clocPath = path.join('node_modules', 'cloc', 'lib', 'cloc');

    //Run cloc on primary Source files only
    var source = new Promise(function(resolve, reject) {
        cmdLine = 'perl ' + clocPath + ' --quiet --progress-rate=0' +
            ' lib/ bin/';

        child_process.exec(cmdLine, function(error, stdout, stderr) {
            if (error) {
                console.log(stderr);
                return reject(error);
            }
            console.log('Source:');
            console.log(stdout);
            resolve();
        });
    });

    //If running cloc on source succeeded, also run it on the tests.
    return source.then(function() {
        return new Promise(function(resolve, reject) {
            cmdLine = 'perl ' + clocPath + ' --quiet --progress-rate=0' +
                ' specs/lib/ specs/bin/';
            child_process.exec(cmdLine, function(error, stdout, stderr) {
                if (error) {
                    console.log(stderr);
                    return reject(error);
                }
                console.log('Specs:');
                console.log(stdout);
                resolve();
            });
        });
    });
});
