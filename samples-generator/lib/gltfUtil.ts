import {  Gltf, GltfBuffer, GltfType, GLenumName } from './gltfType';
import { Attribute } from './attribute';

export function buffersToGltfBuffer(buffers: Buffer[]): GltfBuffer {
    const amalgamated = Buffer.concat(buffers);
    const uri = 'data:application/octet-stream;base64,' + 
                amalgamated.toString('base64')
    return {
        uri: uri,
        byteLength: amalgamated.length
    };
}

/**
 * Iterates over the provided attributes, calculating the necessary
 * byteOffset for each attribute (accounting for padding)
 * @param attributes An array of InstancedAttributes to process
 * @returns The sum of each byteOffset for all of the attributes (including)
 * padding.
 */

export function calcByteOffset(attributes: Omit<Attribute, 'propertyName'>[]): number {
    let byteOffset = 0;
    for (const attrib of attributes) {
        const byteAlignment = attrib.byteAlignment == null ? 1 : attrib.byteAlignment;
        attrib.byteOffset = Math.ceil(byteOffset / byteAlignment) * byteAlignment;
        byteOffset += attrib.buffer.length;
    }
    return byteOffset;
}

/**
 * Combines multiple attributes into a singular buffer, then creates the 
 * necessary bufferViews / accessors.
 * @param gltf The glTF asset to modify
 * @param attributes An array of attributes to inject into the provided glTF 
 * asset
 */
export function addBinaryBuffers(gltf: Gltf, ...attributes: Omit<Attribute, 'propertyName'>[]) {
    calcByteOffset(attributes);

    // gltf.buffer
    const amalgamatedBuffer = buffersToGltfBuffer(attributes.map((a) => a.buffer));
    gltf.buffers.push(amalgamatedBuffer);
    const bufferIndex = gltf.buffers.length - 1;

    // gltf.bufferviews / gltf.accessors
    for (const attrib of attributes) {
        gltf.bufferViews.push({
            buffer: bufferIndex,
            byteLength: attrib.buffer.byteLength,
            byteOffset: attrib.byteOffset,
            target: GLenumName.ARRAY_BUFFER
        });

        const bufferViewIndex = gltf.bufferViews.length - 1;

        gltf.accessors.push({
            bufferView: bufferViewIndex,
            byteOffset: 0,
            componentType: attrib.componentType,
            count: attrib.count,
            min: attrib.min,
            max: attrib.max,
            type: attrib.type
        });
    }

}
