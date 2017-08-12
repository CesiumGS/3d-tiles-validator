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
                var tree = batchTableJson['HIERARCHY'];
                var totalLength = 0;
                // CHECK - error if instance has more elements than class\'s length property
                var classes = tree['classes'];
                for (var className in classes) {
                    if (defined(className)) {
                        var length = classes[className]['length'];
                        totalLength += length;
                        var instances = classes[className]['instances'];
                        for (var instanceName in instances) {
                            if(defined(instanceName)) {
                                var instance = instances[instanceName];
                                if (instance.length !== length) {
                                    return 'instance ' + instanceName + ' of class ' + classes[className]['name'] + ' must have ' + length + ' elements';
                                }
                            }
                        }
                    }
                }
                // CHECK - instancesLength must be equal to sum of length property of all classes
                var instancesLength = tree['instancesLength'];
                if (instancesLength !== totalLength) {
                    return 'instancesLength must be equal to '+totalLength;
                }

                var classIdsLength = tree['classIds'].length;
                if (classIdsLength !== instancesLength) {
                    return 'length of classIds array must be equal to '+instancesLength;
                }

                var parentIdsLength = tree['parentIds'].length;
                var parentCounts = tree['parentCounts'];
                if (defined(parentCounts)) {
                    var parentCountsLength = parentCounts.length;
                    if (parentCountsLength !== instancesLength) {
                        return 'length of parentCounts array must be equal to '+instancesLength;
                    }
                    var sumValues = 0;
                    for (var value in parentCounts) {
                        if (defined(value)) {
                            sumValues += parentCounts[value];
                        }
                    }
                    if (parentIdsLength !== sumValues) {
                        return 'length of parentIds array must be equal to '+sumValues;
                    }
                }
                else if (parentIdsLength !== instancesLength) {
                        return 'length of parentIds array must be equal to '+instancesLength;
                }
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
