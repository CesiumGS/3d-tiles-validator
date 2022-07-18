'use strict';
const getBufferPadded = require('./getBufferPadded');

module.exports = createCmpt;

/**
 * Create a Composite (cmpt) tile from a set of tiles.
 *
 * @param {Buffer[]} tiles An array of buffers holding tile data.
 * @returns {Buffer} The generated cmpt tile buffer.
 */
function createCmpt(tiles) {
    let byteLength = 0;
    const buffers = [];
    const tilesLength = tiles.length;
    for (let i = 0; i < tilesLength; i++) {
        const tile = getBufferPadded(tiles[i]);
        const tileByteLength = tile.length;
        tile.writeUInt32LE(tileByteLength, 8); // Edit the tile's byte length
        buffers.push(tile);
        byteLength += tileByteLength;
    }

    const version = 1;
    const headerByteLength = 16;
    byteLength += headerByteLength;

    const header = Buffer.alloc(headerByteLength);
    header.write('cmpt', 0);
    header.writeUInt32LE(version, 4);
    header.writeUInt32LE(byteLength, 8);
    header.writeUInt32LE(tilesLength, 12);

    buffers.unshift(header); // Add header first

    return Buffer.concat(buffers);
}
