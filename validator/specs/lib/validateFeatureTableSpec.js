'use strict';
const validateFeatureTable = require('../../lib/validateFeatureTable');

const featureTableSemantics = {
    POSITION: {
        global: false,
        type: 'VEC3',
        componentType: 'FLOAT'
    },
    NORMAL_UP_OCT32P: {
        global: false,
        type: 'VEC2',
        componentType: 'UNSIGNED_SHORT'
    },
    SCALE: {
        global: false,
        type: 'SCALAR',
        componentType: 'FLOAT'
    },
    BATCH_ID: {
        global: false,
        type: 'SCALAR',
        componentType: 'UNSIGNED_SHORT',
        componentTypeOptions: ['UNSIGNED_BYTE', 'UNSIGNED_SHORT', 'UNSIGNED_INT']
    },
    BATCH_LENGTH: {
        global: true,
        type: 'SCALAR',
        componentType: 'UNSIGNED_INT'
    },
    RTC_CENTER: {
        global: true,
        type: 'VEC3',
        componentType: 'FLOAT'
    },
    EAST_NORTH_UP: {
        global: true,
        type: 'boolean'
    }
};

describe('validate feature table', () => {
    it('returns error message when seeing unexpected feature table property', () => {
        const featureTableJson = {
            INVALID: 0
        };
        const featureTableBinary = Buffer.alloc(4);
        const featuresLength = 1;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBe('Invalid feature table property "INVALID".');
    });

    it('returns error message if byteOffset is not a number', () => {
        const featureTableJson = {
            POSITION: {
                byteOffset: '0'
            }
        };
        const featureTableBinary = Buffer.alloc(4);
        const featuresLength = 1;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBe('Feature table binary property "POSITION" byteOffset must be a number.');
    });

    it('returns error message if componentType is not one of possible options', () => {
        const featureTableJson = {
            BATCH_ID: {
                byteOffset: 0,
                componentType: 'INVALID'
            }
        };
        const featureTableBinary = Buffer.alloc(2);
        const featuresLength = 1;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBe('Feature table binary property "BATCH_ID" has invalid componentType "INVALID".');
    });

    it('returns error message if binary property is not aligned', () => {
        const featureTableJson = {
            POSITION: {
                byteOffset: 1
            }
        };
        const featureTableBinary = Buffer.alloc(4);
        const featuresLength = 1;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBe('Feature table binary property "POSITION" must be aligned to a 4-byte boundary.');
    });

    it('returns error message if binary property exceeds feature table binary byte length', () => {
        const featureTableJson = {
            POSITION: {
                byteOffset: 4
            }
        };
        const featureTableBinary = Buffer.alloc(15);
        const featuresLength = 1;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBe('Feature table binary property "POSITION" exceeds feature table binary byte length.');
    });

    it('returns error message if boolean property is not a boolean', () => {
        const featureTableJson = {
            EAST_NORTH_UP: 0
        };
        const featureTableBinary = Buffer.alloc(0);
        const featuresLength = 1;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBe('Feature table property "EAST_NORTH_UP" must be a boolean.');
    });

    it('returns error message if scalar global property is not a number', () => {
        const featureTableJson = {
            BATCH_LENGTH: [0]
        };
        const featureTableBinary = Buffer.alloc(0);
        const featuresLength = 1;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBe('Feature table property "BATCH_LENGTH" must be a number.');
    });

    it('returns error message if property is not an array', () => {
        const featureTableJson = {
            RTC_CENTER: 0
        };
        const featureTableBinary = Buffer.alloc(0);
        const featuresLength = 1;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBe('Feature table property "RTC_CENTER" must be an array.');
    });

    it('returns error message if property array length is incorrect (1)', () => {
        const featureTableJson = {
            RTC_CENTER: [0, 0, 0, 0]
        };
        const featureTableBinary = Buffer.alloc(0);
        const featuresLength = 1;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBe('Feature table property "RTC_CENTER" must be an array of length 3.');
    });

    it('returns error message if property array length is incorrect (2)', () => {
        const featureTableJson = {
            POSITION: [0, 0, 0, 0, 0]
        };
        const featureTableBinary = Buffer.alloc(0);
        const featuresLength = 2;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBe('Feature table property "POSITION" must be an array of length 6.');
    });

    it('returns error message if property array does not contain numbers', () => {
        const featureTableJson = {
            POSITION: [0, 0, 0, '0', 0, 0]
        };
        const featureTableBinary = Buffer.alloc(0);
        const featuresLength = 2;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBe('Feature table property "POSITION" array must contain numbers only.');
    });

    it('validates feature table', () => {
        const featureTableJson = {
            POSITION: [0, 0, 0, 0, 0, 0],
            NORMAL_UP_OCT32P: [0, 0, 0, 0],
            SCALE: [0, 0],
            BATCH_ID: [0, 0],
            BATCH_LENGTH: 2,
            RTC_CENTER: [0, 0, 0],
            EAST_NORTH_UP: true
        };
        const featureTableBinary = Buffer.alloc(0);
        const featuresLength = 2;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBeUndefined();
    });

    it('validates feature table binary', () => {
        const featureTableJson = {
            POSITION: {
                byteOffset: 0
            },
            NORMAL_UP_OCT32P: {
                byteOffset: 24
            },
            SCALE: {
                byteOffset: 32
            },
            BATCH_ID: {
                byteOffset: 40
            },
            BATCH_LENGTH: 2,
            RTC_CENTER: [0, 0, 0],
            EAST_NORTH_UP: true
        };
        const featureTableBinary = Buffer.alloc(44);
        const featuresLength = 2;
        const message = validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
        expect(message).toBeUndefined();
    });
});
