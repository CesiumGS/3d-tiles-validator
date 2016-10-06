'use strict';

var Cesium = require('cesium');
var DeveloperError = Cesium.DeveloperError;
module.exports = validateB3dm;

/**
 * Test if the provided data is gzipped.
 *
 * @param {Buffer} content A buffer containing the contents of a b3dm tileset.
 * @returns {Boolean} True if the content is valid according to the specs:
 * https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/TileFormats/Batched3DModel, False if not.
 */
function validateB3dm(content) {
    if(content === undefined || content === null) {
        throw new DeveloperError('b3dm content is undefined or null');
    }
    //buf.writeUInt32LE(value, offset[, noAssert])
    //buf.readUInt32LE(offset[, noAssert])

    var magic = content.toString('uft8', 0, 4);
    var version = content.readUInt32LE(4);
    var byteLength = content.readUInt32LE(8);

    return (magic === 'bd3m' && version === 0x01 && byteLength === content.length);
}