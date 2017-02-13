'use strict';
var Cesium = require('cesium');
var Ajv = require('ajv');

module.exports = validateBatchTable;

/**
 * Checks if provided buffers follow the batch table schema
 *
 * @param {Object} schema - A JSON object containing the schema for the batch table.
 * @param {Buffer} batchTableJSON - A buffer containing the JSON Header of a batch table
 * @param {Buffer} batchTableBinary - A buffer containing the binary body of a batch table
 * @returns {Object} An object with two parameters - (1) a boolean for whether the batch table follows the schema
 *                                                   (2) a message to indicate the validation result
 */
function validateBatchTable(schema, batchTableJSON, batchTableBinary) {
    var ajv = new Ajv();
    var validation = ajv.validate(schema, batchTableJSON);
    var message;
    if(validation) {
        message = 'batchTableJSON is valid';
    } else {
        message = 'batchTableJSON is invalid';
    }
    return {
        validation: validation,
        message: message
    };
}
