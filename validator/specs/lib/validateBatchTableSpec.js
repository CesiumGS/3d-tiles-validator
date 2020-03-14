'use strict';
const validateBatchTable = require('../../lib/validateBatchTable');

describe('validate batch table', () => {
    it('returns error message if byteOffset is not a number', () => {
        const batchTableJson = {
            height: {
                byteOffset: '0',
                type: 'SCALAR',
                componentType: 'FLOAT'
            }
        };
        const batchTableBinary = Buffer.alloc(4);
        const featuresLength = 1;
        const message = validateBatchTable(batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" byteOffset must be a number.');
    });

    it('returns error message if type is undefined', () => {
        const batchTableJson = {
            height: {
                byteOffset: 0,
                componentType: 'FLOAT'
            }
        };
        const batchTableBinary = Buffer.alloc(4);
        const featuresLength = 1;
        const message = validateBatchTable(batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" must have a type.');
    });

    it('returns error message if type is invalid', () => {
        const batchTableJson = {
            height: {
                byteOffset: 0,
                type: 'INVALID',
                componentType: 'FLOAT'
            }
        };
        const batchTableBinary = Buffer.alloc(4);
        const featuresLength = 1;
        const message = validateBatchTable(batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" has invalid type "INVALID".');
    });

    it('returns error message if componentType is undefined', () => {
        const batchTableJson = {
            height: {
                byteOffset: 0,
                type: 'SCALAR'
            }
        };
        const batchTableBinary = Buffer.alloc(4);
        const featuresLength = 1;
        const message = validateBatchTable(batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" must have a componentType.');
    });

    it('returns error message if componentType is invalid', () => {
        const batchTableJson = {
            height: {
                byteOffset: 0,
                type: 'SCALAR',
                componentType: 'INVALID'
            }
        };
        const batchTableBinary = Buffer.alloc(4);
        const featuresLength = 1;
        const message = validateBatchTable(batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" has invalid componentType "INVALID".');
    });

    it('returns error message if binary property is not aligned', () => {
        const batchTableJson = {
            height: {
                byteOffset: 2,
                type: 'SCALAR',
                componentType: 'FLOAT'
            }
        };
        const batchTableBinary = Buffer.alloc(6);
        const featuresLength = 1;
        const message = validateBatchTable(batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" must be aligned to a 4-byte boundary.');
    });

    it('returns error message if binary property exceeds batch table binary byte length', () => {
        const batchTableJson = {
            height: {
                byteOffset: 4,
                type: 'SCALAR',
                componentType: 'FLOAT'
            }
        };
        const batchTableBinary = Buffer.alloc(11);
        const featuresLength = 2;
        const message = validateBatchTable(batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" exceeds batch table binary byte length.');
    });

    it('returns error message if JSON property is not an array ', () => {
        const batchTableJson = {
            height: 0
        };
        const batchTableBinary = Buffer.alloc(0);
        const featuresLength = 1;
        const message = validateBatchTable(batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table property "height" must be an array.');
    });

    it('returns error message if the property\'s array length does not equal features length', () => {
        const batchTableJson = {
            height: [1, 2, 3, 4]
        };
        const batchTableBinary = Buffer.alloc(0);
        const featuresLength = 3;
        const message = validateBatchTable(batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table property "height" array length must equal features length 3.');
    });

    it('validates batch table', () => {
        const batchTableJson = {
            height: [1, 2, 3, 4],
            name: ['name1', 'name2', 'name3', 'name4'],
            other: [{}, 0, 'a', []]
        };
        const batchTableBinary = Buffer.alloc(0);
        const featuresLength = 4;
        const message = validateBatchTable(batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBeUndefined();
    });

    it('validates batch table binary', () => {
        const batchTableJson = {
            height: {
                byteOffset: 0,
                type: 'SCALAR',
                componentType: 'FLOAT'
            },
            color: {
                byteOffset: 12,
                type: 'VEC3',
                componentType: 'UNSIGNED_BYTE'
            },
            id: {
                byteOffset: 16,
                type: 'SCALAR',
                componentType: 'UNSIGNED_SHORT'
            }
        };
        const batchTableBinary = Buffer.alloc(22);
        const featuresLength = 3;
        const message = validateBatchTable(batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBeUndefined();
    });
});
