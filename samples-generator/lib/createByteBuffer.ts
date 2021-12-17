import { FLOAT32_SIZE_BYTES, UINT8_SIZE_BYTES, UINT16_SIZE_BYTES } from './typeSize';

export function createUInt16Buffer(items: number[]) {
    const out = Buffer.alloc(items.length * UINT16_SIZE_BYTES);
    for (let i = 0; i < items.length; ++i) {
        out.writeUInt16LE(items[i], i * UINT16_SIZE_BYTES);
    }
    return out;
}

export function createUInt8Buffer(items: number[]) {
    const out = Buffer.alloc(items.length * UINT8_SIZE_BYTES);
    for (let i = 0; i < items.length; ++i) {
        out.writeUInt8(items[i], i * UINT8_SIZE_BYTES);
    }
    return out;
}

export function createFloat32Buffer(items: number[]) {
    const out = Buffer.alloc(items.length * FLOAT32_SIZE_BYTES);
    for (let i = 0; i < items.length; ++i) {
        out.writeFloatLE(items[i], i * FLOAT32_SIZE_BYTES);
    }
    return out;
}
