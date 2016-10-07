'use strict';
var writeTile = require('./writeTile');

module.exports = getDefaultWriteCallback;

/**
 * @private
 */
function getDefaultWriteCallback() {
    return function(file, data, options) {
        return writeTile(file, data, options);
    };
}
