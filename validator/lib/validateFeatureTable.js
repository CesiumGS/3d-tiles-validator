'use strict';
var Ajv = require('ajv');
var Cesium = require('cesium');
var utility = require('./utility');

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
    for (var name in featureTableJson) {
        if (featureTableJson.hasOwnProperty(name)) {
            var property = featureTableJson[name];
            var definition = featureTableSemantics[name];
            if (!defined(definition)) {
                return 'Invalid feature table property "' + name + '".';
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
                    return 'byteOffset must be a number';
                }
                if (defined(componentTypeOptions) && componentTypeOptions.indexOf(componentType) === -1) {
                    return 'invalid componentType: "' + componentType + '"';
                }
                if (byteOffset % componentByteLength > 0) {
                    return 'Property "' + name + '" must be aligned to a ' + componentByteLength + '-byte boundary';
                }
                var propertyByteLength = componentsLength * componentByteLength * itemsLength;
                if (byteOffset + propertyByteLength > featureTableBinary.length) {
                    return 'Property "' + name + '" exceeds feature table binary byte length';
                }
            } else {
                if (type === 'boolean' && (typeof property !== 'boolean')) {
                    return 'Property "' + name + '" must be a boolean';
                } else if (componentsLength === 1) {
                    if (typeof property !== 'number') {
                        return 'Property "' + name + '" must be a number';
                    }
                } else if (componentsLength > 1) {
                    if (!Array.isArray(property)) {
                        return 'Property "' + name + '" must be an array';
                    }
                    var arrayLength = componentsLength * itemsLength;
                    if (property.length !== arrayLength) {
                        return 'Length of "' + name + '" array must equal ' + arrayLength;
                    }
                    for (var i = 0; i < arrayLength; ++i) {
                        if (typeof property[i] !== 'number') {
                            return 'Elements of the "' + name + '" array must be numbers';
                        }
                    }
                }
            }
        }
    }

    var ajv = new Ajv();
    var validSchema = ajv.validate(schema, featureTableJson);
    if (!validSchema) {
        return 'feature table JSON failed schema validation: ' + ajv.errorsText();
    }
}
