'use strict';
var Cesium = require('cesium');
var GltfPipeline = require('gltf-pipeline');
var path = require('path');
var Promise = require('bluebird');
var zlib = require('zlib');
var extractB3dm = require('./extractB3dm');
var getDefaultWriteCallback = require('./getDefaultWriteCallback');
var getJsonBufferPadded = require('./getJsonBufferPadded');
var glbToB3dm = require('./glbToB3dm');
var isGzippedFile = require('./isGzippedFile');
var isJson = require('./isJson');
var readFile = require('./readFile');

var getBinaryGltf = GltfPipeline.getBinaryGltf;
var loadGltfUris = GltfPipeline.loadGltfUris;
var parseBinaryGltf = GltfPipeline.parseBinaryGltf;

var Cartesian3 = Cesium.Cartesian3;
var CesiumMath = Cesium.Math;
var Check = Cesium.Check;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var Matrix4 = Cesium.Matrix4;

module.exports = rtcToTransform;

/**
 * Remove the CESIUM_RTC extension from tiles and use a tileset transform instead.
 *
 * @param {Object} options Object with the following properties:
 * @param {String} options.inputDirectory Path to the input directory.
 * @param {Object} [options.outputDirectory] Path to the output directory.
 * @param {String} [options.rootJson='tileset.json'] Relative path to the root json.
 * @param {WriteCallback} [options.writeCallback] A callback function that writes files after they have been processed.
 * @param {LogCallback} [options.logCallback] A callback function that logs messages.
 *
 * @returns {Promise} A promise that resolves when the operation completes.
 */
function rtcToTransform(options) {
    options = defaultValue(options, {});
    var inputDirectory = options.inputDirectory;
    var outputDirectory = options.outputDirectory;
    var rootJson = defaultValue(options.rootJson, 'tileset.json');

    Check.typeOf.string('options.inputDirectory', inputDirectory);

    inputDirectory = path.normalize(inputDirectory);
    outputDirectory = path.normalize(defaultValue(outputDirectory,
        path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-transform')));
    rootJson = path.join(inputDirectory, rootJson);

    options.inputDirectory = inputDirectory;
    options.outputDirectory = outputDirectory;
    options.rootJson = rootJson;
    options.writeCallback = defaultValue(options.writeCallback, getDefaultWriteCallback(outputDirectory));

    var tilePromises = [];
    var jsonMap = {};

    var tilesetPromise = editTileset(rootJson, tilePromises, jsonMap, options);

    return tilesetPromise
        .then(function() {
            return Promise.all(tilePromises);
        })
        .then(function() {
            editRootTranslation(rootJson, jsonMap);
            editTransforms(rootJson, jsonMap, Cartesian3.ZERO);

            // Write out json files
            return Promise.map(Object.keys(jsonMap), function (jsonFile) {
                var json = jsonMap[jsonFile];
                return isGzippedFile(jsonFile)
                    .then(function (gzipped) {
                        var data = getJsonBufferPadded(json);
                        var relativePath = path.relative(inputDirectory, jsonFile);
                        return options.writeCallback(relativePath, data);
                    });
            });
        });
}

function editRootTranslationHelper(tile, tilesetDirectory, jsonMap, childTranslations) {
    if (defined(tile.content)) {
        var contentUrl = tile.content.url;
        var translation = tile.transform;
        if (defined(translation)) {
            if (!Cartesian3.equals(translation, Cartesian3.ZERO)) {
                childTranslations.push(translation);
                return;
            }
        }
        if (isJson(contentUrl)) {
            var externalTilesetFile = path.join(tilesetDirectory, contentUrl);
            var externalTilesetDirectory = path.dirname(externalTilesetFile);
            var root = jsonMap[externalTilesetFile].root;
            editRootTranslationHelper(root, externalTilesetDirectory, jsonMap, childTranslations);
        }
    }

    var children = tile.children;
    if (defined(children)) {
        var length = children.length;
        for (var i = 0; i < length; ++i) {
            editRootTranslationHelper(children[i], tilesetDirectory, jsonMap, childTranslations);
        }
    }
}

function editRootTranslation(rootJson, jsonMap) {
    var tilesetDirectory = path.dirname(rootJson);
    var json = jsonMap[rootJson];
    var root = json.root;
    var childTranslations = [];
    editRootTranslationHelper(root, tilesetDirectory, jsonMap, childTranslations);

    var average = new Cartesian3();
    var length = childTranslations.length;
    for (var i = 0; i < length; ++i) {
        Cartesian3.add(average, childTranslations[i], average);
    }
    Cartesian3.divideByScalar(average, length, average);
    root.transform = average;
}

function editBoundingVolume(boundingVolume, translation)
{
    var sphere = boundingVolume.sphere;
    var box = boundingVolume.box;
    if (defined(sphere)) {
        sphere[0] -= translation.x;
        sphere[1] -= translation.y;
        sphere[2] -= translation.z;
    } else if (defined(boundingVolume.box)) {
        box[0] -= translation.x;
        box[1] -= translation.y;
        box[2] -= translation.z;
    }
}

// function editTransformsHelper(parentTranslation, tile, tilesetDirectory, jsonMap)
// {
//     var translation = defaultValue(tile.transform, Cartesian3.ZERO);
//     if (Cartesian3.equals(translation, Cartesian3.ZERO)) {
//         translation = parentTranslation;
//     }
//
//     if (defined(tile.content)) {
//         var contentUrl = tile.content.url;
//         if (isJson(contentUrl)) {
//             var externalTilesetFile = path.join(tilesetDirectory, contentUrl);
//             var externalTilesetDirectory = path.dirname(externalTilesetFile);
//             var root = jsonMap[externalTilesetFile].root;
//             editTransformsHelper(translation, root, externalTilesetDirectory, jsonMap);
//         }
//     }
//
//     var children = tile.children;
//     if (defined(children)) {
//         var length = children.length;
//         for (var i = 0; i < length; ++i) {
//             editTransformsHelper(translation, children[i], tilesetDirectory, jsonMap);
//         }
//     }
//
//     if (defined(tile.boundingVolume)) {
//         editBoundingVolume(tile.boundingVolume, translation);
//         if (defined(tile.content) && defined(tile.content.boundingVolume)) {
//             editBoundingVolume(tile.content.boundingVolume, translation);
//         }
//     }
//
//     delete tile.transform;
//
//     var difference = Cartesian3.subtract(translation, parentTranslation, scratchCartesian);
//     if (!Cartesian3.equalsEpsilon(difference, Cartesian3.ZERO, CesiumMath.EPSILON5)) {
//         var matrix = Matrix4.fromTranslation(difference);
//         tile.transform = Matrix4.pack(matrix, new Array(16));
//     }
// }

function editTransforms(jsonFile, jsonMap, parentTranslation) {
    var tilesetDirectory = path.dirname(jsonFile);
    var root = jsonMap[jsonFile].root;
    var stack = [];
    stack.push({
        tile : root,
        parentTranslation : parentTranslation
    });
    while (stack.length > 0) {
        var item = stack.pop();
        var tile = item.tile;
        parentTranslation = item.parentTranslation;

        var translation = defaultValue(tile.transform, Cartesian3.ZERO);
        if (Cartesian3.equals(translation, Cartesian3.ZERO)) {
            translation = parentTranslation;
        }

        if (defined(tile.content)) {
            var contentUrl = tile.content.url;
            if (isJson(contentUrl)) {
                var externalTilesetFile = path.join(tilesetDirectory, contentUrl);
                editTransforms(externalTilesetFile, jsonMap, translation);
            }
        }

        var children = tile.children;
        if (defined(children)) {
            var length = children.length;
            for (var i = 0; i < length; ++i) {
                stack.push({
                    tile : children[i],
                    parentTranslation : translation
                });
            }
        }

        if (defined(tile.boundingVolume)) {
            editBoundingVolume(tile.boundingVolume, translation);
            if (defined(tile.content) && defined(tile.content.boundingVolume)) {
                editBoundingVolume(tile.content.boundingVolume, translation);
            }
        }

        delete tile.transform;

        var difference = Cartesian3.subtract(translation, parentTranslation, scratchCartesian);
        if (!Cartesian3.equalsEpsilon(difference, Cartesian3.ZERO, CesiumMath.EPSILON5)) {
            var matrix = Matrix4.fromTranslation(difference);
            tile.transform = Matrix4.pack(matrix, new Array(16));
        }
    }
}

function editTileset(jsonFile, tilePromises, jsonMap, options) {
    return readFile(jsonFile, 'json')
        .then(function(json) {
            var tilesetDirectory = path.dirname(jsonFile);
            var promises = [];
            var root = json.root;

            if (defined(root)) {
                var stack = [];
                stack.push(json.root);
                while (stack.length > 0) {
                    var tile = stack.pop();
                    if (defined(tile.content)) {
                        var url = path.join(tilesetDirectory, tile.content.url);
                        if (isJson(url)) {
                            promises.push(editTileset(url, tilePromises, jsonMap, options));
                        } else if (path.extname(url) === '.b3dm') { // TODO : work with cmpt too
                            tilePromises.push(editTile(tile, url, options));
                        }
                    }
                    // Push children to the stack
                    var children = tile.children;
                    if (defined(children)) {
                        var length = children.length;
                        for (var i = 0; i < length; ++i) {
                            stack.push(children[i]);
                        }
                    }
                }
            }
            // Waits for all the external tilesets to finish loading before the promise resolves
            return Promise.all(promises)
                .then(function () {
                    jsonMap[jsonFile] = json;
                });
        });
}

var scratchCartesian = new Cartesian3();

function editTile(tile, url, options) {
    return isGzippedFile(url)
        .then(function (gzipped) {
            return readFile(url)
                .then(function(data) {
                    return extractRTC(data, options)
                        .then(function(results) {
                            var b3dm = results.b3dm;
                            var rtc = results.rtc;
                            tile.transform = rtc; // Will be converted to a matrix later
                            if (gzipped) {
                                b3dm = zlib.gzipSync(b3dm);
                            }
                            var relativePath = path.relative(options.inputDirectory, url);
                            return options.writeCallback(relativePath, b3dm);
                        })
                });
        });
}


function extractRTC(data, options) {
    var b3dmExtracted = extractB3dm(data);
    var glb = b3dmExtracted.glb;
    var gltf = parseBinaryGltf(glb);
    var extensions = gltf.extensions;

    if (!defined(extensions) || !defined(extensions.CESIUM_RTC)) {
        options.logCallback('No CESIUM_RTC extension found in this tile. Tile will not be modified.');
        return Promise.resolve({
            b3dm : data,
            rtc : new Cartesian3()
        });
    }

    var rtc = gltf.extensions.CESIUM_RTC.center;
    delete extensions.CESIUM_RTC;
    if (Object.keys(extensions).length === 0) {
        delete gltf.extensions;
    }

    return loadGltfUris(gltf)
        .then(function() {
            return getBinaryGltf(gltf, true, true).glb;
        })
        .then(function(glb) {
            var b3dm = glbToB3dm(glb, b3dmExtracted.featureTable.json, b3dmExtracted.featureTable.binary, b3dmExtracted.batchTable.json, b3dmExtracted.batchTable.binary);
            return {
                b3dm : b3dm,
                rtc : Cartesian3.unpack(rtc)
            };
        });
}
