'use strict';
var Cesium = require('cesium');

var DeveloperError = Cesium.DeveloperError;

module.exports = validateB3dm;

/**
 * Checks if provided buffer has valid b3dm tile contents
 *
 * @param {Buffer} content A buffer containing the contents of a b3dm tile.
 * @returns {Boolean} True if the content is valid according to the spec:
 * {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/TileFormats/Batched3DModel}, False if not.
 */
function validateB3dm(content) {
    if(!Cesium.defined(content)) {
        throw new DeveloperError('b3dm content must be defined');
    }

    if(!Buffer.isBuffer(content)) {
        throw new DeveloperError('content must be of type buffer');
    }

    var magic = content.toString('utf8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);

    if(magic !== 'b3dm') {
        return false;
    }

    if(version !== 1) {
        return false;
    }

    if (byteLength !== content.length) {
        return false;
    }

    return true;
}