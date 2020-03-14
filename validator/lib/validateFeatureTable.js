'use strict';
const Cesium = require('cesium');

const utility = require('./utility');

const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

const componentTypeToByteLength = utility.componentTypeToByteLength;
const typeToComponentsLength = utility.typeToComponentsLength;

module.exports = validateFeatureTable;

/**
 * Checks if the feature table JSON and feature table binary are valid
 *
 * @param {Object} featureTableJson Feature table JSON.
 * @param {Buffer} featureTableBinary Feature table binary.
 * @param {Number} featuresLength The number of features.
 * @param {Object} featureTableSemantics An object containing semantic information for each feature table property, specific to the tile format.
 * @returns {String} An error message if validation fails, otherwise undefined.
 */
function validateFeatureTable(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics) {
    for (const name in featureTableJson) {
        if (featureTableJson.hasOwnProperty(name)) {
            const property = featureTableJson[name];
            const definition = featureTableSemantics[name];
            if (!defined(definition)) {
                return `Invalid feature table property "${name}".`;
            }
            const byteOffset = property.byteOffset;
            const componentType = defaultValue(property.componentType, definition.componentType);
            const componentTypeOptions = definition.componentTypeOptions;
            const type = definition.type;

            const componentsLength = typeToComponentsLength(type);
            const componentByteLength = componentTypeToByteLength(componentType);
            const itemsLength = definition.global ? 1 : featuresLength;

            if (defined(byteOffset)) {
                if (typeof byteOffset !== 'number') {
                    return `Feature table binary property "${name}" byteOffset must be a number.`;
                }
                if (defined(componentTypeOptions) && defined(componentTypeOptions) && componentTypeOptions.indexOf(componentType) === -1) {
                    return `Feature table binary property "${name}" has invalid componentType "${componentType}".`;
                }
                if (byteOffset % componentByteLength > 0) {
                    return `Feature table binary property "${name}" must be aligned to a ${componentByteLength}-byte boundary.`;
                }
                const propertyByteLength = componentsLength * componentByteLength * itemsLength;
                if (byteOffset + propertyByteLength > featureTableBinary.length) {
                    return `Feature table binary property "${name}" exceeds feature table binary byte length.`;
                }
            } else if (type === 'boolean') {
                if (typeof property !== 'boolean') {
                    return `Feature table property "${name}" must be a boolean.`;
                }
            } else {
                const arrayLength = componentsLength * itemsLength;
                if (definition.global && arrayLength === 1) {
                    if (typeof property !== 'number') {
                        return `Feature table property "${name}" must be a number.`;
                    }
                } else {
                    if (!Array.isArray(property)) {
                        return `Feature table property "${name}" must be an array.`;
                    }
                    if (property.length !== arrayLength) {
                        return `Feature table property "${name}" must be an array of length ${arrayLength}.`;
                    }
                    for (let i = 0; i < arrayLength; i++) {
                        if (typeof property[i] !== 'number') {
                            return `Feature table property "${name}" array must contain numbers only.`;
                        }
                    }
                }
            }
        }
    }
}
