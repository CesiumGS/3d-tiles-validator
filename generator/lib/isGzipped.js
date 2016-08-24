'use strict';
var Cesium = require('cesium');

var DeveloperError = Cesium.DeveloperError;
var defined = Cesium.defined;

module.exports = isGzipped;

/**
 * Test if the provided data is gzipped.
 *
 * @param {Buffer} data A buffer containing the data to test.
 * @returns {Boolean} True if the data is gzipped, False if not.
 *
 * @throws {DeveloperError} Will throw an error if data is undefined.
 */
function isGzipped(data) {
    if (!defined(data)) {
        throw new DeveloperError('data must be defined.');
    }
    return data[0] === 0x1f && data[1] === 0x8b;
}