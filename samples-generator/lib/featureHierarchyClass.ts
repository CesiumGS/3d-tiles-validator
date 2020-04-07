import { GltfType } from './gltfType';

export interface CompositeAccessorBufferView {
    bufferView: number;
    byteLength: number;
    byteOffset: number;
    componentType: GLenum;
    count: number;
    max: number[];
    min: number[];
    type: GltfType;
    target: GLenum;
}

export type Primitive = string | boolean | number;
export type FeatureHierarchyProperties =
    | { [name: string]: Primitive[] }
    | CompositeAccessorBufferView;

export class FeatureHierarchyClass {
    readonly name: string;
    readonly instanceCount: number;
    readonly properties: FeatureHierarchyProperties;

    constructor(
        name: string,
        instanceCount: number,
        properties: FeatureHierarchyProperties
    ) {
        this.name = name;
        this.instanceCount = instanceCount;
        this.properties = properties;
    }
}
