'use strict';
const Cesium = require('cesium');
const defaultValue = Cesium.defaultValue;
module.exports = getMinMax;

function getMinMax(array, components, start, length) {
    start = defaultValue(start, 0);
    length = defaultValue(length, array.length);
    const min = new Array(components).fill(Number.POSITIVE_INFINITY);
    const max = new Array(components).fill(Number.NEGATIVE_INFINITY);
    const count = length / components;
    for (let i = 0; i < count; ++i) {
        for (let j = 0; j < components; ++j) {
            const index = start + i * components + j;
            const value = array[index];
            min[j] = Math.min(min[j], value);
            max[j] = Math.max(max[j], value);
        }
    }
    return {
        min: min,
        max: max
    };
}
