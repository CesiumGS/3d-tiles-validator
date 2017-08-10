'use strict';
var batchTableSchema = require('../data/schema/batchTable.schema.json');
var validateBatchTable = require('../../lib/validateBatchTable');

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
        var batchTableJson = {
            HIERARCHY : {
                classes : [
                {
                    name : 'Wall',
                    length : 6,
                    instances : {
                        wall_color : ['blue', 'pink', 'green', 'lime', 'black', 'brown'],
                        wall_windows : [2, 4, 4, 2, 0, 3]
                    }
                },
                {
                    name : 'Building',
                    length : 3,
                    instances : {
                        building_name : ['building_0', 'building_1', 'building_2'],
                        building_id : [0, 1, 2],
                        building_address : ['10 Main St', '12 Main St', '14 Main St', '16 Main St']
                    }
                },
                {
                    name : 'Block',
                    length : 1,
                    instances : {
                        block_lat_long : [[0.12, 0.543]],
                        block_district : ['central']
                    }
                }
                ],
                instancesLength : 10,
                classIds : [0, 0, 0, 0, 0, 0, 1, 1, 1, 2],
                parentIds : [6, 6, 7, 7, 8, 8, 9, 9, 9, 9]
            }
        };
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 9;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBe('instance building_address of class Building must have 3 elements');
    });

    it('succeeds for a valid batch table hierarchy', function() {
        var batchTableJson = {
            HIERARCHY : {
                classes : [
                {
                    name : 'Wall',
                    length : 6,
                    instances : {
                        wall_color : ['blue', 'pink', 'green', 'lime', 'black', 'brown'],
                        wall_windows : [2, 4, 4, 2, 0, 3]
                    }
                },
                {
                    name : 'Building',
                    length : 3,
                    instances : {
                        building_name : ['building_0', 'building_1', 'building_2'],
                        building_id : [0, 1, 2],
                        building_address : ['10 Main St', '12 Main St', '14 Main St']
                    }
                },
                {
                    name : 'Block',
                    length : 1,
                    instances : {
                        block_lat_long : [[0.12, 0.543]],
                        block_district : ['central']
                    }
                }
                ],
                instancesLength : 10,
                classIds : [0, 0, 0, 0, 0, 0, 1, 1, 1, 2],
                parentIds : [6, 6, 7, 7, 8, 8, 9, 9, 9, 9]
            }
        };
        var batchTableBinary = Buffer.alloc(0);
        var featuresLength = 9;
        var message = validateBatchTable(batchTableSchema, batchTableJson, batchTableBinary, featuresLength);
        expect(message).toBeUndefined();
    });
});
