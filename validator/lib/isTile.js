'use strict';
var path = require('path');

module.exports = isTile;

/**
 * Checks whether the given file path is a tile file path.
 *
 * @param {String} filePath The file path.
 * @returns {Boolean} True if the file path is a tile file path, false if not.
 */
function isTile(filePath) {
    var extension = path.extname(filePath);
    return extension === '.b3dm' ||
        extension === '.i3dm' ||
        extension === '.pnts' ||
        extension === '.cmpt';
}
