import {
    FeatureMetadata,
    FeatureMetadataPrimitiveExtension
} from './featureMetadataType';
import { AtLeastOne } from './atLeastN';
import { ExtMeshGpuInstancing } from './createEXTMeshInstancing';

export enum GltfComponentType {
    BYTE = 5120,
    UNSIGNED_BYTE = 5121,
    SHORT = 5122,
    UNSIGNED_SHORT = 5123,
    UNSIGNED_INT = 5125,
    FLOAT = 5126
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

export interface GltfNodeExtensions {
    EXT_mesh_gpu_instancing?: ExtMeshGpuInstancing;
}

export interface GltfNode {
    name?: string;
    mesh?: number;
    children?: number[];
    rotation?: number[];
    scale?: number[];
    translation?: number[];
    matrix?: number[];
    extensions?: GltfNodeExtensions;
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
    bufferView?: number;
    byteOffset?: number;
    componentType: GLenum;
    count: number;
    max?: number[];
    min?: number[];
    type: GltfType;
}

export interface GltfMesh {
    primitives: GltfPrimitive[];
}

export interface GltfMaterial {}

export type ValidPrimitiveAttributes = {
    POSITION: number;
    NORMAL: number;
    TANGENT: number;
    [other: string]: number;
};

export type GltfPrimitive = {
    attributes: AtLeastOne<ValidPrimitiveAttributes>;
    indices?: number;
    material?: number;
    mode?: number;
    extensions?: GltfPrimitiveExtensions;
};

export type GltfTexture = {
    sampler?: number;
    source?: number;
    name?: string;
    extensions?: object;
    extras?: object;
};

export type GltfSampler = {
    magFilter?: number;
    minFilter?: number;
    wrapS?: number;
    wrapT?: number;
    name?: string;
    extensions?: object;
    extras?: object;
};

export type GltfImage = {
    uri?: string;
    mimeType?: string;
    bufferView?: number;
    name?: string;
    extensions?: object;
    extras?: object;
};
export interface Gltf {
    scenes?: GltfScene[];
    nodes: GltfNode[];
    meshes: GltfMesh[];
    buffers?: GltfBuffer[];
    bufferViews?: GltfBufferView[];
    accessors?: GltfAccessor[];
    asset: any[];
    extensions?: GltfExtensions;
    extensionsUsed?: string[];
    materials: GltfMaterial[];
    images?: GltfImage[];
    textures?: GltfTexture[];
    samplers?: GltfSampler[];
}

// Extensions
export interface GltfExtensions {
    CESIUM_3dtiles_feature_metadata?: FeatureMetadata;
}

export interface GltfPrimitiveExtensions {
    CESIUM_3dtiles_feature_metadata?: FeatureMetadataPrimitiveExtension;
}
