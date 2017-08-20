'use strict';
var Ajv = require('ajv');
var Cesium = require('cesium');
var utility = require('./utility');
var Promise = require('bluebird');

var componentTypeToByteLength = utility.componentTypeToByteLength;
var typeToComponentsLength = utility.typeToComponentsLength;

var defined = Cesium.defined;

module.exports = validateBatchTable;

/**
 * Checks if the batch table JSON and batch table binary are valid
 *
 * @param {Object} schema A JSON object containing the schema for the batch table.
 * @param {Object} batchTableJson Batch table JSON.
 * @param {Buffer} batchTableBinary Batch table binary.
 * @param {Number} featuresLength The number of features.
 * @returns {String} An error message if validation fails, otherwise undefined.
 */
function validateBatchTable(schema, batchTableJson, batchTableBinary, featuresLength) {
    var message;
    for (var name in batchTableJson) {
        if (batchTableJson.hasOwnProperty(name)) {
            var property = batchTableJson[name];
            var byteOffset = property.byteOffset;

            if (defined(byteOffset)) {
                if (typeof byteOffset !== 'number') {
                    message = 'Batch table binary property "' + name + '" byteOffset must be a number.';
                    return Promise.resolve(message);
                }

                var componentType = property.componentType;
                var type = property.type;

                if (!defined(type)) {
                    message = 'Batch table binary property "' + name + '" must have a type.';
                    return Promise.resolve(message);
                }

                if (!defined(componentType)) {
                    message = 'Batch table binary property "' + name + '" must have a componentType.';
                    return Promise.resolve(message);
                }

                var componentsLength = typeToComponentsLength(type);
                var componentByteLength = componentTypeToByteLength(componentType);

                if (!defined(componentsLength)) {
                    message = 'Batch table binary property "' + name + '" has invalid type "' + type+ '".';
                    return Promise.resolve(message);
                }
                if (!defined(componentByteLength)) {
                    message = 'Batch table binary property "' + name + '" has invalid componentType "' + componentType + '".';
                    return Promise.resolve(message);
                }
                if (byteOffset % componentByteLength > 0) {
                    message = 'Batch table binary property "' + name + '" must be aligned to a ' + componentByteLength + '-byte boundary.';
                    return Promise.resolve(message);
                }
                var propertyByteLength = componentsLength * componentByteLength * featuresLength;
                if (byteOffset + propertyByteLength > batchTableBinary.length) {
                    message = 'Batch table binary property "' + name + '" exceeds batch table binary byte length.';
                    return Promise.resolve(message);
                }
            } else if (name === 'HIERARCHY') {
                // TODO : validate batch table hierarchy
            } else {
                if (!Array.isArray(property)) {
                    message = 'Batch table property "' + name + '" must be an array.';
                    return Promise.resolve(message);
                }
                if (property.length !== featuresLength) {
                    message = 'Batch table property "' + name + '" array length must equal features length ' + featuresLength + '.';
                    return Promise.resolve(message);
                }
            }
        }
    }

    var ajv = new Ajv();
    var validSchema = ajv.validate(schema, batchTableJson);
    if (!validSchema) {
        message = 'Batch table JSON failed schema validation: ' + ajv.errorsText();
        return Promise.resolve(message);
    }

    if (!defined(message)) {
        return Promise.resolve(message);
    }
}
