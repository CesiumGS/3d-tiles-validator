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

                var instancesLength = tree['instancesLength'];
                if (instancesLength !== totalLength) {
                    return 'instancesLength must be equal to '+totalLength;
                }

                var classIdsLength = tree['classIds'].length;
                if (classIdsLength !== instancesLength) {
                    return 'length of classIds array must be equal to '+instancesLength;
                }

                for (var classId in tree['classIds']) {
                    if (defined(classId)) {
                        var classIdValue = tree['classIds'][classId];
                        if (classIdValue < 0 || classIdValue > classes.length-1) {
                            return 'classIds must be between 0-'+(classes.length-1);
                        }
                    }
                }

                var value;
                var parentIds = tree['parentIds'];
                var parentIdsLength = parentIds.length;
                var parentCounts = tree['parentCounts'];
                if (defined(parentCounts)) {
                    var parentCountsLength = parentCounts.length;
                    if (parentCountsLength !== instancesLength) {
                        return 'length of parentCounts array must be equal to '+instancesLength;
                    }
                    var sumValues = 0;
                    for (value in parentCounts) {
                        if (defined(value)) {
                            var pcValue = parentCounts[value];
                            if(pcValue < 0 || pcValue > instancesLength-1) {
                                return 'parentCounts values must be between 0-'+(instancesLength-1);
                            }
                            sumValues += pcValue;
                        }
                    }
                    if (defined(parentIds) && parentIdsLength !== sumValues) {
                        return 'length of parentIds array must be equal to '+sumValues;
                    }
                }
                else if (defined(parentIds)){
                    if (parentIdsLength !== instancesLength) {
                        return 'length of parentIds array must be equal to '+instancesLength;
                    }
                    for (value in parentIds) {
                        if (defined(value)) {
                            var pidValue = parentIds[value];
                            if(pidValue < 0 || pidValue > instancesLength-1) {
                                return 'parentIds must be between 0-'+(instancesLength-1);
                            }
                        }
                    }
                }

                if (defined(parentIds)) {
                    var valid = [];
                    var i;
                    for (i = 0; i < instancesLength; i++) {
                        valid[i] = false;
                    }
                    var parentArray = [];
                    if (defined(parentCounts)) {
                        var currentIndex = 0;
                        for (i = 0; i < instancesLength; i++) {
                            var numParents = parentCounts[i];
                            var parentsOfi = [];
                            if (numParents > 0) {
                                parentsOfi = parentIds.slice(currentIndex, currentIndex+numParents);
                            }
                            parentArray.push(parentsOfi);
                            currentIndex += numParents;
                        }
                    }
                    else {
                        for (i = 0; i < instancesLength; i++) {
                            if (parentIds[i] !== i) {
                                parentArray.push([parentIds[i]]);
                            }
                            else {
                                parentArray.push([]);
                            }
                        }
                    }
                    for (i = 0; i < instancesLength; i++) {
                        var l = parentArray[i].length;
                        if (!valid[i] && l !== 0) {
                            var stack = [];
                            var fail = cyclicDependencyCheck(i, stack, parentArray, parentCounts, valid);
                            if (fail) {
                                return 'cyclic dependencies not allowed';
                            }
                        }
                    }
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

function cyclicDependencyCheck(currentInstance, stack, parentArray, parentCounts, valid) {
    if (valid[currentInstance]) {
        return false;
    }
    stack.push(currentInstance);
    var length = parentArray[currentInstance].length;
    var fail = false;
    for (var i = 0; i < length && !fail; i++) {
        var instance = parentArray[currentInstance][i];
        var ind = stack.indexOf(instance);
        if (ind !== -1) {
            fail = true;
            return true;
        }
        fail = cyclicDependencyCheck(instance, stack, parentArray, parentCounts, valid);
        stack = [];
    }
    if (fail) {
        return true;
    }
    valid[currentInstance] = true;
    return false;
}
