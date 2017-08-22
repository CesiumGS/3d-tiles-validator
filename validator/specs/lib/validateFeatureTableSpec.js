'use strict';
var featureTableSchema = require('../data/schema/featureTable.schema.json');
var validateFeatureTable = require('../../lib/validateFeatureTable');

var featureTableSemantics = {
    POSITION : {
        global : false,
        type : 'VEC3',
        componentType : 'FLOAT'
    },
    NORMAL_UP_OCT32P : {
        global : false,
        type : 'VEC2',
        componentType : 'UNSIGNED_SHORT'
    },
    SCALE : {
        global : false,
        type : 'SCALAR',
        componentType : 'FLOAT'
    },
    BATCH_ID : {
        global : false,
        type : 'SCALAR',
        componentType : 'UNSIGNED_SHORT',
        componentTypeOptions : ['UNSIGNED_BYTE', 'UNSIGNED_SHORT', 'UNSIGNED_INT']
    },
    BATCH_LENGTH : {
        global : true,
        type : 'SCALAR',
        componentType : 'UNSIGNED_INT'
    },
    RTC_CENTER : {
        global : true,
        type : 'VEC3',
        componentType : 'FLOAT'
    },
    EAST_NORTH_UP : {
        global : true,
        type : 'boolean'
    }
};

describe('validate feature table', function() {
    it('returns error message when seeing unexpected feature table property', function() {
        var featureTableJson = {
            INVALID : 0
        };
        var featureTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBe('Invalid feature table property "INVALID".');
    });

    it('returns error message if byteOffset is not a number', function() {
        var featureTableJson = {
            POSITION : {
                byteOffset : '0'
            }
        };
        var featureTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBe('Feature table binary property "POSITION" byteOffset must be a number.');
    });

    it('returns error message if componentType is not one of possible options', function() {
        var featureTableJson = {
            BATCH_ID : {
                byteOffset : 0,
                componentType : 'INVALID'
            }
        };
        var featureTableBinary = Buffer.alloc(2);
        var featuresLength = 1;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBe('Feature table binary property "BATCH_ID" has invalid componentType "INVALID".');
    });

    it('returns error message if binary property is not aligned', function() {
        var featureTableJson = {
            POSITION : {
                byteOffset : 1
            }
        };
        var featureTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBe('Feature table binary property "POSITION" must be aligned to a 4-byte boundary.');
    });

    it('returns error message if binary property exceeds feature table binary byte length', function() {
        var featureTableJson = {
            POSITION : {
                byteOffset : 4
            }
        };
        var featureTableBinary = Buffer.alloc(15);
        var featuresLength = 1;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBe('Feature table binary property "POSITION" exceeds feature table binary byte length.');
    });

    it('returns error message if boolean property is not a boolean', function() {
        var featureTableJson = {
            EAST_NORTH_UP : 0
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 1;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBe('Feature table property "EAST_NORTH_UP" must be a boolean.');
    });

    it('returns error message if scalar global property is not a number', function() {
        var featureTableJson = {
            BATCH_LENGTH : [0]
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 1;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBe('Feature table property "BATCH_LENGTH" must be a number.');
    });

    it('returns error message if property is not an array', function() {
        var featureTableJson = {
            RTC_CENTER : 0
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 1;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBe('Feature table property "RTC_CENTER" must be an array.');
    });

    it('returns error message if property array length is incorrect (1)', function() {
        var featureTableJson = {
            RTC_CENTER : [0, 0, 0, 0]
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 1;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBe('Feature table property "RTC_CENTER" must be an array of length 3.');
    });

    it('returns error message if property array length is incorrect (2)', function() {
        var featureTableJson = {
            POSITION : [0, 0, 0, 0, 0]
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 2;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBe('Feature table property "POSITION" must be an array of length 6.');
    });

    it('returns error message if property array does not contain numbers', function() {
        var featureTableJson = {
            POSITION : [0, 0, 0, '0', 0, 0]
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 2;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBe('Feature table property "POSITION" array must contain numbers only.');
    });

    it('validates feature table', function() {
        var featureTableJson = {
            POSITION : [0, 0, 0, 0, 0, 0],
            NORMAL_UP_OCT32P : [0, 0, 0, 0],
            SCALE : [0, 0],
            BATCH_ID : [0, 0],
            BATCH_LENGTH : 2,
            RTC_CENTER : [0, 0, 0],
            EAST_NORTH_UP : true
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 2;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBeUndefined();
    });

    it('validates feature table binary', function() {
        var featureTableJson = {
            POSITION : {
                byteOffset : 0
            },
            NORMAL_UP_OCT32P : {
                byteOffset : 24
            },
            SCALE : {
                byteOffset : 32
            },
            BATCH_ID : {
                byteOffset : 40
            },
            BATCH_LENGTH : 2,
            RTC_CENTER : [0, 0, 0],
            EAST_NORTH_UP : true
        };
        var featureTableBinary = Buffer.alloc(44);
        var featuresLength = 2;
        expect(validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics)).toBeUndefined();
    });
});
