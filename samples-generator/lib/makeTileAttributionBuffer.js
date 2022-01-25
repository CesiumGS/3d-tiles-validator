#!/usr/bin/env node
'use strict';
const fs = require('fs');
const getBufferPadded = require('./getBufferPadded.js');
const getJsonBufferPadded = require('./getJsonBufferPadded.js');

const multipleContents = true;

const sizeOfUint32 = 4;

const strings = [
    'Attribution First',
    'Attribution Second',
    'Attribution Third',
    'Attribution Fourth',
    'Attribution Second'
];
const attributions = [[0], [1, 2, 3], [4], [], []];

let charactersLength = 0;
for (let i = 0; i < strings.length; i++) {
    charactersLength += strings[i].length;
}

const stringOffsetsLength = strings.length + 1;
const arrayOffsetsLength = attributions.length + 1;

const characterBuffer = getBufferPadded(Buffer.alloc(charactersLength));
const stringOffsetBuffer = getBufferPadded(
    Buffer.alloc(stringOffsetsLength * sizeOfUint32),
    8
);
const arrayOffsetBuffer = getBufferPadded(
    Buffer.alloc(arrayOffsetsLength * sizeOfUint32),
    8
);

const characters = new Uint8Array(
    characterBuffer.buffer,
    characterBuffer.byteOffset,
    charactersLength
);
const stringOffsets = new Uint32Array(
    stringOffsetBuffer.buffer,
    stringOffsetBuffer.byteOffset,
    stringOffsetsLength
);
const arrayOffsets = new Uint32Array(
    arrayOffsetBuffer.buffer,
    arrayOffsetBuffer.byteOffset,
    arrayOffsetsLength
);

let stringOffset = 0;
for (let i = 0; i < strings.length; i++) {
    const string = strings[i];
    const stringLength = string.length;
    for (let j = 0; j < stringLength; j++) {
        characters[stringOffset + j] = string.charCodeAt(j);
    }
    stringOffsets[i] = stringOffset;
    stringOffset += stringLength;
}

stringOffsets[strings.length] = stringOffset;

let arrayOffset = 0;
for (let i = 0; i < attributions.length; i++) {
    arrayOffsets[i] = arrayOffset;
    arrayOffset += attributions[i].length;
}

arrayOffsets[attributions.length] = arrayOffset;

const buffer = Buffer.concat([
    characterBuffer,
    stringOffsetBuffer,
    arrayOffsetBuffer
]);
const characterBufferViewByteOffset = 0;
const stringOffsetBufferByteOffset = characterBuffer.length;
const arrayOffsetBufferByteOffset =
    characterBuffer.length + stringOffsetBuffer.length;

const json = {
    buffers: [
        {
            uri: 'metadata.bin',
            byteLength: buffer.length
        }
    ],
    bufferViews: [
        {
            buffer: 0,
            byteOffset: characterBufferViewByteOffset,
            byteLength: characterBuffer.length
        },
        {
            buffer: 0,
            byteOffset: stringOffsetBufferByteOffset,
            byteLength: stringOffsetBuffer.length
        },
        {
            buffer: 0,
            byteOffset: arrayOffsetBufferByteOffset,
            byteLength: arrayOffsetBuffer.length
        }
    ],
    tileAvailability: {
        constant: 1
    },
    childSubtreeAvailability: {
        constant: 0
    },
    extensions: {
        '3DTILES_metadata': {
            class: 'tile',
            properties: {
                attribution: {
                    bufferView: 0,
                    stringOffsetBufferView: 1,
                    arrayOffsetBufferView: 2
                }
            }
        }
    }
};

if (multipleContents) {
    json.extensions['3DTILES_multiple_contents'] = {
        contentAvailability: [
            {
                constant: 1
            },
            {
                constant: 1
            }
        ]
    };
} else {
    json.contentAvailability = {
        constant: 1
    };
}

const jsonBuffer = getJsonBufferPadded(json);

const header = Buffer.alloc(24);
header.writeUInt32LE(0x74627573, 0);
header.writeUInt32LE(1, 4);
header.writeBigUInt64LE(BigInt(jsonBuffer.length), 8);
header.writeBigUInt64LE(BigInt(buffer.length), 16);

const subtreeBuffer = Buffer.concat([header, jsonBuffer, buffer]);

fs.writeFileSync('subtrees/0.0.0.subtree', subtreeBuffer);
fs.writeFileSync('subtrees/metadata.bin', buffer);
