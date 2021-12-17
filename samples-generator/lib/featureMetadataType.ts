import { FeatureHierarchyExtension } from './createFeatureHierarchySubExtension';
import { GltfType } from './gltfType';
import { XOR } from './xor';

export interface FeatureMetatableExtensions {
    CESIUM_3dtiles_feature_hierarchy?: FeatureHierarchyExtension;
}

export enum FeatureTableType {
    Binary,
    PlainText
}

export type Primitive = string | boolean | number;

export type FeatureTablePlainText = { [name: string]: Primitive[] };

export interface FeatureTableBinary {
    name: string;
    byteOffset: number;
    byteLength: number;
    count: number;
    componentType: GLenum;
    min: number[];
    max: number[];
    type: GltfType;
}

export interface FeatureTablePair {
    type: FeatureTableType;
    data: FeatureTablePlainText | FeatureTableBinary;
}

export type FeatureTableProperties =
    | { [name: string]: { accessor: number } }
    | { [name: string]: { values: Primitive[] } };

export interface FeatureTable {
    properties?: FeatureTableProperties;
    featureCount: number;
    extensions?: FeatureMetatableExtensions;
}

// extensions.CESIUM_3dtiles_feature_metadata
export interface FeatureMetadata {
    featureTables: FeatureTable[];
}

// meshes[0].primitives.extension.CESIUM_3dtiles_feature_metadata
export type ImplicitFeatureID = {
    implicit: {
        start: number;
        increment: number;
    };
};

export type AttributeIndex = { attributeindex: number };

export type VertexAttribute = {
    vertexAttribute: XOR<AttributeIndex, ImplicitFeatureID>;
};

export type TextureAccessor = {
    texture: {
        texCoord: number;
        normalized: boolean;
        channels: string; // /^[rgba]{1,4}$/
        texture: {
            index: number;
        };
    };
};

export type FeatureLayer = {
    featureTable: number;
    instanceStride?: number;
} & XOR<TextureAccessor, VertexAttribute>;

export type FeatureMetadataPrimitiveExtension = {
    featureLayers: FeatureLayer[];
};
