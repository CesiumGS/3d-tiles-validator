'use strict';
const path = require('path');

module.exports = isTile;

/**
 * @private
 */
function isTile(file) {
    const extension = path.extname(file);
    return extension === '.b3dm' ||
        extension === '.i3dm' ||
        extension === '.pnts' ||
        extension === '.cmpt' ||
        extension === '.vctr';
}
