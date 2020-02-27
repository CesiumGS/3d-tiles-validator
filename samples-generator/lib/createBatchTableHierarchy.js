'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');

var createB3dm = require('./createB3dm');
var createGltf = require('./createGltf');
var createTilesetJsonSingle = require('./createTilesetJsonSingle');
var Extensions = require('./Extensions');
var getBufferPadded = require('./getBufferPadded');
var Material = require('./Material');
var Mesh = require('./Mesh');
var saveTile = require('./saveTile');
var saveJson = require('./saveJson');

var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var Matrix4 = Cesium.Matrix4;
var Quaternion = Cesium.Quaternion;

module.exports = createBatchTableHierarchy;

var sizeOfFloat = 4;
var sizeOfUint16 = 2;

var whiteOpaqueMaterial = new Material({
    baseColor : [1.0, 1.0, 1.0, 1.0]
});

/**
 * Create a tileset that uses a batch table hierarchy,
 * by default using the 3DTILES_batch_table_hierarchy extension.
 *
 * @param {Object} options An object with the following properties:
 * @param {String} options.directory Directory in which to save the tileset.
 * @param {Boolean} [options.batchTableBinary=false] Create a batch table binary for the b3dm tile.
 * @param {Boolean} [options.noParents=false] Don't set any instance parents.
 * @param {Boolean} [options.multipleParents=false] Set multiple parents to some instances.
 * @param {Boolean} [options.legacy=false] Generate the batch table hierarchy as part of the base Batch Table, now deprecated.
 * @param {Matrix4} [options.transform=Matrix4.IDENTITY] The tile transform.
 * @param {Boolean} [options.gzip=false] Gzip the saved tile.
 * @param {Boolean} [options.prettyJson=true] Whether to prettify the JSON.
 * @returns {Promise} A promise that resolves when the tileset is saved.
 */

function createBatchTableHierarchy(options) {
    var useBatchTableBinary = defaultValue(options.batchTableBinary, false);
    var noParents = defaultValue(options.noParents, false);
    var multipleParents = defaultValue(options.multipleParents, false);
    var transform = defaultValue(options.transform, Matrix4.IDENTITY);

    var instances = createInstances(noParents, multipleParents);
    var batchTableJson = createBatchTableJson(instances, options);

    var batchTableBinary;
    if (useBatchTableBinary) {
        batchTableBinary = createBatchTableBinary(batchTableJson, options);  // Modifies the json in place
    }

    // Mesh urls listed in the same order as features in the classIds arrays
    var urls = [
        'data/house/doorknob0.gltf',
        'data/house/doorknob1.gltf',
        'data/house/doorknob2.gltf',
        'data/house/doorknob3.gltf',
        'data/house/door0.gltf',
        'data/house/door1.gltf',
        'data/house/door2.gltf',
        'data/house/door3.gltf',
        'data/house/roof.gltf',
        'data/house/wall.gltf'
    ];

    var buildingPositions = [
        new Cartesian3(40, 40, 0),
        new Cartesian3(-30, -20, 0),
        new Cartesian3(0, 0, 0)
    ];

    // glTF models are initially y-up, transform to z-up
    var yUpToZUp = Quaternion.fromAxisAngle(Cartesian3.UNIT_X, CesiumMath.PI_OVER_TWO);
    var scale = new Cartesian3(5.0, 5.0, 5.0); // Scale the models up a bit

    // Local transforms of the buildings within the tile
    var buildingTransforms = [
        Matrix4.fromTranslationQuaternionRotationScale(buildingPositions[0], yUpToZUp, scale),
        Matrix4.fromTranslationQuaternionRotationScale(buildingPositions[1], yUpToZUp, scale),
        Matrix4.fromTranslationQuaternionRotationScale(buildingPositions[2], yUpToZUp , scale)
    ];

    var contentUri = 'tile.b3dm';
    var directory = options.directory;
    var tilePath = path.join(directory, contentUri);
    var tilesetJsonPath = path.join(directory, 'tileset.json');

    var buildingsLength = 3;
    var meshesLength = urls.length;
    var batchLength = buildingsLength * meshesLength;
    var geometricError = 70.0;

    var box = [
        0, 0, 10,
        50, 0, 0,
        0, 50, 0,
        0, 0, 10
    ];

    var tilesetJson = createTilesetJsonSingle({
        contentUri : contentUri,
        geometricError : geometricError,
        box : box,
        transform : transform
    });

    if (!options.legacy) {
        Extensions.addExtensionsUsed(tilesetJson, '3DTILES_batch_table_hierarchy');
        Extensions.addExtensionsRequired(tilesetJson, '3DTILES_batch_table_hierarchy');
    }

    var featureTableJson = {
        BATCH_LENGTH : batchLength
    };

    return Promise.map(urls, function(url) {
        return fsExtra.readJson(url)
            .then(function(gltf) {
                return Mesh.fromGltf(gltf);
            });
    }).then(function(meshes) {
        var meshesLength = meshes.length;
        var clonedMeshes = [];
        for (var i = 0; i < buildingsLength; ++i) {
            for (var j = 0; j < meshesLength; ++j) {
                var mesh = Mesh.clone(meshes[j]);
                mesh.material = whiteOpaqueMaterial;
                mesh.transform(buildingTransforms[i]);
                clonedMeshes.push(mesh);
            }
        }
        var batchedMesh = Mesh.batch(clonedMeshes);
        return createGltf({
            mesh : batchedMesh
        });
    }).then(function(glb) {
        var b3dm = createB3dm({
            glb : glb,
            featureTableJson : featureTableJson,
            batchTableJson : batchTableJson,
            batchTableBinary : batchTableBinary
        });
        return Promise.all([
            saveJson(tilesetJsonPath, tilesetJson, options.prettyJson),
            saveTile(tilePath, b3dm, options.gzip)
        ]);
    });
}

function createFloatBuffer(values) {
    var buffer = Buffer.alloc(values.length * sizeOfFloat);
    var length = values.length;
    for (var i = 0; i < length; ++i) {
        buffer.writeFloatLE(values[i], i * sizeOfFloat);
    }
    return buffer;
}

function createUInt16Buffer(values) {
    var buffer = Buffer.alloc(values.length * sizeOfUint16);
    var length = values.length;
    for (var i = 0; i < length; ++i) {
        buffer.writeUInt16LE(values[i], i * sizeOfUint16);
    }
    return buffer;
}

function createBatchTableBinary(batchTable, options) {
    var byteOffset = 0;
    var buffers = [];

    function createBinaryProperty(values, componentType, type) {
        var buffer;
        if (componentType === 'FLOAT') {
            buffer = createFloatBuffer(values);
        } else if (componentType === 'UNSIGNED_SHORT') {
            buffer = createUInt16Buffer(values);
        }
        buffer = getBufferPadded(buffer);
        buffers.push(buffer);
        var binaryReference = {
            byteOffset : byteOffset,
            componentType : componentType,
            type : type
        };
        byteOffset += buffer.length;
        return binaryReference;
    }

    // Convert regular batch table properties to binary
    var propertyName;
    for (propertyName in batchTable) {
        if (batchTable.hasOwnProperty(propertyName)
                && propertyName !== 'HIERARCHY'
                && propertyName !== 'extensions'
                && propertyName !== 'extras') {
            if (typeof batchTable[propertyName][0] === 'number') {
                batchTable[propertyName] = createBinaryProperty(batchTable[propertyName], 'FLOAT', 'SCALAR');
            }
        }
    }

    // Convert instance properties to binary
    var hierarchy = options.legacy ? batchTable.HIERARCHY : batchTable.extensions['3DTILES_batch_table_hierarchy'];
    var classes = hierarchy.classes;
    var classesLength = classes.length;
    for (var i = 0; i < classesLength; ++i) {
        var instances = classes[i].instances;
        for (propertyName in instances) {
            if (instances.hasOwnProperty(propertyName)) {
                if (typeof instances[propertyName][0] === 'number') {
                    instances[propertyName] = createBinaryProperty(instances[propertyName], 'FLOAT', 'SCALAR');
                }
            }
        }
    }

    // Convert classIds to binary
    hierarchy.classIds = createBinaryProperty(hierarchy.classIds, 'UNSIGNED_SHORT');

    // Convert parentCounts to binary (if they exist)
    if (defined(hierarchy.parentCounts)) {
        hierarchy.parentCounts = createBinaryProperty(hierarchy.parentCounts, 'UNSIGNED_SHORT');
    }

    // Convert parentIds to binary (if they exist)
    if (defined(hierarchy.parentIds)) {
        hierarchy.parentIds = createBinaryProperty(hierarchy.parentIds, 'UNSIGNED_SHORT');
    }

    return Buffer.concat(buffers);
}

function createBatchTableJson(instances, options) {
    // Create batch table from the instances' regular properties
    var batchTable = {};
    var instancesLength = instances.length;
    for (var i = 0; i < instancesLength; ++i) {
        var instance = instances[i];
        var properties = instance.properties;
        if (defined(properties)) {
            for (var propertyName in properties) {
                if (properties.hasOwnProperty(propertyName)) {
                    if (!defined(batchTable[propertyName])) {
                        batchTable[propertyName] = [];
                    }
                    batchTable[propertyName].push(properties[propertyName]);
                }
            }
        }
    }

    var hierarchy = createHierarchy(instances);
    if (options.legacy) {
        // Add HIERARCHY object
        batchTable.HIERARCHY = hierarchy;
    } else {
        Extensions.addExtension(batchTable, '3DTILES_batch_table_hierarchy', hierarchy);
    }

    return batchTable;
}

function createHierarchy(instances) {
    var i;
    var j;
    var classes = [];
    var classIds = [];
    var parentCounts = [];
    var parentIds = [];
    var instancesLength = instances.length;
    var classId;
    var classData;

    for (i = 0; i < instancesLength; ++i) {
        var instance = instances[i].instance;
        var className = instance.className;
        var properties = instance.properties;
        var parents = defaultValue(instance.parents, []);
        var parentsLength = parents.length;

        // Get class id
        classId = undefined;
        classData = undefined;
        var classesLength = classes.length;
        for (j = 0; j < classesLength; ++j) {
            if (classes[j].name === className) {
                classId = j;
                classData = classes[j];
                break;
            }
        }

        // Create class if it doesn't already exist
        if (!defined(classId)) {
            classData = {
                name : className,
                length : 0,
                instances : {}
            };
            classId = classes.length;
            classes.push(classData);
            var propertyNames = Object.keys(properties);
            var propertyNamesLength = propertyNames.length;
            for (j = 0; j < propertyNamesLength; ++j) {
                classData.instances[propertyNames[j]] = [];
            }
        }

        // Add properties to class
        for (var propertyName in properties) {
            if (properties.hasOwnProperty(propertyName)) {
                classData.instances[propertyName].push(properties[propertyName]);
            }
        }

        // Increment class instances length
        classData.length++;

        // Add to classIds
        classIds.push(classId);

        // Add to parentCounts
        parentCounts.push(parentsLength);

        // Add to parent ids
        for (j = 0; j < parentsLength; ++j) {
            var parent = parents[j];
            var parentId = instances.indexOf(parent);
            parentIds.push(parentId);
        }
    }

    // Check if any of the instances have multiple parents, or if none of the instances have parents
    var singleParents = true;
    var noParents = true;
    for (i = 0; i < instancesLength; ++i) {
        if (parentCounts[i] > 0) {
            noParents = false;
        }
        if (parentCounts[i] > 1) {
            singleParents = false;
        }
    }

    if (noParents) {
        // Unlink parentCounts and parentIds
        parentCounts = undefined;
        parentIds = undefined;
    } else if (singleParents) {
        // Unlink parentCounts and add missing parentIds that point to themselves
        for (i = 0; i < instancesLength; ++i) {
            if (parentCounts[i] === 0) {
                parentIds.splice(i, 0, i);
            }
        }
        parentCounts = undefined;
    }

    return {
        instancesLength : instancesLength,
        classes : classes,
        classIds : classIds,
        parentIds : parentIds,
        parentCounts : parentCounts
    };
}

function createInstances(noParents, multipleParents) {
    var door0 = {
        instance : {
            className : 'door',
            properties : {
                door_name : 'door0',
                door_width : 1.2,
                door_mass : 10
            }
        },
        properties : {
            height : 5.0,
            area : 10.0
        }
    };
    var door1 = {
        instance : {
            className : 'door',
            properties : {
                door_name : 'door1',
                door_width : 1.3,
                door_mass : 11
            }
        },
        properties : {
            height : 5.0,
            area : 10.0
        }
    };
    var door2 = {
        instance : {
            className : 'door',
            properties : {
                door_name : 'door2',
                door_width : 1.21,
                door_mass : 14
            }
        },
        properties : {
            height : 5.0,
            area : 10.0
        }
    };
    var door3 = {
        instance : {
            className : 'door',
            properties : {
                door_name : 'door3',
                door_width : 1.5,
                door_mass : 7
            }
        },
        properties : {
            height : 5.0,
            area : 10.0
        }
    };
    var door4 = {
        instance : {
            className : 'door',
            properties : {
                door_name : 'door4',
                door_width : 1.1,
                door_mass : 8
            }
        },
        properties : {
            height : 5.0,
            area : 10.0
        }
    };
    var door5 = {
        instance : {
            className : 'door',
            properties : {
                door_name : 'door5',
                door_width : 1.15,
                door_mass : 12
            }
        },
        properties : {
            height : 5.0,
            area : 10.0
        }
    };
    var door6 = {
        instance : {
            className : 'door',
            properties : {
                door_name : 'door6',
                door_width : 1.32,
                door_mass : 3
            }
        },
        properties : {
            height : 5.0,
            area : 10.0
        }
    };
    var door7 = {
        instance : {
            className : 'door',
            properties : {
                door_name : 'door7',
                door_width : 1.54,
                door_mass : 6
            }
        },
        properties : {
            height : 5.0,
            area : 10.0
        }
    };
    var door8 = {
        instance : {
            className : 'door',
            properties : {
                door_name : 'door8',
                door_width : 1.8,
                door_mass : 3
            }
        },
        properties : {
            height : 5.0,
            area : 10.0
        }
    };
    var door9 = {
        instance : {
            className : 'door',
            properties : {
                door_name : 'door9',
                door_width : 2.0,
                door_mass : 5
            }
        },
        properties : {
            height : 5.0,
            area : 10.0
        }
    };
    var door10 = {
        instance : {
            className : 'door',
            properties : {
                door_name : 'door10',
                door_width : 2.1,
                door_mass : 9
            }
        },
        properties : {
            height : 5.0,
            area : 10.0
        }
    };
    var door11 = {
        instance : {
            className : 'door',
            properties : {
                door_name : 'door11',
                door_width : 1.3,
                door_mass : 10
            }
        },
        properties : {
            height : 5.0,
            area : 10.0
        }
    };
    var doorknob0 = {
        instance : {
            className : 'doorknob',
            properties : {
                doorknob_name : 'doorknob0',
                doorknob_size : 0.3
            }
        },
        properties : {
            height : 0.1,
            area : 0.2
        }
    };
    var doorknob1 = {
        instance : {
            className : 'doorknob',
            properties : {
                doorknob_name : 'doorknob1',
                doorknob_size : 0.43
            }
        },
        properties : {
            height : 0.1,
            area : 0.2
        }
    };
    var doorknob2 = {
        instance : {
            className : 'doorknob',
            properties : {
                doorknob_name : 'doorknob2',
                doorknob_size : 0.32
            }
        },
        properties : {
            height : 0.1,
            area : 0.2
        }
    };
    var doorknob3 = {
        instance : {
            className : 'doorknob',
            properties : {
                doorknob_name : 'doorknob3',
                doorknob_size : 0.2
            }
        },
        properties : {
            height : 0.1,
            area : 0.2
        }
    };
    var doorknob4 = {
        instance : {
            className : 'doorknob',
            properties : {
                doorknob_name : 'doorknob4',
                doorknob_size : 0.21
            }
        },
        properties : {
            height : 0.1,
            area : 0.2
        }
    };
    var doorknob5 = {
        instance : {
            className : 'doorknob',
            properties : {
                doorknob_name : 'doorknob5',
                doorknob_size : 0.35
            }
        },
        properties : {
            height : 0.1,
            area : 0.2
        }
    };
    var doorknob6 = {
        instance : {
            className : 'doorknob',
            properties : {
                doorknob_name : 'doorknob6',
                doorknob_size : 0.3
            }
        },
        properties : {
            height : 0.1,
            area : 0.2
        }
    };
    var doorknob7 = {
        instance : {
            className : 'doorknob',
            properties : {
                doorknob_name : 'doorknob7',
                doorknob_size : 0.23
            }
        },
        properties : {
            height : 0.1,
            area : 0.2
        }
    };
    var doorknob8 = {
        instance : {
            className : 'doorknob',
            properties : {
                doorknob_name : 'doorknob8',
                doorknob_size : 0.43
            }
        },
        properties : {
            height : 0.1,
            area : 0.2
        }
    };
    var doorknob9 = {
        instance : {
            className : 'doorknob',
            properties : {
                doorknob_name : 'doorknob9',
                doorknob_size : 0.32
            }
        },
        properties : {
            height : 0.1,
            area : 0.2
        }
    };
    var doorknob10 = {
        instance : {
            className : 'doorknob',
            properties : {
                doorknob_name : 'doorknob10',
                doorknob_size : 0.41
            }
        },
        properties : {
            height : 0.1,
            area : 0.2
        }
    };
    var doorknob11 = {
        instance : {
            className : 'doorknob',
            properties : {
                doorknob_name : 'doorknob11',
                doorknob_size : 0.33
            }
        },
        properties : {
            height : 0.1,
            area : 0.2
        }
    };
    var roof0 = {
        instance : {
            className : 'roof',
            properties : {
                roof_name : 'roof0',
                roof_paint : 'red'
            }
        },
        properties : {
            height : 6.0,
            area : 12.0
        }
    };
    var roof1 = {
        instance : {
            className : 'roof',
            properties : {
                roof_name : 'roof1',
                roof_paint : 'blue'
            }
        },
        properties : {
            height : 6.0,
            area : 12.0
        }
    };
    var roof2 = {
        instance : {
            className : 'roof',
            properties : {
                roof_name : 'roof2',
                roof_paint : 'yellow'
            }
        },
        properties : {
            height : 6.0,
            area : 12.0
        }
    };
    var wall0 = {
        instance : {
            className : 'wall',
            properties : {
                wall_name : 'wall0',
                wall_paint : 'pink',
                wall_windows : 1
            }
        },
        properties : {
            height : 10.0,
            area : 20.0
        }
    };
    var wall1 = {
        instance : {
            className : 'wall',
            properties : {
                wall_name : 'wall1',
                wall_paint : 'orange',
                wall_windows : 2
            }
        },
        properties : {
            height : 10.0,
            area : 20.0
        }
    };
    var wall2 = {
        instance : {
            className : 'wall',
            properties : {
                wall_name : 'wall2',
                wall_paint : 'blue',
                wall_windows : 4
            }
        },
        properties : {
            height : 10.0,
            area : 20.0
        }
    };
    var building0 = {
        instance : {
            className : 'building',
            properties : {
                building_name : 'building0',
                building_area : 20.0
            }
        }
    };
    var building1 = {
        instance : {
            className : 'building',
            properties : {
                building_name : 'building1',
                building_area : 21.98
            }
        }
    };
    var building2 = {
        instance : {
            className : 'building',
            properties : {
                building_name : 'building2',
                building_area : 39.3
            }
        }
    };
    var zone0 = {
        instance : {
            className : 'zone',
            properties : {
                zone_name : 'zone0',
                zone_buildings : 3
            }
        }
    };
    var classifierNew = {
        instance : {
            className : 'classifier_new',
            properties : {
                year : 2000,
                color : 'red',
                name : 'project',
                architect : 'architect'
            }
        }
    };
    var classifierOld = {
        instance : {
            className : 'classifier_old',
            properties : {
                description : 'built in 1980',
                inspection : 2009
            }
        }
    };

    if (noParents) {
        return [
            doorknob0, doorknob1, doorknob2, doorknob3, door0, door1, door2, door3, roof0, wall0,
            doorknob4, doorknob5, doorknob6, doorknob7, door4, door5, door6, door7, roof1, wall1,
            doorknob8, doorknob9, doorknob10, doorknob11, door8, door9, door10, door11, roof2, wall2
        ];
    }
    door0.instance.parents = [building0];
    door1.instance.parents = [building0];
    door2.instance.parents = [building0];
    door3.instance.parents = [building0];
    door4.instance.parents = [building1];
    door5.instance.parents = [building1];
    door6.instance.parents = [building1];
    door7.instance.parents = [building1];
    door8.instance.parents = [building2];
    door9.instance.parents = [building2];
    door10.instance.parents = [building2];
    door11.instance.parents = [building2];
    doorknob0.instance.parents = [door0];
    doorknob1.instance.parents = [door1];
    doorknob2.instance.parents = [door2];
    doorknob3.instance.parents = [door3];
    doorknob4.instance.parents = [door4];
    doorknob5.instance.parents = [door5];
    doorknob6.instance.parents = [door6];
    doorknob7.instance.parents = [door7];
    doorknob8.instance.parents = [door8];
    doorknob9.instance.parents = [door9];
    doorknob10.instance.parents = [door10];
    doorknob11.instance.parents = [door11];
    roof0.instance.parents = [building0];
    roof1.instance.parents = [building1];
    roof2.instance.parents = [building2];
    wall0.instance.parents = [building0];
    wall1.instance.parents = [building1];
    wall2.instance.parents = [building2];
    building0.instance.parents = [zone0];
    building1.instance.parents = [zone0];
    building2.instance.parents = [zone0];

    if (multipleParents) {
        door0.instance.parents.push(classifierOld);
        building0.instance.parents.push(classifierNew);
        building1.instance.parents.push(classifierOld);
        building2.instance.parents.push(classifierNew, classifierOld);
        return [
            doorknob0, doorknob1, doorknob2, doorknob3, door0, door1, door2, door3, roof0, wall0,
            doorknob4, doorknob5, doorknob6, doorknob7, door4, door5, door6, door7, roof1, wall1,
            doorknob8, doorknob9, doorknob10, doorknob11, door8, door9, door10, door11, roof2, wall2,
            building0, building1, building2, zone0, classifierNew, classifierOld
        ];
    }
    return [
            doorknob0, doorknob1, doorknob2, doorknob3, door0, door1, door2, door3, roof0, wall0,
            doorknob4, doorknob5, doorknob6, doorknob7, door4, door5, door6, door7, roof1, wall1,
            doorknob8, doorknob9, doorknob10, doorknob11, door8, door9, door10, door11, roof2, wall2,
            building0, building1, building2, zone0
    ];
}
