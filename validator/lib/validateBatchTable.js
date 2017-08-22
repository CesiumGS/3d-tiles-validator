'use strict';
var Ajv = require('ajv');
var Cesium = require('cesium');
var utility = require('./utility');

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
    for (var name in batchTableJson) {
        if (batchTableJson.hasOwnProperty(name)) {
            var property = batchTableJson[name];
            var byteOffset = property.byteOffset;

            if (defined(byteOffset)) {
                if (typeof byteOffset !== 'number') {
                    return 'Batch table binary property "' + name + '" byteOffset must be a number.';
                }

                var componentType = property.componentType;
                var type = property.type;

                if (!defined(type)) {
                    return 'Batch table binary property "' + name + '" must have a type.';
                }

                if (!defined(componentType)) {
                    return 'Batch table binary property "' + name + '" must have a componentType.';
                }

                var componentsLength = typeToComponentsLength(type);
                var componentByteLength = componentTypeToByteLength(componentType);

                if (!defined(componentsLength)) {
                    return 'Batch table binary property "' + name + '" has invalid type "' + type+ '".';
                }
                if (!defined(componentByteLength)) {
                    return 'Batch table binary property "' + name + '" has invalid componentType "' + componentType + '".';
                }
                if (byteOffset % componentByteLength > 0) {
                    return 'Batch table binary property "' + name + '" must be aligned to a ' + componentByteLength + '-byte boundary.';
                }
                var propertyByteLength = componentsLength * componentByteLength * featuresLength;
                if (byteOffset + propertyByteLength > batchTableBinary.length) {
                    return 'Batch table binary property "' + name + '" exceeds batch table binary byte length.';
                }
            } else if (name === 'HIERARCHY') {
                // TODO : validate batch table hierarchy
            } else {
                if (!Array.isArray(property)) {
                    return 'Batch table property "' + name + '" must be an array.';
                }
                if (property.length !== featuresLength) {
                    return 'Batch table property "' + name + '" array length must equal features length ' + featuresLength + '.';
                }
            }
        }
    }

    var ajv = new Ajv();
    var validSchema = ajv.validate(schema, batchTableJson);
    if (!validSchema) {
        return 'Batch table JSON failed schema validation: ' + ajv.errorsText();
    }
}