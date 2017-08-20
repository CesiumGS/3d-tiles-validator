'use strict';
var Ajv = require('ajv');
var Cesium = require('cesium');
var utility = require('./utility');
var Promise = require('bluebird');

var componentTypeToByteLength = utility.componentTypeToByteLength;
var typeToComponentsLength = utility.typeToComponentsLength;

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = validateFeatureTable;

/**
 * Checks if the feature table JSON and feature table binary are valid
 *
 * @param {Object} schema A JSON object containing the schema for the feature table.
 * @param {Object} featureTableJson Feature table JSON.
 * @param {Buffer} featureTableBinary Feature table binary.
 * @param {Number} featuresLength The number of features.
 * @param {Object} featureTableSemantics An object containing semantic information for each feature table property, specific to the tile format.
 * @returns {String} An error message if validation fails, otherwise undefined.
 */
function validateFeatureTable(schema, featureTableJson, featureTableBinary, featuresLength, featureTableSemantics) {
    var message;
    for (var name in featureTableJson) {
        if (featureTableJson.hasOwnProperty(name)) {
            var property = featureTableJson[name];
            var definition = featureTableSemantics[name];
            if (!defined(definition)) {
                message = 'Invalid feature table property "' + name + '".';
                return Promise.resolve(message);
            }
            var byteOffset = property.byteOffset;
            var componentType = defaultValue(property.componentType, definition.componentType);
            var componentTypeOptions = definition.componentTypeOptions;
            var type = definition.type;

            var componentsLength = typeToComponentsLength(type);
            var componentByteLength = componentTypeToByteLength(componentType);
            var itemsLength = definition.global ? 1 : featuresLength;

            if (defined(byteOffset)) {
                if (typeof byteOffset !== 'number') {
                    message = 'Feature table binary property "' + name + '" byteOffset must be a number.';
                    return Promise.resolve(message);
                }
                if (defined(componentTypeOptions) && defined(componentTypeOptions) && componentTypeOptions.indexOf(componentType) === -1) {
                    message = 'Feature table binary property "' + name + '" has invalid componentType "' + componentType + '".';
                    return Promise.resolve(message);
                }
                if (byteOffset % componentByteLength > 0) {
                    message = 'Feature table binary property "' + name + '" must be aligned to a ' + componentByteLength + '-byte boundary.';
                    return Promise.resolve(message);
                }
                var propertyByteLength = componentsLength * componentByteLength * itemsLength;
                if (byteOffset + propertyByteLength > featureTableBinary.length) {
                    message = 'Feature table binary property "' + name + '" exceeds feature table binary byte length.';
                    return Promise.resolve(message);
                }
            } else if (type === 'boolean') {
                if (typeof property !== 'boolean') {
                    message = 'Feature table property "' + name + '" must be a boolean.';
                    return Promise.resolve(message);
                }
            } else {
                var arrayLength = componentsLength * itemsLength;
                if (definition.global && arrayLength === 1) {
                    if (typeof property !== 'number') {
                        message = 'Feature table property "' + name + '" must be a number.';
                        return Promise.resolve(message);
                    }
                } else {
                    if (!Array.isArray(property)) {
                        message = 'Feature table property "' + name + '" must be an array.';
                        return Promise.resolve(message);
                    }
                    if (property.length !== arrayLength) {
                        message = 'Feature table property "' + name + '" must be an array of length ' + arrayLength + '.';
                        return Promise.resolve(message);
                    }
                    for (var i = 0; i < arrayLength; ++i) {
                        if (typeof property[i] !== 'number') {
                            message = 'Feature table property "' + name + '" array must contain numbers only.';
                            return Promise.resolve(message);
                        }
                    }
                }
            }
        }
    }

    var ajv = new Ajv();
    var validSchema = ajv.validate(schema, featureTableJson);
    if (!validSchema) {
        message = 'Feature table JSON failed schema validation: ' + ajv.errorsText();
        return Promise.resolve(message);
    }

    if (!defined(message)) {
        return Promise.resolve(message);
    }
}
