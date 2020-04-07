import { createConstantAttributeLEU32 } from '../../lib/createConstantAttribute';
import { GltfComponentType } from '../../lib/gltfType';

describe('createConstantAttributeTest', () => {
    it('generated attribute is valid', () => {
        const propertyName = 'test;';
        const constant = 1995;
        const len = 10;

        const result = createConstantAttributeLEU32(
            propertyName,
            constant,
            len
        );
        expect(result.buffer.byteLength).toEqual(4 * 10);
        expect(result.byteOffset).toEqual(0);
        expect(result.componentType).toEqual(GltfComponentType.UNSIGNED_INT);
        expect(result.count).toEqual(10);
        expect(result.min.length).toEqual(1);
        expect(result.max.length).toEqual(1);
        expect(result.min[0]).toEqual(constant);
        expect(result.max[0]).toEqual(constant);
        expect(result.propertyName).toEqual(propertyName);
        expect(result.byteAlignment).toEqual(1);

        // inspect the actual contents of the buffer
        for (let i = 0; i < result.buffer.byteLength; i += 4) {
            const b = result.buffer;
            const v = 
                (b[i + 3] << 24) | 
                (b[i + 2] << 16) |
                (b[i + 1] << 8) |
                b[i + 0];
            expect(v).toEqual(constant);
        }
    });
});
