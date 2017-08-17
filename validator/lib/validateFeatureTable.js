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
    var message = checkPropertyOverlapping(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics);
    if (defined(message)) {
        return message;
    }

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
                    return 'Feature table binary property "' + name + '" byteOffset must be a number.';
                }
                if (defined(componentTypeOptions) && componentTypeOptions.indexOf(componentType) === -1) {
                    return 'Feature table binary property "' + name + '" has invalid componentType "' + componentType + '".';
                }
                if (byteOffset % componentByteLength > 0) {
                    return 'Feature table binary property "' + name + '" must be aligned to a ' + componentByteLength + '-byte boundary.';
                }
                var propertyByteLength = componentsLength * componentByteLength * itemsLength;
                
                if (byteOffset + propertyByteLength > featureTableBinary.length) {
                    return 'Feature table binary property "' + name + '" exceeds feature table binary byte length.';
                }
            } else if (type === 'boolean') {
                if (typeof property !== 'boolean') {
                    return 'Feature table property "' + name + '" must be a boolean.';
                }
            } else {
                var arrayLength = componentsLength * itemsLength;
                if (definition.global && arrayLength === 1) {
                    if (typeof property !== 'number') {
                        return 'Feature table property "' + name + '" must be a number.';
                    }
                } else {
                    if (!Array.isArray(property)) {
                        return 'Feature table property "' + name + '" must be an array.';
                    }
                    if (property.length !== arrayLength) {
                        return 'Feature table property "' + name + '" must be an array of length ' + arrayLength + '.';
                    }
                    for (var i = 0; i < arrayLength; ++i) {
                        if (typeof property[i] !== 'number') {
                            return 'Feature table property "' + name + '" array must contain numbers only.';
                        }
                    }
                }
            }
        }
    }

    var ajv = new Ajv();
    var validSchema = ajv.validate(schema, featureTableJson);
    if (!validSchema) {
        return 'Feature table JSON failed schema validation: ' + ajv.errorsText();
    }
}

function checkPropertyOverlapping(featureTableJson, featureTableBinary, featuresLength, featureTableSemantics) {
    function PropertyInfo(propertyName, currentByteOffset, totalOccupiedBytes, nextByteOffset) {
        this.propertyName = propertyName;
        this.currentByteOffset = currentByteOffset;
        this.totalOccupiedBytes = totalOccupiedBytes;
        this.nextByteOffset = nextByteOffset;
    }
    var count = 0;
    var arrayOfProperties = [];
    var message = undefined;
    
    for (var name in featureTableJson) {
        var property = featureTableJson[name];
        var definition = featureTableSemantics[name];
        if (!defined(definition)) {
            return message;
        }
        var byteOffset = property.byteOffset;
        var componentType = defaultValue(property.componentType, definition.componentType);
        var componentTypeOptions = definition.componentTypeOptions;
        var type = definition.type;
        var componentsLength = typeToComponentsLength(type);
        var componentByteLength = componentTypeToByteLength(componentType);
        var itemsLength = definition.global ? 1 : featuresLength;
        var propertyByteLength = componentsLength * componentByteLength * itemsLength;

        if (defined(byteOffset)) {
            var newProperty = new PropertyInfo(name, byteOffset, propertyByteLength, byteOffset + propertyByteLength);
            arrayOfProperties.push(newProperty);
        }
        count++;
    }

    // Return if only one property
    if (count == 1) {
        return message;
    }

    // Check overlap
    for (var i = 0; i < arrayOfProperties.length; ++i) {
        message = checkOverlap(arrayOfProperties, i);
        if (defined(message)) {
            break;
        }
    }
    return message;
}

function checkOverlap(arrayOfProperties, index) {
    var tempPropertyName = arrayOfProperties[index].propertyName;
    var tempCurrentByteOffset = arrayOfProperties[index].currentByteOffset;
    var tempNextByteOffset = arrayOfProperties[index].nextByteOffset;
    var message = undefined;

    for(var i = 0; i < arrayOfProperties.length; ++i) {
        if (i == index) {
            continue;
        }
        if (tempCurrentByteOffset < arrayOfProperties[i].currentByteOffset && tempNextByteOffset > arrayOfProperties[i].currentByteOffset) {
            message = 'binary of property \"' + tempPropertyName + '\" overlapps with \"' + arrayOfProperties[i].propertyName + '\".';
            break;
        } else if (tempCurrentByteOffset > arrayOfProperties[i].currentByteOffset && tempCurrentByteOffset < arrayOfProperties[i].nextByteOffset) {
            message = 'binary of property \"' + tempPropertyName + '\" overlapps with \"' + arrayOfProperties[i].propertyName + '\".';
            break;
        } else if (tempCurrentByteOffset == arrayOfProperties[i].currentByteOffset) {
            message = 'binary of property \"' + tempPropertyName + '\" overlapps with \"' + arrayOfProperties[i].propertyName + '\".';
            break;
        }
    }
    return message;
}