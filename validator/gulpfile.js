'use strict';

const Cesium = require('cesium');
const Promise = require('bluebird');
const child_process = require('child_process');
const fsExtra = require('fs-extra');
const gulp = require('gulp');
const Jasmine = require('jasmine');
const JasmineSpecReporter = require('jasmine-spec-reporter').SpecReporter;
const open = require('open');
const path = require('path');
const yargs = require('yargs');

const defined = Cesium.defined;
const argv = yargs.argv;

// Add third-party node module binaries to the system path
// since some tasks need to call them directly.
const environmentSeparator = process.platform === 'win32' ? ';' : ':';
const nodeBinaries = path.join(__dirname, 'node_modules', '.bin');
process.env.PATH += environmentSeparator + nodeBinaries;

const specFiles = ['**/*.js', '!node_modules/**', '!coverage/**', '!doc/**', '!bin/**'];

module.exports = {
    test: test,
    'test-watch': testWatch,
    coverage: coverage,
    cloc: cloc
};

function test(done) {
    const jasmine = new Jasmine();
    jasmine.loadConfigFile('specs/jasmine.json');
    jasmine.addReporter(new JasmineSpecReporter({
        displaySuccessfulSpec: !defined(argv.suppressPassed) || !argv.suppressPassed
    }));
    jasmine.execute();
    jasmine.onComplete(function (passed) {
        done(argv.failTaskOnError && !passed ? 1 : 0);
    });
}

function testWatch() {
    return gulp.watch(specFiles).on('change', function () {
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
}

async function coverage() {
    fsExtra.removeSync('coverage/server');
    child_process.execSync('nyc' +
        ' --all' +
        ' --reporter=lcov' +
        ' --dir coverage' +
        ' -x "specs/**" -x "coverage/**" -x "doc/**" -x "bin/**" -x "index.js" -x "gulpfile.js"' +
        ' node_modules/jasmine/bin/jasmine.js' +
        ' JASMINE_CONFIG_PATH=specs/jasmine.json', {
            stdio: [process.stdin, process.stdout, process.stderr]
        });
    open('coverage/lcov-report/index.html');
}

function cloc() {
    let cmdLine;
    const clocPath = path.join('node_modules', 'cloc', 'lib', 'cloc');

    //Run cloc on primary Source files only
    const source = new Promise(function(resolve, reject) {
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
                ' specs/lib/';
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
}
