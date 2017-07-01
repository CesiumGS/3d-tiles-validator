'use strict';
var Ajv = require('ajv');
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = validateFeatureTable;

/**
 * Checks if provided buffers follow the batch table schema
 *
 * @param {Object} schema - A JSON object containing the schema for the feature table.
 * @param {Object} featureTableJSON - Feature table JSON
 * @param {Buffer} [featureTableBinary] - A buffer containing the batch table binary
 * @returns {Object} An object with two parameters - (1) a boolean for whether the batch table follows the schema
 *                                                   (2) a message to indicate the validation result
 */

function validateFeatureTable(schema, featureTableJSON, featureTableBinary) {
    var ajv = new Ajv();
    var validSchema = ajv.validate(schema, featureTableJSON);
    var valid = validSchema;
    var message;

    if (!validSchema) {
        return {
            result: false,
            message: 'feature table JSON failed schema validation'
        };
    }

    return {
        result: valid,
        message: message
    };
}
