'use strict';
var batchTableSchema = require('../data/schema/batchTable.schema.json');
var validateBatchTable = require('../../lib/validateBatchTable');

describe('validate batch table', function() {
    it('returns error message if byteOffset is not a number', function(done) {
        var batchTableJson = {
            height : {
                byteOffset : '0',
                type : 'SCALAR',
                componentType : 'FLOAT'
            }
        };
        var batchTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        expect (validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength).then(function(message) {
            expect(message).toBe('Batch table binary property "height" byteOffset must be a number.');
        }), done).toResolve();
    });

    it('returns error message if type is undefined', function(done) {
        var batchTableJson = {
            height : {
                byteOffset : 0,
                componentType : 'FLOAT'
            }
        };
        var batchTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        expect (validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength).then(function(message) {
            expect(message).toBe('Batch table binary property "height" must have a type.');
        }), done).toResolve();
    });

    it('returns error message if type is invalid', function(done) {
        var batchTableJson = {
            height : {
                byteOffset : 0,
                type : 'INVALID',
                componentType : 'FLOAT'
            }
        };
        var batchTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        expect (validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength).then(function(message) {
            expect(message).toBe('Batch table binary property "height" has invalid type "INVALID".');
        }), done).toResolve();
    });

    it('returns error message if componentType is undefined', function(done) {
        var batchTableJson = {
            height : {
                byteOffset : 0,
                type : 'SCALAR'
            }
        };
        var batchTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        expect (validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength).then(function(message) {
            expect(message).toBe('Batch table binary property "height" must have a componentType.');
        }), done).toResolve();
    });

    it('returns error message if componentType is invalid', function(done) {
        var batchTableJson = {
            height : {
                byteOffset : 0,
                type : 'SCALAR',
                componentType : 'INVALID'
            }
        };
        var batchTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        expect (validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength).then(function(message) {
            expect(message).toBe('Batch table binary property "height" has invalid componentType "INVALID".');
        }), done).toResolve();
    });

    it('returns error message if binary property is not aligned', function(done) {
        var batchTableJson = {
            height : {
                byteOffset : 2,
                type : 'SCALAR',
                componentType : 'FLOAT'
            }
        };
        var batchTableBinary = Buffer.alloc(6);
        var featuresLength = 1;
        expect (validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength).then(function(message) {
            expect(message).toBe('Batch table binary property "height" must be aligned to a 4-byte boundary.');
        }), done).toResolve();
    });

    it('returns error message if binary property exceeds batch table binary byte length', function(done) {
        var batchTableJson = {
            height : {
                byteOffset : 4,
                type : 'SCALAR',
                componentType : 'FLOAT'
            }
        };
        var batchTableBinary = Buffer.alloc(11);
        var featuresLength = 2;
        expect (validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength).then(function(message) {
            expect(message).toBe('Batch table binary property "height" exceeds batch table binary byte length.');
        }), done).toResolve();
    });

    it('returns error message if JSON property is not an array ', function(done) {
        var batchTableJson = {
            height : 0
        };
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 1;
        expect (validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength).then(function(message) {
            expect(message).toBe('Batch table property "height" must be an array.');
        }), done).toResolve();
    });

    it('returns error message if the property\'s array length does not equal features length', function(done) {
        var batchTableJson = {
            height : [1, 2, 3, 4]
        };
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 3;
        expect (validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength).then(function(message) {
            expect(message).toBe('Batch table property "height" array length must equal features length 3.');
        }), done).toResolve();
    });

    it('validates batch table', function(done) {
        var batchTableJson = {
            height : [1, 2, 3, 4],
            name : ['name1', 'name2', 'name3', 'name4'],
            other : [{}, 0, 'a', []]
        };
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 4;
        expect (validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });

    it('validates batch table binary', function(done) {
        var batchTableJson = {
            height : {
                byteOffset : 0,
                type : 'SCALAR',
                componentType : 'FLOAT'
            },
            color : {
                byteOffset : 12,
                type : 'VEC3',
                componentType : 'UNSIGNED_BYTE'
            },
            id : {
                byteOffset : 16,
                type : 'SCALAR',
                componentType : 'UNSIGNED_SHORT'
            }
        };
        var batchTableBinary = Buffer.alloc(22);
        var featuresLength = 3;
        expect (validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength).then(function(message) {
            expect(message).toBeUndefined();
        }), done).toResolve();
    });
});
