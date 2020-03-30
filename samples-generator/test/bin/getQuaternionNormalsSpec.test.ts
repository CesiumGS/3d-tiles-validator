const Cesium = require('cesium');
const Quaternion = Cesium.Quaternion;

import { InstanceTileUtils } from '../../lib/instanceUtilsNext';
import { FLOAT32_SIZE_BYTES } from '../../lib/typeSize';
import { GltfComponentType, GltfType } from '../../lib/gltfType';

describe('getQuaternionNormalsSpec', () => {
    it('smoke test for quaternion generation', () => {
        // prettier-ignore
        const numbers = [
            0, 1, 0, // Up
            0, 0, 1,  // Right
            0, -1, 0, // Up
            0, 0, 1,  // Right
        ];

        let i = 0;
        const rng = () => {
            if (i === numbers.length) {
                i = 0;
            }
            return numbers[i++];
        };

        const expectedMin = [0, 0];

        const count = 2;
        const result = InstanceTileUtils.getQuaternionNormals(count, rng);
        expect(result.buffer.length).toEqual(count * 4 * FLOAT32_SIZE_BYTES);
        expect(result.propertyName).toEqual('QUATERNION_ROTATION');
        expect(result.byteAlignment).toEqual(FLOAT32_SIZE_BYTES);
        expect(result.count).toBe(count);
        expect(result.componentType).toBe(GltfComponentType.FLOAT);
        expect(result.type).toBe(GltfType.VEC4);

        const q0 = new Quaternion(
            result.buffer.readFloatLE(0),
            result.buffer.readFloatLE(4),
            result.buffer.readFloatLE(8),
            result.buffer.readFloatLE(12)
        );

        expect(
            q0.x * q0.x + q0.y * q0.y + q0.z * q0.z + q0.w * q0.w
        ).toBeCloseTo(1);

        const q1 = new Quaternion(
            result.buffer.readFloatLE(16),
            result.buffer.readFloatLE(20),
            result.buffer.readFloatLE(24),
            result.buffer.readFloatLE(28)
        );

        expect(
            q1.x * q1.x + q1.y * q1.y + q1.z * q1.z + q1.w * q1.w
        ).toBeCloseTo(1);
    });
});
