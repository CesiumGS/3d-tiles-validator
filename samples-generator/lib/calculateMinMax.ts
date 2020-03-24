export type MinMax = { min: number[]; max: number[] };

/**
 * Type safe version of `getMinMax.js`
 * @param array Elements to check
 * @param components Size of each element in the array (1,2,3,4)
 * @param start where to begin iteration in the array (inclusive)
 * @param length Total number of elements to check
 * @todo Delete getMinMax.js once its callers are converted to .ts
 */

export function calculateMinMax(
    array: number[],
    components: number,
    start: number = 0,
    length = array.length
): MinMax {
    const min = new Array<number>(components).fill(+Infinity);
    const max = new Array<number>(components).fill(-Infinity);
    const count = length / components;
    for (let i = 0; i < count; ++i) {
        for (let j = 0; j < components; ++j) {
            const index = start + i * components + j;
            const value = array[index];
            min[j] = Math.min(min[j], value);
            max[j] = Math.max(max[j], value);
        }
    }

    return { min: min, max: max };
}
