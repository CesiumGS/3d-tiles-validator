'use strict';
const Cesium = require('cesium');

const defined  = Cesium.defined;

module.exports = getProperties;

/**
 * Get the minimum and maximum values for each property in the batch table.
 * Ignore properties in the batch table binary for now. Also ignore non-number values.
 *
 * @param {Object|Object[]} batchTable The batch table(s).
 * @returns {Object} An object with the minimum and maximum values for each property in the batch table.
 */
function getProperties(batchTable) {
    if (!defined(batchTable)) {
        return undefined;
    }
    const properties = {};
    const batchTables = Array.isArray(batchTable) ? batchTable : [batchTable];
    const batchTablesLength = batchTables.length;
    for (let i = 0; i < batchTablesLength; ++i) {
        batchTable = batchTables[i];
        for (const name in batchTable) {
            if (batchTable.hasOwnProperty(name)) {
                const values = batchTable[name];
                if (Array.isArray(values)) {
                    if (typeof values[0] === 'number') {
                        if (!defined(properties[name])) {
                            properties[name] = {
                                minimum : Number.POSITIVE_INFINITY,
                                maximum : Number.NEGATIVE_INFINITY
                            };
                        }
                        let min = properties[name].minimum;
                        let max = properties[name].maximum;
                        const length = values.length;
                        for (let j = 0; j < length; ++j) {
                            const value = values[j];
                            min = Math.min(value, min);
                            max = Math.max(value, max);
                        }
                        properties[name].minimum = min;
                        properties[name].maximum = max;
                    }
                }
            }
        }
    }
    if (Object.keys(properties).length === 0) {
        return undefined;
    }
    return properties;
}
