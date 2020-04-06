import { GltfAccessor, GLenumName } from "./gltfType";

const Cesium = require('cesium');
const defined = Cesium.defined;
const Extensions = require('./Extensions');
const typeConversion = require('./typeConversion');
const featureTableExtensionName = 'CESIUM_3dtiles_feature_metadata';

function sortByByteOffset(a, b) {
    if (a.byteOffset < b.byteOffset) {
        return -1;
    }

    if (a.byteOffset > b.byteOffset) {
        return 1;
    }

    return 0;
}

function assertHumanReadableFeatureTableValueArraysHaveIdenticalLength(
    humanfeatureTables
) {
    if (humanfeatureTables.length === 0) {
        return 0;
    }

    const firstLength = humanfeatureTables[0].value.length;
    for (let i = 1; i < humanfeatureTables.length; ++i) {
        if (humanfeatureTables[i].value.length !== firstLength) {
            const badFeatureTable = humanfeatureTables[i].name;
            const badLength = humanfeatureTables[i].value.length;
            throw new Error(
                `${badFeatureTable} has incorrect length of ${badLength}, should match first length: ${firstLength}`
            );
        }
    }

    return firstLength;
}

function assertBinaryHasIdenticalCount(binaryfeatureTables) {
    if (binaryfeatureTables.length === 0) {
        return 0;
    }

    const firstLength = binaryfeatureTables[0].count;
    for (let i = 1; i < binaryfeatureTables.length; ++i) {
        if (binaryfeatureTables[i].count !== firstLength) {
            const badFeatureTable = binaryfeatureTables[i].name;
            const badLength = binaryfeatureTables[i].count;
            throw new Error(
                badFeatureTable +
                    ' has incorrect length of: ' +
                    badLength +
                    ', should match the first length: ' +
                    firstLength
            );
        }
    }

    return firstLength;
}

function isCandidateForImplicitBufferView(batchAttribute) {
    const min = batchAttribute.min;
    const max = batchAttribute.max;
    const count = batchAttribute.count;
    const minExists = defined(batchAttribute.min);
    const maxExists = defined(batchAttribute.max);
    const minPasses = minExists && min.length === 1 && min[0] === 0;
    const maxPasses = maxExists && max.length === 1 && max[0] === count - 1;
    return minPasses && maxPasses;
}

/**
 * @typedef humanReadableFeatureTableValue
 * @type {Object}
 * @property {Array} values An array of arbitrary values in human readable form
 *                          (e.g ["A", "B", "C"] or [1.3, 4.3, 1.5])
 */

/**
 * @typedef binaryReadableFeatureTableValue
 * @type {Object}
 * @property {String} name Name of the featureTableAttribute (e.g to be placed
 *                         into the accessor)
 * @property {Number} [byteoffset] ByteOffset of the featureTableAttribute
 * @property {Number} [byteLength] Length of the attribute in bytes
 * @property {Number} count Count of logical number of elements in the
 *                          attribute (eg 9 floating point numbers with a vec3
 *                          property means count = 3)
 * @property {Number} componentType WebGL enum of the component property
 *                                  (e.g GL_UNSIGNED_BYTE / 0x1401)
 */

/**
 * @typedef featureTableAttribute
 * @type {Object.<string, humanReadableFeatureTableValue|binaryReadableFeatureTableValue>}
 */

/**
 * @typedef attributeBufferType
 * @type {Object}
 * @property {Buffer} buffer BufferAttribute data
 * @property {String} componentType BufferAttribute componentType (FLOAT, UNSIGNED_BYTE, DOUBLE)
 * @property {String} propertyName BufferAttribute property name (POSITION, NORMAL, COLOR, WEIGHT)
 * @property {String} type (SCALAR, VEC2, VEC3, VEC4)
 * @property {String} target WebGL rendering target, like ARRAY_BUFFER, or ELEMENT_ARRAY_BUFFE (e.g 0x8892, 0x8893)
 * @property {Array.<Number>} min Minimum value for each component in the bufferAttribute
 * @property {Array.<Number>} max Maximum value for each component in the bufferAttribute
 */

/**
 * Iterates over featureTableAttributes and adorns the provided gltf object with them via
 * the CESIUM_3dtiles_feature_metadata extension
 *
 * @param {Object} gltf The gltf object to edit
 * @param {featureTableAttribute} featureTableAttributes List of batch table attributes. The function will intelligently try to detect
 * if the attribute is a human readable value (a key value where the value is
 * just an array of non-binary data) or if the values are more keys describing the
 * layout of binary data in a binary buffer.
 * @param {Buffer} sharedBinaryBuffer Binary buffer. Must be defined if using at
 * least 1 binary batch attribute. This function currently assumes that all of
 * the binary batch attributes in featureTableAttributes are directly referring
 * to this buffer.
 */
export function createFeatureMetadataExtension(
    gltf,
    featureTableAttributes,
    sharedBinaryBuffer
) {
    Extensions.addExtensionsUsed(gltf, featureTableExtensionName);
    Extensions.addExtension(gltf, featureTableExtensionName, {
        featureTables: [
            {
                properties: {}
            }
        ]
    });

    const humanReadable = [];
    const binaryReadable = [];

    const featureTableIndex = 0; // TODO: This will change when we add multiple batch table support
    const activeFeatureTable =
        gltf.extensions[featureTableExtensionName].featureTables[
            featureTableIndex
        ];

    const attributeNames = Object.keys(featureTableAttributes);
    for (let i = 0; i < attributeNames.length; ++i) {
        if (featureTableAttributes[attributeNames[i]] instanceof Array) {
            humanReadable.push({
                name: attributeNames[i],
                value: featureTableAttributes[attributeNames[i]]
            });
        } else {
            binaryReadable.push(featureTableAttributes[attributeNames[i]]);
        }
    }

    const humanFeatureCount = assertHumanReadableFeatureTableValueArraysHaveIdenticalLength(
        humanReadable
    );
    const binaryFeatureCount = assertBinaryHasIdenticalCount(binaryReadable);

    if (humanFeatureCount === 0 && binaryFeatureCount === 0) {
        throw new Error(
            'Must have at least one binary or human readable batch table attribute'
        );
    }

    if (
        humanFeatureCount > 0 &&
        binaryFeatureCount > 0 &&
        binaryFeatureCount !== humanFeatureCount
    ) {
        throw new Error(
            'Count must be identical across all batch table properties (binary or human readable)'
        );
    }

    activeFeatureTable.featureCount = Math.max(
        humanFeatureCount,
        binaryFeatureCount
    );

    for (let i = 0; i < humanReadable.length; ++i) {
        const attribute = humanReadable[i];
        activeFeatureTable.properties[attribute.name] = {
            values: attribute.value
        };
    }

    if (binaryReadable.length > 0 && !defined(sharedBinaryBuffer)) {
        throw new Error(
            'Detected a binary attribute, but function called without binary buffer'
        );
    }

    binaryReadable.sort(sortByByteOffset);
    if (binaryReadable.length > 0) {
        gltf.buffers.push({
            byteLength: sharedBinaryBuffer.length,
            uri:
                'data:application/octet-stream;base64,' +
                sharedBinaryBuffer.toString('base64')
        });

        const newBufferIndex = gltf.buffers.length - 1;
        let bufferViewIndex = gltf.bufferViews.length;
        let accessorIndex = gltf.accessors.length;

        for (let i = 0; i < binaryReadable.length; ++i, ++accessorIndex) {
            const batchAttribute = binaryReadable[i];

            const componentType = batchAttribute.componentType;
            const validComponentType = typeConversion.isValidWebGLDataTypeEnum(
                componentType
            );
            const normalizedComponentType = validComponentType
                ? componentType
                : typeConversion.componentTypeStringToInteger(componentType);

            const implicitBufferView = isCandidateForImplicitBufferView(
                batchAttribute
            );
            if (!implicitBufferView) {
                gltf.bufferViews.push({
                    buffer: newBufferIndex,
                    byteLength: batchAttribute.byteLength,
                    byteOffset: batchAttribute.byteOffset,
                    target: GLenumName.ARRAY_BUFFER
                });
            }

            const accessor: GltfAccessor = {
                componentType: normalizedComponentType,
                type: batchAttribute.type,
                count: batchAttribute.count,
                min: batchAttribute.min,
                max: batchAttribute.max
            };

            if (!implicitBufferView) {
                accessor.bufferView = bufferViewIndex++;
                accessor.byteOffset = 0;
            }

            gltf.accessors.push(accessor);
            activeFeatureTable.properties[batchAttribute.name] = {
                accessor: accessorIndex
            };
        }
    }

    // also add the extension to attributes
    const primitives = gltf.meshes[0].primitives;
    for (let i = 0; i < primitives.length; ++i) {
        primitives[i].extensions = {
            CESIUM_3dtiles_feature_metadata: {
                attributes: {
                    _FEATURE_ID_0: 0
                }
            }
        };
    }

    return gltf;
}
