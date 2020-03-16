import { FeatureMetatable } from './featureMetatableType';

export enum GltfComponentType {
    UNSIGNED_BYTE = 'UNSIGNED_BYTE',
    UNSIGNED_SHORT = 'UNSIGNED_SHORT',
    UNSIGNED_INT = 'UNSIGNED_INT',
    FLOAT = 'FLOAT'
}

export enum GltfType {
    SCALAR = 'SCALAR',
    VEC2 = 'VEC2',
    VEC3 = 'VEC3',
    VEC4 = 'VEC4',
    MAT2 = 'MAT2',
    MAT3 = 'MAT3',
    MAT4 = 'MAT4'
}

export interface GltfScene {
    nodes: number[];
}

export interface GltfNode {
    name?: string;
    children?: number[];
    rotation?: number[];
    scale?: number[];
    translation?: number[];
    matrix?: number[];
}

export interface GltfBuffer {
    uri?: string;
    byteLength: number;
}

export interface GltfBufferView {
    buffer: number;
    byteLength: number;
    byteOffset: number;
    target: GLenum;
}

export interface GltfAccessor {
    bufferView: number;
    byteOffset: number;
    componentType: GLenum;
    count: number;
    max?: number[];
    min?: number[];
    type: GltfType;
}

export interface GltfMeshes {
    primitives?: GltfPrimitives;
}

export interface GltfPrimitives {
    attributes?: { [key: string]: number }[];
    indices?: number;
    material?: number;
    mode?: number;
}

export interface GltfExtensions {
    CESIUM_3dtiles_feature_metadata?: FeatureMetatable;
}

// TODO: Missing textures, images, materials.
//       Update this when the interface is missing something
//       you need!

export interface Gltf {
    scenes?: GltfScene[];
    nodes: GltfNode[];
    meshes: any[];
    buffers: GltfBuffer[];
    bufferViews: GltfBufferView[];
    accessors: GltfAccessor[];
    asset: any[];
    extensions?: GltfExtensions;
}
