'use strict';

module.exports = makeCompositeTile;

/**
 * Combines an array of tile buffers into a single composite tile.
 *
 * @param {Array.<Buffer>} tileBuffers An array of buffers holding tile data.
 * @returns {Buffer} A single buffer holding the composite tile.
 */
function makeCompositeTile(tileBuffers) {
    var header = new Buffer(16);
    var buffers = [];
    buffers.push(header);
    var byteLength = header.length;
    for (var i = 0; i < tileBuffers.length; i++) {
        var tile = tileBuffers[i];
        // Byte align all tiles to 4 bytes
        var tilePadding = tile.length % 4;
        if (tilePadding !== 0) {
            tile = Buffer.concat([tile, new Buffer(4 - tilePadding)]);
        }
        tile.writeUInt32LE(tile.length, 8); // byteLength
        byteLength += tile.length;
        buffers.push(tile);
    }
    header.write('cmpt', 0);                // magic
    header.writeUInt32LE(1, 4);             // version
    header.writeUInt32LE(byteLength, 8);    // byteLength
    header.writeUInt32LE(tileBuffers.length, 12); // tilesLength
    return Buffer.concat(buffers);
}