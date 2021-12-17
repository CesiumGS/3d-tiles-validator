import { GltfType } from './gltfType';

export interface Attribute {
    buffer: Buffer;
    propertyName: string;
    byteOffset?: number;
    byteAlignment?: number;
    componentType: GLenum;
    count: number;
    max: number[];
    min: number[];
    type: GltfType;
}
