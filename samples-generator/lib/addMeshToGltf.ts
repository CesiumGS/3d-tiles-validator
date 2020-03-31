import {
    Gltf,
    GltfType,
    GltfPrimitive,
    GltfComponentType
} from './gltfType';
import { Mesh } from './Mesh';
import { MeshView } from './meshView';
import { calculateMinMax, MinMax } from './calculateMinMax';
import {
    createFloat32Buffer,
    createUInt8Buffer,
    createUInt16Buffer
} from './createByteBuffer';
import { calculateBufferPadding } from './calculateBufferPadding';
import { UINT16_SIZE_BYTES } from './typeSize';
import { rootMatrix } from './constants';

type AttributeData = {
    minMax: MinMax;
    buffer: Buffer;
    count: number;
    componentType: GltfComponentType;
    type: GltfType;
    target?: GLenum;
};

type ByteOffsetInfo = {
    bufferIndex: number; // gltf.buffers index that each attribute refers to
    byteLengths: number[]; // length of each attribute
    byteOffsets: number[]; // offset of each attribute in the buffer
    indexByteLength?: number; // length of the index buffer if available
    indexByteOffset?: number; // offset of the index buffer if available
};

// note that these arrays are not always identical lengths!
// for the indices there is only 1 buffer view, but many accessors into the
// same bufferView
type BufferViewAccessorInfo = {
    bufferViewIndex: number[];
    accessorIndex: number[];
};

/**
 * Mostly a copy of createGltf.js, but adds the provided mesh to an existing
 * glTF asset instead of creating an entirely new one.
 * @param gltf The glTF asset to modify
 * @param mesh A single mesh to edit
 * @param relativeToCenter If the mesh should have its positions set relative
 * to center or not.
 */

export function addBatchedMeshToGltf(
    gltf: Gltf,
    mesh: Mesh,
    attributeSuffix = '_0',
    relativeToCenter = false
) {
    // If all the vertex colors are 0 then the mesh does not have vertex colors
    const useVertexColors = !mesh.vertexColors.every(e => e === 0);

    if (relativeToCenter) {
        mesh.setPositionsRelativeToCenter();
    }

    // create the buffers
    const useUvs = shouldUseUv(mesh.views);
    const positionsMinMax = calculateMinMax(mesh.positions, 3);
    const positionsBuffer = createFloat32Buffer(mesh.positions);
    const normalsMinMax = calculateMinMax(mesh.normals, 3);
    const normalsBuffer = createFloat32Buffer(mesh.normals);

    const batchIdsMinMax = calculateMinMax(mesh.batchIds, 1);
    const batchIdsBuffer = createFloat32Buffer(mesh.batchIds);

    let uvsMinMax: MinMax;
    let uvsBuffer: Buffer;

    if (useUvs) {
        uvsMinMax = calculateMinMax(mesh.uvs, 2);
        uvsBuffer = createFloat32Buffer(mesh.uvs);
    } else {
        uvsBuffer = Buffer.alloc(0);
    }

    let vertexColorsMinMax: MinMax;
    let vertexColorsBuffer: Buffer;

    if (useVertexColors) {
        vertexColorsMinMax = calculateMinMax(mesh.vertexColors, 4);
        vertexColorsBuffer = createUInt8Buffer(mesh.vertexColors);
    } else {
        vertexColorsBuffer = Buffer.alloc(0);
    }

    const indexBuffer = createUInt16Buffer(mesh.indices);

    const attributes: AttributeData[] = [];
    attributes.push({
        minMax: positionsMinMax,
        buffer: positionsBuffer,
        type: GltfType.VEC3,
        count: mesh.positions.length / 3,
        componentType: GltfComponentType.FLOAT
    });

    attributes.push({
        minMax: normalsMinMax,
        buffer: normalsBuffer,
        type: GltfType.VEC3,
        count: mesh.normals.length / 3,
        componentType: GltfComponentType.FLOAT
    });

    if (useUvs) {
        attributes.push({
            minMax: uvsMinMax,
            buffer: uvsBuffer,
            type: GltfType.VEC2,
            count: mesh.uvs.length / 2,
            componentType: GltfComponentType.FLOAT
        });
    }

    if (useVertexColors) {
        attributes.push({
            minMax: vertexColorsMinMax,
            buffer: vertexColorsBuffer,
            type: GltfType.VEC4,
            count: mesh.vertexColors.length / 4,
            componentType: GltfComponentType.UNSIGNED_BYTE
        });
    }

    const byteInfo = addBufferToGltf(gltf, attributes, indexBuffer);
    const indexBufferViewAccessorInfo = addIndexBufferViewAndAccessor(
        gltf,
        mesh,
        byteInfo,
        mesh.indices
    );

    const accessorBufferViewAccessorInfo = addAttributeBufferViewsAndAccessors(
        gltf,
        byteInfo,
        attributes
    );

    addMaterialsToGltf(gltf, mesh);

    // add aj new primitive
    let primitives: GltfPrimitive[] = [];
    for (let i = 0 ; i < mesh.views.length; ++i) {
        let primitive = {
            attributes: {
                POSITION: accessorBufferViewAccessorInfo.accessorIndex[0],
                NORMAL: accessorBufferViewAccessorInfo.accessorIndex[1],
            },
            material: i,
            mode: 4,
            indices: indexBufferViewAccessorInfo.accessorIndex[i]
        }

        // TODO: How do we detect if we should add a _0, _1, _2 suffix?
        if (useUvs) {
            primitive.attributes['TEXTCOORD_' + attributeSuffix] =
                accessorBufferViewAccessorInfo.accessorIndex[2]
        }

        if (useVertexColors) {
            primitive.attributes['COLOR_' + attributeSuffix] =
                accessorBufferViewAccessorInfo.accessorIndex[3]
        }

        primitives.push(primitive);
    }

    gltf.meshes.push({primitives: primitives});
    gltf.nodes.push({
        matrix: rootMatrix, 
        mesh: gltf.meshes.length - 1
    });
}

function shouldUseUv(views: MeshView[]): boolean {
    let view;
    let material;
    for (let i = 0; i < views.length; ++i) {
        view = views[i];
        material = view.material;
        // TODO: Avoid using string typing here, see Material.ts
        if (typeof material.baseColor === 'string') {
            return true;
        }
    }

    return false;
}

/**
 *
 * @param gltf The glTF asset to modify
 * @param pairs A list of AttributeData, for generating the buffer that will be
 * inserted into the glTF asset.
 * @param indexBuffer A byte buffer containing a list of indices, if provided
 * it will be placed at the end of the generated buffer.
 */
function addBufferToGltf(
    gltf: Gltf,
    pairs: AttributeData[],
    indexBuffer?: Buffer
): ByteOffsetInfo {
    gltf.buffers = gltf.buffers == null ? [] : gltf.buffers;

    let result: ByteOffsetInfo = {
        bufferIndex: gltf.buffers.length,
        byteLengths: [],
        byteOffsets: []
    };

    let byteOffset = 0;
    for (const pair of pairs) {
        result.byteLengths.push(pair.buffer.length);
        result.byteOffsets.push(byteOffset);
        byteOffset += pair.buffer.length;
    }

    const vertexBuffer = calculateBufferPadding(
        Buffer.concat(pairs.map(v => v.buffer))
    );

    let buffer: Buffer;
    if (indexBuffer == null) {
        buffer = vertexBuffer;
    } else {
        result.indexByteOffset = vertexBuffer.length;
        result.indexByteLength = indexBuffer.length;
        buffer = calculateBufferPadding(
            Buffer.concat([vertexBuffer, indexBuffer])
        );
    }

    const bufferUri =
        'data:application/octet-stream;base64,' + buffer.toString('base64');

    gltf.buffers.push({
        uri: bufferUri,
        byteLength: buffer.length
    });

    // sanity check / assertion
    if (result.byteLengths.length != pairs.length) {
        throw new Error('result.byteLengths.length != pairs.length');
    }

    return result;
}

function addIndexBufferViewAndAccessor(
    gltf: Gltf,
    mesh: Mesh,
    byteInfo: ByteOffsetInfo,
    indices: number[]
): BufferViewAccessorInfo {
    let result: BufferViewAccessorInfo = {
        bufferViewIndex: [],
        accessorIndex: []
    };

    gltf.bufferViews.push({
        buffer: byteInfo.bufferIndex,
        byteLength: byteInfo.indexByteLength,
        byteOffset: byteInfo.indexByteOffset,
        target: 34963 // ELEMENT_ARRAY_BUFFER
    });

    result.bufferViewIndex.push(gltf.bufferViews.length - 1);

    for (let i = 0; i < mesh.views.length; ++i) {
        const view = mesh.views[i];
        const indicesMinMax = calculateMinMax(
            indices,
            1,
            view.indexOffset,
            view.indexCount
        );

        gltf.accessors.push({
            bufferView: gltf.bufferViews.length - 1,
            byteOffset: UINT16_SIZE_BYTES * view.indexOffset,
            componentType: 5123, // UNSIGNED_SHORT
            count: view.indexCount,
            type: GltfType.SCALAR,
            min: indicesMinMax.min,
            max: indicesMinMax.max
        });

        result.accessorIndex.push(gltf.accessors.length - 1);
    }

    return result;
}

function addAttributeBufferViewsAndAccessors(
    gltf: Gltf,
    byteInfo: ByteOffsetInfo,
    attributes: AttributeData[]
): BufferViewAccessorInfo {
    const buffersIndex = byteInfo.bufferIndex;
    let result: BufferViewAccessorInfo = {
        bufferViewIndex: [],
        accessorIndex: []
    };

    for (let i = 0; i < attributes.length; ++i) {
        const attrib = attributes[i];
        const byteLengths = byteInfo.byteLengths;
        const byteOffsets = byteInfo.byteOffsets;
        const target = attrib.target == null ? 34962 : attrib.target;

        gltf.bufferViews.push({
            buffer: buffersIndex,
            byteLength: byteLengths[i],
            byteOffset: byteOffsets[i],
            target: target
        });

        gltf.accessors.push({
            bufferView: gltf.bufferViews.length - 1,
            byteOffset: 0,
            componentType: attrib.componentType,
            count: attrib.count,
            type: attrib.type,
            min: attrib.minMax.min,
            max: attrib.minMax.max
        });

        result.bufferViewIndex.push(gltf.bufferViews.length - 1);
        result.accessorIndex.push(gltf.accessors.length - 1);
    }

    return result;
}

function addMaterialsToGltf(gltf: Gltf, mesh: Mesh) {
    for (const view of mesh.views) {
        let transparent = false;
        let material = view.material;
        let baseColorFactor = material.baseColor;
        // TODO: Avoid stringly typed code, see Material.ts / createGltf.js
        // 'If the baseColor uri is a string pointing to a file'
        if (typeof material.baseColor === 'string') {
            baseColorFactor = [1.0, 1.0, 1.0, 1.0];
            gltf.samplers.push({
                magFilter: 9729, // LINEAR
                minFilter: 9729, // LINEAR
                wrapS: 10497, // REPEAT
                wrapT: 10497 // REPEAT
            });
            gltf.images.push({ uri: material.baseColor });
            gltf.textures.push({
                sampler: 0,
                source: gltf.images.length - 1
            });
        } else {
            transparent = material.baseColor[3] < 1.0;
        }

        const alphaMode = transparent ? 'BLEND' : 'OPAQUE';

        gltf.materials.push({
            pbrMetallicRoughness: {
                baseColorFactor: baseColorFactor,
                roughnessFactor: 1.0,
                metallicFactor: 0.0
            },
            alphaMode: alphaMode,
            doubleSided: transparent
        });
    }
}
