'use strict';

module.exports.createInvalidMagic = createInvalidMagic;
module.exports.createWrongVersion = createWrongVersion;
module.exports.createWrongByteLength = createWrongByteLength;

function createInvalidMagic() {

    var header = new Buffer(24);
    header.write('b3bm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength - length of entire tile, including header, in bytes
    header.writeUInt32LE(0, 12); // batchTableJSONByteLength - length of batch table JSON section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(0, 16); // batchTableBinaryByteLength - length of batch table binary section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(0, 20); // batchLength - number of models, also called features, in the batch

    return header;
}

function createWrongVersion() {

    var header = new Buffer(24);
    header.write('b3dm', 0); // magic
    header.writeUInt32LE(5, 4); // version
    header.writeUInt32LE(header.length, 8); // byteLength - length of entire tile, including header, in bytes
    header.writeUInt32LE(0, 12); // batchTableJSONByteLength - length of batch table JSON section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(0, 16); // batchTableBinaryByteLength - length of batch table binary section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(0, 20); // batchLength - number of models, also called features, in the batch

    return header;
}

function createWrongByteLength() {

    var header = new Buffer(24);
    header.write('b3dm', 0); // magic
    header.writeUInt32LE(1, 4); // version
    header.writeUInt32LE(99, 8); // byteLength - length of entire tile, including header, in bytes
    header.writeUInt32LE(0, 12); // batchTableJSONByteLength - length of batch table JSON section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(0, 16); // batchTableBinaryByteLength - length of batch table binary section in bytes. (0 for basic, no batches)
    header.writeUInt32LE(0, 20); // batchLength - number of models, also called features, in the batch

    return header;
}
