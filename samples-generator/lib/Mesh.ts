import { Material } from './Material';
import { MeshView } from './meshView';
import { bufferToUint16Array, bufferToFloat32Array } from './bufferUtil';
import { Gltf } from './gltfType';
const Cesium = require('cesium');
const util = require('./utility');

const Cartesian3 = Cesium.Cartesian3;
const ComponentDatatype = Cesium.ComponentDatatype;
const defined = Cesium.defined;
const Matrix4 = Cesium.Matrix4;

const typeToNumberOfComponents = util.typeToNumberOfComponents;

const sizeOfUint16 = 2;
const sizeOfFloat32 = 4;

const whiteOpaqueMaterial = new Material([1.0, 1.0, 1.0, 1.0]);

export class Mesh {
    private readonly scratchCartesian = new Cartesian3();
    private readonly scratchMatrix = new Matrix4();

    indices: number[];
    positions: number[];
    normals: number[];
    uvs: number[];
    vertexColors: number[];
    batchIds?: number[];
    material?: Material;
    views?: MeshView[];

    /**
     * Stores the vertex attributes and indices describing a mesh.
     *
     * @param {Object} options Object with the following properties:
     * @param {Number[]} options.indices An array of integers representing the
     * mesh indices.
     * @param {Number[]} options.positions A packed array of floats representing
     * the mesh positions.
     * @param {Number[]} options.normals A packed array of floats representing
     * the mesh normals.
     * @param {Number[]} options.uvs A packed array of floats representing the
     * mesh UVs.
     * @param {Number[]} options.vertexColors A packed array of integers
     * representing the vertex colors.
     * @param {Number[]} [options.batchIds] An array of integers representing
     * the batch ids.
     * @param {Material} [options.material] A material to apply to the mesh.
     * @param {MeshView[]} [options.views] An array of MeshViews.
     *
     * @constructor
     */
    private constructor(
        indices: number[],
        positions: number[],
        normals: number[],
        uvs: number[],
        vertexColors: number[],
        batchIds?: number[],
        material?: Material,
        views?: MeshView[]
    ) {
        this.indices = indices;
        this.positions = positions;
        this.normals = normals;
        this.uvs = uvs;
        this.vertexColors = vertexColors;
        this.batchIds = batchIds;
        this.material = material;
        this.views = views;
    }

    /**
     * Transform the mesh with the provided transform.
     *
     * @param {Matrix4} transform The transform.
     */
    transform(transform: object) {
        let i;
        const positions = this.positions;
        const normals = this.normals;
        const vertexCount = this.vertexCount;

        // Transform positions
        for (i = 0; i < vertexCount; ++i) {
            const position = Cartesian3.unpack(
                positions,
                i * 3,
                this.scratchCartesian
            );
            Matrix4.multiplyByPoint(transform, position, position);
            Cartesian3.pack(position, positions, i * 3);
        }

        const inverseTranspose = this.scratchMatrix;
        Matrix4.transpose(transform, inverseTranspose);
        Matrix4.inverse(inverseTranspose, inverseTranspose);

        // Transform normals
        for (i = 0; i < vertexCount; ++i) {
            const normal = Cartesian3.unpack(
                normals,
                i * 3,
                this.scratchCartesian
            );
            Matrix4.multiplyByPointAsVector(inverseTranspose, normal, normal);
            Cartesian3.normalize(normal, normal);
            Cartesian3.pack(normal, normals, i * 3);
        }
    }

    /**
     * Set the positions relative to center.
     */
    setPositionsRelativeToCenter() {
        const positions = this.positions;
        const center = this.center;
        const vertexCount = this.vertexCount;
        for (let i = 0; i < vertexCount; ++i) {
            const position = Cartesian3.unpack(
                positions,
                i * 3,
                this.scratchCartesian
            );
            Cartesian3.subtract(position, center, position);
            Cartesian3.pack(position, positions, i * 3);
        }
    }

    /**
     * Get the number of vertices in the mesh.
     *
     * @returns {Number} The number of vertices.
     */
    get vertexCount(): number {
        return this.positions.length / 3;
    }

    /**
     * Get the center of the mesh.
     *
     * @returns {Cartesian3} The center position
     */
    get center() {
        const center = new Cartesian3();
        const positions = this.positions;
        const vertexCount = this.vertexCount;
        for (let i = 0; i < vertexCount; ++i) {
            const position = Cartesian3.unpack(
                positions,
                i * 3,
                this.scratchCartesian
            );
            Cartesian3.add(position, center, center);
        }
        Cartesian3.divideByScalar(center, vertexCount, center);
        return center;
    }

    /**
     * Bake materials as vertex colors. Use the default white opaque material.
     */
    transferMaterialToVertexColors() {
        const material = this.material;
        this.material = whiteOpaqueMaterial;
        const vertexCount = this.vertexCount;
        const vertexColors = new Array(vertexCount * 4);
        this.vertexColors = vertexColors;
        for (let i = 0; i < vertexCount; ++i) {
            vertexColors[i * 4 + 0] = Math.floor(material.baseColor[0] * 255);
            vertexColors[i * 4 + 1] = Math.floor(material.baseColor[1] * 255);
            vertexColors[i * 4 + 2] = Math.floor(material.baseColor[2] * 255);
            vertexColors[i * 4 + 3] = Math.floor(material.baseColor[3] * 255);
        }
    }

    /**
     * Batch multiple meshes into a single mesh. Assumes the input meshes do
     * not already have batch ids.
     *
     * @param {Mesh[]} meshes The meshes that will be batched together.
     * @returns {Mesh} The batched mesh.
     */
    static batch(meshes: Mesh[]) {
        let batchedPositions = [];
        let batchedNormals = [];
        let batchedUvs = [];
        let batchedVertexColors = [];
        let batchedBatchIds = [];
        let batchedIndices = [];

        let startIndex = 0;
        let indexOffset = 0;
        const views = [];
        let currentView;
        const meshesLength = meshes.length;
        for (let i = 0; i < meshesLength; ++i) {
            const mesh = meshes[i];
            const positions = mesh.positions;
            const normals = mesh.normals;
            const uvs = mesh.uvs;
            const vertexColors = mesh.vertexColors;
            const vertexCount = mesh.vertexCount;

            // Generate batch ids for this mesh
            const batchIds = new Array(vertexCount).fill(i);

            batchedPositions = batchedPositions.concat(positions);
            batchedNormals = batchedNormals.concat(normals);
            batchedUvs = batchedUvs.concat(uvs);
            batchedVertexColors = batchedVertexColors.concat(vertexColors);
            batchedBatchIds = batchedBatchIds.concat(batchIds);

            // Generate indices and mesh views
            const indices = mesh.indices;
            const indicesLength = indices.length;

            if (
                !defined(currentView) ||
                currentView.material !== mesh.material
            ) {
                currentView = new MeshView(
                    mesh.material,
                    indexOffset,
                    indicesLength
                );
                views.push(currentView);
            } else {
                currentView.indexCount += indicesLength;
            }

            for (let j = 0; j < indicesLength; ++j) {
                const index = indices[j] + startIndex;
                batchedIndices.push(index);
            }
            startIndex += vertexCount;
            indexOffset += indicesLength;
        }

        return new Mesh(
            batchedIndices,
            batchedPositions,
            batchedNormals,
            batchedUvs,
            batchedVertexColors,
            batchedBatchIds,
            undefined,
            views
        );
    }

    /**
     * Clone the mesh geometry and create a new mesh.
     * Assumes the input mesh does not already have batch ids.
     *
     * @param {Mesh} mesh The mesh to clone.
     * @returns {Mesh} The cloned mesh.
     */
    static clone(mesh: Mesh) {
        return new Mesh(
            mesh.indices.slice(),
            mesh.positions.slice(),
            mesh.normals.slice(),
            mesh.uvs.slice(),
            mesh.vertexColors.slice(),
            undefined,
            mesh.material
        );
    }

    /**
     * Creates a cube mesh.
     *
     * @returns {Mesh} A cube mesh.
     */

    static createCube(): Mesh {
        // prettier-ignore
        const indices = [0, 1, 2, 0, 2, 3, 6, 5, 4, 7, 6, 4, 8, 9, 10, 8, 10, 
            11, 14, 13, 12, 15, 14, 12, 18, 17, 16, 19, 18, 16, 20, 21, 22, 20, 
            22, 23];
        // prettier-ignore
        const positions = [-0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 
            0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 
            0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 
            -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 
            -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 
            0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5,
             0.5];
        // prettier-ignore
        const normals = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 
            1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 0.0, 1.0, 
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0];
        // prettier-ignore
        const uvs = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 
            0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 
            1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 
            1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
        // prettier-ignore
        const vertexColors = new Array(24 * 4).fill(0);
        return new Mesh(indices, positions, normals, uvs, vertexColors);
    }

    /**
     * Creates a mesh from a glTF. This utility is designed only for simple 
     * glTFs like those in the data folder.
     *
     * @param {Object} gltf The glTF.
     * @returns {Mesh} The mesh.
     */
    static fromGltf(gltf: Gltf): Mesh {
        const gltfPrimitive = gltf.meshes[0].primitives[0];
        const gltfMaterial = gltf.materials[gltfPrimitive.material];
        const material = Material.fromGltf(gltfMaterial);
        const indices = getAccessor(gltf, gltf.accessors[gltfPrimitive.indices]);
        const positions = getAccessor(
            gltf,
            gltf.accessors[gltfPrimitive.attributes.POSITION]
        );
        const normals = getAccessor(
            gltf,
            gltf.accessors[gltfPrimitive.attributes.NORMAL]
        );
        const uvs = new Array((positions.length / 3) * 2).fill(0);
        const vertexColors = new Array((positions.length / 3) * 4).fill(0);
        return new Mesh(
            indices,
            positions,
            normals,
            uvs,
            vertexColors,
            undefined,
            material
        );
    };
}

function getAccessor(gltf, accessor) {
    const bufferView = gltf.bufferViews[accessor.bufferView];
    const buffer = gltf.buffers[bufferView.buffer];
    const byteOffset = accessor.byteOffset + bufferView.byteOffset;
    const length = accessor.count * typeToNumberOfComponents(accessor.type);
    const uriHeader = 'data:application/octet-stream;base64,';
    const base64 = buffer.uri.substring(uriHeader.length);
    const data = Buffer.from(base64, 'base64');
    let typedArray;
    if (accessor.componentType === ComponentDatatype.UNSIGNED_SHORT) {
        typedArray = bufferToUint16Array(data, byteOffset, length);
    } else if (accessor.componentType === ComponentDatatype.FLOAT) {
        typedArray = bufferToFloat32Array(data, byteOffset, length);
    }
    return Array.prototype.slice.call(typedArray);
}
