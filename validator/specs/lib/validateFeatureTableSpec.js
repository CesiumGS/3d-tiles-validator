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
    it('returns error message when seeing unexpected feature table property', function(done) {
        var featureTableJson = {
            INVALID : 0
        };
        var featureTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBe('Invalid feature table property "INVALID".');
        }), done).toResolve();
    });

    it('returns error message if byteOffset is not a number', function(done) {
        var featureTableJson = {
            POSITION : {
                byteOffset : '0'
            }
        };
        var featureTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBe('Feature table binary property "POSITION" byteOffset must be a number.');
        }), done).toResolve();
    });

    it('returns error message if componentType is not one of possible options', function(done) {
        var featureTableJson = {
            BATCH_ID : {
                byteOffset : 0,
                componentType : 'INVALID'
            }
        };
        var featureTableBinary = Buffer.alloc(2);
        var featuresLength = 1;
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBe('Feature table binary property "BATCH_ID" has invalid componentType "INVALID".');
        }), done).toResolve();
    });

    it('returns error message if binary property is not aligned', function(done) {
        var featureTableJson = {
            POSITION : {
                byteOffset : 1
            }
        };
        var featureTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBe('Feature table binary property "POSITION" must be aligned to a 4-byte boundary.');
        }), done).toResolve();
    });

    it('returns error message if binary property exceeds feature table binary byte length', function(done) {
        var featureTableJson = {
            POSITION : {
                byteOffset : 4
            }
        };
        var featureTableBinary = Buffer.alloc(15);
        var featuresLength = 1;
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBe('Feature table binary property "POSITION" exceeds feature table binary byte length.');
        }), done).toResolve();
    });

    it('returns error message if boolean property is not a boolean', function(done) {
        var featureTableJson = {
            EAST_NORTH_UP : 0
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 1;
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBe('Feature table property "EAST_NORTH_UP" must be a boolean.');
        }), done).toResolve();
    });

    it('returns error message if scalar global property is not a number', function(done) {
        var featureTableJson = {
            BATCH_LENGTH : [0]
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 1;
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBe('Feature table property "BATCH_LENGTH" must be a number.');
        }), done).toResolve();
    });

    it('returns error message if property is not an array', function(done) {
        var featureTableJson = {
            RTC_CENTER : 0
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 1;
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBe('Feature table property "RTC_CENTER" must be an array.');
        }), done).toResolve();
    });

    it('returns error message if property array length is incorrect (1)', function(done) {
        var featureTableJson = {
            RTC_CENTER : [0, 0, 0, 0]
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 1;
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBe('Feature table property "RTC_CENTER" must be an array of length 3.');
        }), done).toResolve();
    });

    it('returns error message if property array length is incorrect (2)', function(done) {
        var featureTableJson = {
            POSITION : [0, 0, 0, 0, 0]
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 2;
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBe('Feature table property "POSITION" must be an array of length 6.');
        }), done).toResolve();
    });

    it('returns error message if property array does not contain numbers', function(done) {
        var featureTableJson = {
            POSITION : [0, 0, 0, '0', 0, 0]
        };
        var featureTableBinary = Buffer.alloc(0);
        var featuresLength = 2;
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBe('Feature table property "POSITION" array must contain numbers only.');
        }), done).toResolve();
    });

    it('validates feature table', function(done) {
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
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });

    it('validates feature table binary', function(done) {
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
        expect (validateFeatureTable(featureTableSchema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });
});
