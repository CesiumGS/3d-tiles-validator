'use strict';
var Ajv = require('ajv');
var Cesium = require('cesium');
var propertyComponents = require('../specs/util/propertyComponents.js');
var defined = Cesium.defined;

var componentTypeByteLength = propertyComponents.componentTypeByteLength;
var typeToNumberOfComponents = propertyComponents.typeToNumberOfComponents;

module.exports = validateBatchTable;

/**
 * Checks if provided buffers follow the batch table schema
 *
 * @param {Object} schema - A JSON object containing the schema for the batch table.
 * @param {Object} batchTableJSON - Batch table JSON
 * @param {Buffer} [batchTableBinary] - A buffer containing the batch table binary
 * @param {int} batchLength - The number of distinguishable models in the batch
 * @returns {Object} An object with two parameters - (1) a boolean for whether the batch table follows the schema
 *                                                   (2) a message to indicate the validation result
 */
function validateBatchTable(schema, batchTableJSON, batchTableBinary, batchLength) {
    var ajv = new Ajv();
    var validSchema = ajv.validate(schema, batchTableJSON);
    var valid = validSchema;
    var message;

    if (!validSchema) {
        return {
            result: false,
            message: 'batch table JSON failed schema validation'
        };
    }

    if (batchLength < 0) {
        return {
            result: false,
            message: 'batch table has invalid batch length of ' + batchLength
        };
    }

    if (defined(batchTableBinary) && (batchTableBinary.length > 0)) {
        var binaryBodyLength = batchTableBinary.length;
        var totalOffset = 0;
        for (var key in batchTableJSON) {
            if (!batchTableJSON.hasOwnProperty(key)) {
                continue;
            }

            var property = batchTableJSON[key];
            if (Array.isArray(property)) {
                if(property.length !== batchLength) {
                    valid = false;
                    message = 'batch table property ' + key + '\'s length expected to be ' + batchLength + ' but is ' + property.length;
                    break;
                } else {
                    continue;
                }
            }

            var byteOffset = property.byteOffset;
            var componentType = property.componentType;
            var numberOfComponents = property.type;

            if (byteOffset < totalOffset) {
                valid = false;
                message = 'batch table property ' + key + ' has offset within another property\'s range at ' + byteOffset;
                break;
            }

            if (!componentTypeByteLength.hasOwnProperty(componentType)) {
                valid = false;
                message = 'batch table property ' + key + ' has an invalid component type ' + componentType;
                break;
            }

            if (!typeToNumberOfComponents.hasOwnProperty(numberOfComponents)) {
                valid = false;
                message = 'batch table property ' + key + ' has an invalid type ' + numberOfComponents;
            }

            var propertyByteLength = batchLength * componentTypeByteLength[componentType] * typeToNumberOfComponents[numberOfComponents];
            if (propertyByteLength + byteOffset > binaryBodyLength) {
                valid = false;
                message = 'batch table property ' + key + ' is out of binary body length of ' + binaryBodyLength;
                break;
            }
            totalOffset += propertyByteLength;
        }

        if (valid) {
            message = 'batch table is valid';
        }
    }

    return {
        result: valid,
        message: message
    };
}
