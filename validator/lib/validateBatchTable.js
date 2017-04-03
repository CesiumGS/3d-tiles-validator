'use strict';
var Ajv = require('ajv');

module.exports = validateBatchTable;

/**
 * Checks if provided buffers follow the batch table schema
 *
 * @param {Object} schema - A JSON object containing the schema for the batch table.
 * @param {JSON} batchTableJSON - Batch table JSON
 * @param {Buffer} batchTableBinary - A buffer containing the batch table binary
 * @returns {Object} An object with two parameters - (1) a boolean for whether the batch table follows the schema
 *                                                   (2) a message to indicate the validation result
 */
function validateBatchTable(schema, batchTableJSON, batchTableBinary) {
    var ajv = new Ajv();
    var validSchema = ajv.validate(schema, batchTableJSON);
    var valid = validSchema;
    var message;

    if(validSchema) {
        var binaryBodyLength = batchTableBinary.length;
        var componentTypeSize = {
            'BYTE': 1,
            'UNSIGNED_BYTE': 1,
            'SHORT': 2,
            'UNSIGNED_SHORT': 2,
            'INT': 4,
            'UNSIGNED_INT': 4,
            'FLOAT': 4,
            'DOUBLE': 8
        };

        var typeSize = {
            'SCALAR': 1,
            'VEC2': 2,
            'VEC3': 3,
            'VEC4': 4
        };

        var batchLength = batchTableJSON["id"].length;
        var totalOffset = 0;
        for (var key in batchTableJSON) {
            if(!batchTableJSON.hasOwnProperty(key)) {
                continue;
            }

            var val = batchTableJSON[key];
            if(Object.prototype.toString.call(val) === '[object Array]' ) {
                continue;
            }

            var byteOffset = val.byteOffset;
            var componentType = val.componentType;
            var numberOfComponents = val.type;

            if (byteOffset < totalOffset) {
                valid = false;
                message = 'batch table property ' + key + ' has offset within another property\'s range at ' + byteOffset;
                break;
            }

            if (!componentTypeSize.hasOwnProperty(componentType)) {
                valid = false;
                message = 'batch table property ' + key + ' has an invalid componentType: ' + componentType;
                break;
            }

            if (!typeSize.hasOwnProperty(numberOfComponents)) {
                valid = false;
                message = 'batch table property ' + key + ' has an type: ' + numberOfComponents;
                break;
            }

            var propertyByteLength = batchLength * componentTypeSize[componentType] * typeSize[numberOfComponents];
            if (propertyByteLength + byteOffset > binaryBodyLength) {
                valid = false;
                message = 'batch table property ' + key + ' is out of binary body range';
                break;
            }
        }

        if (valid) {
            message = 'batch table is valid';
        }
    } else {
        message = 'batch tableJSON failed schema validation';
    }

    return {
        validation: valid,
        message: message
    };
}
