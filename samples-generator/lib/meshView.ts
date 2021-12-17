import { Material } from './Material';

export class MeshView {
    material: Material;
    indexOffset: number;
    indexCount: number;

    /**
     * A subsection of the mesh with its own material.
     *
     * @param {Material} material The material.
     * @param {Number} indexOffset The start index into the mesh's indices
     * array.
     * @param {Number} indexCount The number of indices.
     *
     * @constructor
     * @private
     */
    constructor(material: Material, indexOffset: number, indexCount: number) {
        this.material = material;
        this.indexOffset = indexOffset;
        this.indexCount = indexCount;
    }
}
