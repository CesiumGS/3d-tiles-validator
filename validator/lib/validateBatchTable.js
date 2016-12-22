'use strict';
var Cesium = require('cesium');
var Ajv = require('ajv');

var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;
var loadJson = Cesium.loadJson;

module.exports = validateBatchTable;

/**
 * Checks if provided buffers follow the batch table schema
 *
 * @param {Buffer} batchTableJSON - A buffer containing the JSON Header of a batch table
 * @param {Buffer} batchTableBinary - A buffer containing the binary body of a batch table
 * @returns {Object} An object with two parameters - (1) a boolean for whether the batch table follows the schema
 *                                                   (2) a message to indicate the validation result
 */
function validateBatchTable(batchTableJSON, batchTableBinary) {
    loadJson('https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/schema/batchTable.schema.json')
        .then(function(schema) {
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

        });
}
