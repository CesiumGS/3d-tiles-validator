import { Attribute } from './attribute';
import { UINT32_SIZE_BYTES } from './typeSize';
import { GltfComponentType, GltfType } from './gltfType';

export function createConstantAttributeLEU32(
    name: string,
    constant: number,
    len: number
): Attribute {

    const buffer = Buffer.alloc(len * UINT32_SIZE_BYTES);
    for (let i=0; i < len; ++i) {
        buffer.writeUInt32LE(constant, i * UINT32_SIZE_BYTES);
    }

    return {
        buffer: buffer,
        byteOffset: 0,
        componentType: GltfComponentType.UNSIGNED_INT,
        type: GltfType.SCALAR,
        count: len,
        min: [constant],
        max: [constant],
        propertyName: name,
        byteAlignment: 1
    }
}
