'use strict';
var Cesium = require('cesium');
var batchTableSchema = require('../data/schema/batchTable.schema.json');
var validateBatchTable = require('../../lib/validateBatchTable');

var clone = Cesium.clone;

var batchTableHierarchy = {
    HIERARCHY : {
        classes : [
        {
            name : 'Wall',
            length : 6,
            instances : {
                color : ['white', 'red', 'yellow', 'gray', 'brown', 'black'],
            }
        },
        {
            name : 'Building',
            length : 3,
            instances : {
                name : ['unit29', 'unit20', 'unit93'],
                address : ['100 Main St', '102 Main St', '104 Main St']
            }
        },
        {
            name : 'Owner',
            length : 3,
            instances : {
                type : ['city', 'resident', 'commercial'],
                id : [1120, 1250, 6445]
            }
        }
        ],
        instancesLength : 12,
        classIds : [0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2],
        parentCounts : [1, 3, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        parentIds : [6, 6, 10, 11, 7, 11, 7, 8, 8, 10, 10, 9]
    }
};

describe('validate batch table', function() {
    it('returns error message if byteOffset is not a number', function() {
        var batchTableJson = {
            height : {
                byteOffset : '0',
                type : 'SCALAR',
                componentType : 'FLOAT'
            }
        };
        var batchTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" byteOffset must be a number.');
    });

    it('returns error message if type is undefined', function() {
        var batchTableJson = {
            height : {
                byteOffset : 0,
                componentType : 'FLOAT'
            }
        };
        var batchTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" must have a type.');
    });

    it('returns error message if type is invalid', function() {
        var batchTableJson = {
            height : {
                byteOffset : 0,
                type : 'INVALID',
                componentType : 'FLOAT'
            }
        };
        var batchTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" has invalid type "INVALID".');
    });

    it('returns error message if componentType is undefined', function() {
        var batchTableJson = {
            height : {
                byteOffset : 0,
                type : 'SCALAR'
            }
        };
        var batchTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" must have a componentType.');
    });

    it('returns error message if componentType is invalid', function() {
        var batchTableJson = {
            height : {
                byteOffset : 0,
                type : 'SCALAR',
                componentType : 'INVALID'
            }
        };
        var batchTableBinary = Buffer.alloc(4);
        var featuresLength = 1;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" has invalid componentType "INVALID".');
    });

    it('returns error message if binary property is not aligned', function() {
        var batchTableJson = {
            height : {
                byteOffset : 2,
                type : 'SCALAR',
                componentType : 'FLOAT'
            }
        };
        var batchTableBinary = Buffer.alloc(6);
        var featuresLength = 1;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" must be aligned to a 4-byte boundary.');
    });

    it('returns error message if binary property exceeds batch table binary byte length', function() {
        var batchTableJson = {
            height : {
                byteOffset : 4,
                type : 'SCALAR',
                componentType : 'FLOAT'
            }
        };
        var batchTableBinary = Buffer.alloc(11);
        var featuresLength = 2;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table binary property "height" exceeds batch table binary byte length.');
    });

    it('returns error message if JSON property is not an array ', function() {
        var batchTableJson = {
            height : 0
        };
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 1;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table property "height" must be an array.');
    });

    it('returns error message if the property\'s array length does not equal features length', function() {
        var batchTableJson = {
            height : [1, 2, 3, 4]
        };
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 3;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('Batch table property "height" array length must equal features length 3.');
    });

    it('validates batch table', function() {
        var batchTableJson = {
            height : [1, 2, 3, 4],
            name : ['name1', 'name2', 'name3', 'name4'],
            other : [{}, 0, 'a', []]
        };
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 4;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBeUndefined();
    });

    it('validates batch table binary', function() {
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
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBeUndefined();
    });

    // TESTS FOR BATCH TABLE HIERARCHY VALIDATION
    it('returns error message if in a batch table hierarchy, a class\'s instance has more elements than class\'s length property', function() {
        var batchTableJson = clone(batchTableHierarchy, true);
        batchTableJson['HIERARCHY']['classes'][1]['instances']['address'].push('105 Main St');
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 12;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('instance address of class Building must have 3 elements');
    });

    it('returns error message if instancesLength is not equal to sum of length property of all classes', function() {
        var batchTableJson = clone(batchTableHierarchy, true);
        batchTableJson['HIERARCHY']['instancesLength'] = 11;
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 12;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('instancesLength must be equal to 12');
    });

    it('returns error message if length of classIds array is not equal to instancesLength', function() {
        var batchTableJson = clone(batchTableHierarchy, true);
        batchTableJson['HIERARCHY']['classIds'].pop();
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 12;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('length of classIds array must be equal to 12');
    });

    it('returns error message if length of parentIds array is not equal to instancesLength when parentCounts is not defined', function() {
        var batchTableJson = clone(batchTableHierarchy, true);
        batchTableJson['HIERARCHY']['parentCounts'] = undefined;
        batchTableJson['HIERARCHY']['parentIds'].pop();
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 12;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('length of parentIds array must be equal to 12');
    });

    it('returns error message if length of parentCounts array is not equal to instancesLength', function() {
        var batchTableJson = clone(batchTableHierarchy, true);
        batchTableJson['HIERARCHY']['parentCounts'].pop();
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 12;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('length of parentCounts array must be equal to 12');
    });

    it('returns error message if length of parentIds array is not equal to the sum of values of parentCounts array', function() {
        var batchTableJson = clone(batchTableHierarchy, true);
        batchTableJson['HIERARCHY']['parentIds'] = [6, 6, 10, 11, 7, 11, 7, 8, 8, 10, 10];
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 12;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('length of parentIds array must be equal to 12');
    });

    it('succeeds for a valid batch table hierarchy', function() {
        var batchTableJson = clone(batchTableHierarchy, true);
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 12;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBeUndefined();
    });
});
