import { FLOAT32_SIZE_BYTES } from './typeSize';
import { Attribute } from './attribute';
import { GltfType, GltfComponentType } from './gltfType';
const Cesium = require('cesium');
const Matrix4 = Cesium.Matrix4;
const Matrix3 = Cesium.Matrix3;
const Quaternion = Cesium.Quaternion;
const Cartesian3 = Cesium.Cartesian3;
const CesiumMath = Cesium.Math;

export namespace InstanceTileUtils {
    export interface FeatureTableJson {
        INSTANCES_LENGTH?: number;
        RTC_CENTER?: [number, number, number];
        QUANTIZED_VOLUME_SCALE?: [number, number, number];
        QUANTIZED_VOLUME_OFFSET?: [number, number, number];
        EAST_NORTH_UP?: boolean;
        property?: {
            [name: string]: { byteOffset: number; componentType: number };
        };
    }

    export function generateBatchTable(
        instancesLength: number,
        modelSize: number
    ) {
        return {
            Height: new Array(instancesLength).fill(modelSize)
        };
    }

    export function generateBatchTableBinary(
        instancesLength: number,
        modelSize: number
    ) {
        const idBuffer = Buffer.alloc(instancesLength * FLOAT32_SIZE_BYTES);
        for (let i = 0; i < instancesLength; ++i) {
            idBuffer.writeUInt32LE(i, i * FLOAT32_SIZE_BYTES);
        }

        const batchTableJson = {
            id: {
                name: 'id',
                byteOffset: 0,
                componentType: GltfComponentType.UNSIGNED_INT,
                type: GltfType.SCALAR,
                count: instancesLength,
                min: [0],
                max: [instancesLength - 1],
                byteLength: idBuffer.byteLength
            },

            Height: new Array(instancesLength).fill(modelSize)
        };

        return {
            json: batchTableJson,
            binary: idBuffer
        };
    }

    export function genFeatureTableJson(
        featureTableBinary: Buffer,
        attributes: Attribute[]
    ): FeatureTableJson {
        const out: FeatureTableJson = {};

        for (let i = 0; i < attributes.length; ++i) {
            let attribute = attributes[i];
            out[attribute.propertyName] = {
                byteOffset: attribute.byteOffset,
                componentType: attribute.componentType // Only defined for batchIds
            };
            attribute.buffer.copy(featureTableBinary, attribute.byteOffset);
            return {} as any;
        }
    }

    export function getPositions(
        instancesLength: number,
        tileWidth: number,
        modelSize: number,
        transform: object
    ): Attribute {
        const buffer = Buffer.alloc(instancesLength * 3 * FLOAT32_SIZE_BYTES);

        const min = new Array(3).fill(+Infinity);
        const max = new Array(3).fill(-Infinity);

        for (let i = 0; i < instancesLength; ++i) {
            const position = getPosition(
                i,
                instancesLength,
                tileWidth,
                modelSize,
                transform
            );

            buffer.writeFloatLE(position.x, i * 3 * FLOAT32_SIZE_BYTES);
            buffer.writeFloatLE(position.y, (i * 3 + 1) * FLOAT32_SIZE_BYTES);
            buffer.writeFloatLE(position.z, (i * 3 + 2) * FLOAT32_SIZE_BYTES);

            min[0] = Math.min(min[0], position.x);
            min[1] = Math.min(min[1], position.y);
            min[2] = Math.min(min[2], position.z);
            max[0] = Math.max(max[0], position.x);
            max[1] = Math.max(max[1], position.y);
            max[2] = Math.max(max[2], position.z);
        }

        return {
            buffer: buffer,
            propertyName: 'POSITION',
            byteAlignment: FLOAT32_SIZE_BYTES,
            componentType: GltfComponentType.FLOAT,
            count: instancesLength,
            min: min,
            max: max,
            type: GltfType.VEC3
        };
    }

    export function getPosition(
        i: number,
        instancesLength: number,
        tileWidth: number,
        modelSize: number,
        transform: object // Cesium.Matrix4
    ) {
        const width = Math.round(Math.sqrt(instancesLength));
        let x = i % width;
        let y = Math.floor(i / width);
        let z = 0.0;

        x = x / (width - 1) - 0.5;
        y = y / (width - 1) - 0.5;

        x *= tileWidth - modelSize * 2.0;
        y *= tileWidth - modelSize * 2.0;

        let position = new Cartesian3(x, y, z);
        Matrix4.multiplyByPoint(transform, position, position);

        return position;
    }

    function getOrthogonalNormal(normal) {
        const randomNormal = getNormal();
        const orthogonal = Cartesian3.cross(normal, randomNormal, randomNormal);
        return Cartesian3.normalize(orthogonal, orthogonal);
    }

    export type RNG = () => number;
    function getNormal(rng: RNG = CesiumMath.nextRandomNumber) {
        const x = rng();
        const y = rng();
        const z = rng();
        const normal = new Cartesian3(x, y, z);
        Cartesian3.normalize(normal, normal);
        return normal;
    }

    export function getQuaternionNormals(
        instancesLength: number,
        rng: RNG = CesiumMath.nextRandomNumber
    ): Attribute {
        const totalQuaternions = instancesLength * 4;
        const buffer = Buffer.alloc(totalQuaternions * FLOAT32_SIZE_BYTES);

        const normalForward = new Cartesian3();
        const rotationMatrix = new Matrix3();
        const quaternion = new Quaternion();

        const min = new Array(4).fill(+Infinity);
        const max = new Array(4).fill(-Infinity);

        for (let i = 0; i < instancesLength; ++i) {
            const normalUp = getNormal(rng);
            const normalRight = getNormal(rng);
            Cartesian3.normalize(normalUp, normalUp);
            Cartesian3.normalize(normalRight, normalRight);
            Cartesian3.cross(normalRight, normalUp, normalForward);

            // prettier-ignore
            const rotationMatrixRowMajor = [
                normalRight.x, normalRight.y, normalRight.z,
                normalUp.x, normalUp.y, normalUp.z,
                normalForward.x, normalForward.y, normalForward.z
            ];

            Cesium.Matrix3.fromRowMajorArray(rotationMatrixRowMajor, rotationMatrix);
            Cesium.Quaternion.fromRotationMatrix(rotationMatrix, quaternion)

            min[0] = Math.min(min[0], quaternion.x);
            min[1] = Math.min(min[1], quaternion.y);
            min[2] = Math.min(min[2], quaternion.z);
            min[3] = Math.min(min[3], quaternion.w);

            max[0] = Math.max(max[0], quaternion.x);
            max[1] = Math.max(max[1], quaternion.y);
            max[2] = Math.max(max[2], quaternion.z);
            max[3] = Math.max(max[3], quaternion.w);

            buffer.writeFloatLE(quaternion.x, (i * 4 + 0) * FLOAT32_SIZE_BYTES);
            buffer.writeFloatLE(quaternion.y, (i * 4 + 1) * FLOAT32_SIZE_BYTES);
            buffer.writeFloatLE(quaternion.z, (i * 4 + 2) * FLOAT32_SIZE_BYTES);
            buffer.writeFloatLE(quaternion.w, (i * 4 + 3) * FLOAT32_SIZE_BYTES);
        }

        return {
            buffer: buffer,
            propertyName: 'QUATERNION_ROTATION',
            byteAlignment: FLOAT32_SIZE_BYTES,
            count: instancesLength,
            componentType: GltfComponentType.FLOAT,
            type: GltfType.VEC4,
            min: min,
            max: max 
        }
    }

    export function getOrientations(
        instancesLength
    ): { normalUp: Attribute; normalRight: Attribute } {
        const normalsUpBuffer = Buffer.alloc(
            instancesLength * 3 * FLOAT32_SIZE_BYTES
        );
        const normalsRightBuffer = Buffer.alloc(
            instancesLength * 3 * FLOAT32_SIZE_BYTES
        );
        const normalsUpMin = new Array(3).fill(+Infinity);
        const normalsUpMax = new Array(3).fill(-Infinity);
        const normalsRightMin = new Array(3).fill(+Infinity);
        const normalsRightMax = new Array(3).fill(-Infinity);

        for (let i = 0; i < instancesLength; ++i) {
            const normalUp = getNormal();
            normalsUpBuffer.writeFloatLE(
                normalUp.x,
                i * 3 * FLOAT32_SIZE_BYTES
            );
            normalsUpBuffer.writeFloatLE(
                normalUp.y,
                (i * 3 + 1) * FLOAT32_SIZE_BYTES
            );
            normalsUpBuffer.writeFloatLE(
                normalUp.z,
                (i * 3 + 2) * FLOAT32_SIZE_BYTES
            );
            normalsUpMin[0] = Math.min(normalsUpMin[0], normalUp.x);
            normalsUpMin[1] = Math.min(normalsUpMin[1], normalUp.y);
            normalsUpMin[2] = Math.min(normalsUpMin[2], normalUp.z);
            normalsUpMax[0] = Math.max(normalsUpMax[0], normalUp.x);
            normalsUpMax[1] = Math.max(normalsUpMax[1], normalUp.y);
            normalsUpMax[2] = Math.max(normalsUpMax[2], normalUp.z);

            const normalRight = getOrthogonalNormal(normalUp);
            normalsRightBuffer.writeFloatLE(
                normalRight.x,
                i * 3 * FLOAT32_SIZE_BYTES
            );
            normalsRightBuffer.writeFloatLE(
                normalRight.y,
                (i * 3 + 1) * FLOAT32_SIZE_BYTES
            );
            normalsRightBuffer.writeFloatLE(
                normalRight.z,
                (i * 3 + 2) * FLOAT32_SIZE_BYTES
            );
            normalsRightMin[0] = Math.min(normalsRightMin[0], normalRight.x);
            normalsRightMin[1] = Math.min(normalsRightMin[1], normalRight.y);
            normalsRightMin[2] = Math.min(normalsRightMin[2], normalRight.z);
            normalsRightMax[0] = Math.max(normalsRightMax[0], normalRight.x);
            normalsRightMax[1] = Math.max(normalsRightMax[1], normalRight.y);
            normalsRightMax[2] = Math.max(normalsRightMax[2], normalRight.z);
        }

        return {
            normalUp: {
                buffer: normalsUpBuffer,
                propertyName: 'NORMAL_UP',
                byteAlignment: FLOAT32_SIZE_BYTES,
                count: instancesLength,
                componentType: GltfComponentType.FLOAT,
                type: GltfType.VEC3,
                min: normalsUpMin,
                max: normalsUpMax
            },
            normalRight: {
                buffer: normalsRightBuffer,
                propertyName: 'NORMAL_RIGHT',
                byteAlignment: FLOAT32_SIZE_BYTES,
                count: instancesLength,
                componentType: GltfComponentType.FLOAT,
                type: GltfType.VEC3,
                min: normalsRightMin,
                max: normalsRightMax
            }
        };
    }

    function getScale(): number {
        return CesiumMath.nextRandomNumber() + 0.5;
    }

    export function getNonUniformScales(instancesLength: number): Attribute {
        const buffer = Buffer.alloc(instancesLength * 3 * FLOAT32_SIZE_BYTES);
        const min = new Array(3).fill(+Infinity);
        const max = new Array(3).fill(-Infinity);

        for (let i = 0; i < instancesLength; ++i) {
            const x = getScale();
            const y = getScale();
            const z = getScale();
            buffer.writeFloatLE(x, i * 3 * FLOAT32_SIZE_BYTES);
            buffer.writeFloatLE(y, (i * 3 + 1) * FLOAT32_SIZE_BYTES);
            buffer.writeFloatLE(z, (i * 3 + 2) * FLOAT32_SIZE_BYTES);
            min[0] = Math.min(min[0], x);
            min[1] = Math.min(min[1], y);
            min[2] = Math.min(min[2], z);
            max[0] = Math.max(max[0], x);
            max[1] = Math.max(max[1], y);
            max[2] = Math.max(max[2], z);
        }

        return {
            buffer: buffer,
            propertyName: 'SCALE_NON_UNIFORM',
            byteAlignment: FLOAT32_SIZE_BYTES,
            count: instancesLength,
            componentType: GltfComponentType.FLOAT,
            min: min,
            max: max,
            type: GltfType.VEC3
        };
    }

    export function getUniformScales(instancesLength: number): Attribute {
        const buffer = Buffer.alloc(instancesLength * FLOAT32_SIZE_BYTES);
        const min = [+Infinity];
        const max = [-Infinity];

        for (let i = 0; i < instancesLength; ++i) {
            const scale = getScale();
            buffer.writeFloatLE(scale, i * FLOAT32_SIZE_BYTES);
            min[0] = Math.min(min[0], scale);
            max[0] = Math.max(max[0], scale);
        }

        return {
            buffer: buffer,
            propertyName: 'SCALE',
            byteAlignment: FLOAT32_SIZE_BYTES,
            count: instancesLength,
            componentType: GltfComponentType.FLOAT,
            min: min,
            max: max,
            type: GltfType.SCALAR
        };
    }

    export function getPositionsRTC(
        instancesLength: number,
        tileWidth: number,
        modelSize: number,
        transform: object,
        center: object // Cesium.Cartesian3
    ): Attribute {
        const buffer = Buffer.alloc(instancesLength * 3 * FLOAT32_SIZE_BYTES);
        const min = new Array(3).fill(+Infinity);
        const max = new Array(3).fill(-Infinity);
        for (let i = 0; i < instancesLength; ++i) {
            let position = getPosition(
                i,
                instancesLength,
                tileWidth,
                modelSize,
                transform
            );
            position = Cartesian3.subtract(position, center, position);
            buffer.writeFloatLE(position.x, i * 3 * FLOAT32_SIZE_BYTES);
            buffer.writeFloatLE(position.y, (i * 3 + 1) * FLOAT32_SIZE_BYTES);
            buffer.writeFloatLE(position.z, (i * 3 + 2) * FLOAT32_SIZE_BYTES);
            min[0] = Math.min(min[0], position.x);
            min[1] = Math.min(min[1], position.y);
            min[2] = Math.min(min[2], position.z);
            max[0] = Math.max(max[0], position.x);
            max[1] = Math.max(max[1], position.y);
            max[2] = Math.max(max[2], position.z);
        }

        return {
            buffer: buffer,
            propertyName: 'POSITION',
            byteAlignment: FLOAT32_SIZE_BYTES,
            count: instancesLength,
            min: min,
            max: max,
            type: GltfType.VEC3,
            componentType: GltfComponentType.FLOAT
        };
    }
}
