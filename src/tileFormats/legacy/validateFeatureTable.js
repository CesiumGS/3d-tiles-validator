/* eslint-disable */
// Mostly taken from https://github.com/CesiumGS/3d-tiles-validator/tree/e84202480eb6572383008076150c8e52c99af3c3
'use strict';

const utility = require('./utility');

const defaultValue = require("./defaultValue.js");
const defined = require("./defined.js");

const componentTypeToByteLength = utility.componentTypeToByteLength;
const typeToComponentsLength = utility.typeToComponentsLength;



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
            if (name === 'extensions' || name === 'extras') {
                continue;
            }
            const property = featureTableJson[name];
            const definition = featureTableSemantics[name];
            if (!defined(definition)) {
                return `Invalid feature table property "${name}".`;
            }
            if (hasDracoProperty(featureTableJson, name)) {
                continue;
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

function hasDracoProperty(featureTableJson, propertyName) {
    const extensions = featureTableJson.extensions;
    if (defined(extensions)) {
        const dracoExtension = extensions['3DTILES_draco_point_compression'];
        if (defined(dracoExtension)) {
            return defined(dracoExtension.properties[propertyName]);
        }
    }
    return false;
}


module.exports = validateFeatureTable;