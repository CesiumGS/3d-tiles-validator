/**
 * Also referred to as 'batchTable' throughout the code,
 * byteOffset and byteLength are mutually inclusive, if these two keys
 * are used values will be ignored.
 */

import { Gltf, GltfAccessor } from './gltfType';
import Extensions = require('./Extensions');
import {
    FeatureTableProperties,
    FeatureTablePair,
    FeatureTableType,
    FeatureTablePlainText,
    FeatureTableBinary
} from './featureMetadataType';
import { all } from 'bluebird';

const extensionName = 'CESIUM_3dtiles_feature_metadata';

/**
 * If the glTF asset already has a featureMetadataExtension on it, another
 * featureTable will be created. Does not support empty feature tables.
 * @param gltf
 * @param featureTables
 * @param buffer
 */
export function createFeatureMetadataExtensionV2(
    gltf: Gltf,
    featureTables: FeatureTablePair[],
    buffer?: Buffer
) {
    const plainText = featureTables
        .filter(t => t.type == FeatureTableType.PlainText)
        .map(t => t.data as FeatureTablePlainText);

    const binary = featureTables
        .filter(t => t.type == FeatureTableType.Binary)
        .map(t => t.data as FeatureTableBinary);

    const plainTextCount = calcAndAssertPlainTextHaveSameCount(plainText);
    const binaryCount = calcAndAssertBinaryHaveSameCount(binary);

    if (plainTextCount === 0 && binaryCount === 0) {
        throw new Error('plainTextCount or binaryCount must be non-zero');
    }

    const mismatch =
        plainTextCount > 0 && binaryCount > 0 && binaryCount !== binaryCount;
    if (mismatch) {
        throw new Error(
            'plainTextCount and binaryCount must be identical if both present'
        );
    }

    if (binaryCount > 0 && buffer == null) {
        throw new Error('buffer must be defined if binaryCount is non zero');
    }

    const currentFeatureTableProperties: FeatureTableProperties = {};

    addPlainTextAccessorsToFeatureTable(
        currentFeatureTableProperties,
        plainText
    );

    if (binaryCount > 0) {
        addBinaryAccessorsToFeatureTable(
            gltf,
            currentFeatureTableProperties,
            binary,
            buffer
        );
    }

    addExtension(gltf);

    const allTables =
        gltf.extensions.CESIUM_3dtiles_feature_metadata.featureTables;


    // create a reference to the feature table for the zeroth
    // primtiive by default. Not particularly robust!

    const currentFeatureTable = {
        featureCount: Math.max(plainTextCount, binaryCount),
        properties: currentFeatureTableProperties
    };

    allTables.push(currentFeatureTable);
}

function addExtension(gltf: Gltf) {
    if (gltf.extensionsUsed != null && gltf.extensionsUsed.indexOf(extensionName) != -1) {
        return;
    }

    Extensions.addExtensionsUsed(gltf, extensionName);
    Extensions.addExtension(gltf, extensionName, {
        featureTables: []
    });
}

function calcAndAssertBinaryHaveSameCount(
    binary: FeatureTableBinary[]
): number {
    let first = 0;
    if (binary.length === 0) {
        return first;
    }

    first = binary[0].count;
    for (let i = 1; i < binary.length; ++i) {
        if (first != binary[i].count) {
            throw new RangeError(`binary[${i}].count should be ${first}`);
        }
    }

    return first;
}

function calcAndAssertPlainTextHaveSameCount(
    plainText: FeatureTablePlainText[]
): number {
    let first = 0;

    for (const values of plainText) {
        const keys = Object.keys(values);
        if (keys.length === 0) {
            continue;
        }

        first = values[keys[0]].length;
        for (let i = 1; i < keys.length; ++i) {
            if (values[keys[i]].length !== first) {
                throw new Error(`values[${keys[i]}].length should be ${first}`);
            }
        }
    }

    return first;
}

function addPlainTextAccessorsToFeatureTable(
    currentFeatureTableProperties: FeatureTableProperties,
    plainText: FeatureTablePlainText[]
) {
    plainText.forEach(plainTextProperty => {
        const keys = Object.keys(plainTextProperty);
        for (let k of keys) {
            const array = plainTextProperty[k];
            currentFeatureTableProperties[k] = { values: array };
        }
    });
}

function addBinaryAccessorsToFeatureTable(
    gltf: Gltf,
    currentFeatureTableProperties: FeatureTableProperties,
    binary: FeatureTableBinary[],
    buffer: Buffer
) {
    const uri =
        'data:application/octet-stream;base64,' + buffer.toString('base64');

    gltf.buffers.push({
        byteLength: buffer.length,
        uri: uri
    });

    const newBufferIndex = gltf.buffers.length - 1;
    let bufferViewIndex = gltf.bufferViews.length;
    let accessorIndex = gltf.accessors.length;

    for (let i = 0; i < binary.length; ++i, ++accessorIndex) {
        const binaryAttribute = binary[i];
        const componentType = binaryAttribute.componentType;

        const implicitBufferView = isCandidateForImplicitBufferView(
            binaryAttribute
        );

        if (!implicitBufferView) {
            gltf.bufferViews.push({
                buffer: newBufferIndex,
                byteLength: binaryAttribute.byteLength,
                byteOffset: binaryAttribute.byteOffset,
                target: 0x8892 // ARRAY_BUFFER
            });
        }

        const accessor: GltfAccessor = {
            componentType: componentType,
            type: binaryAttribute.type,
            count: binaryAttribute.count,
            min: binaryAttribute.min,
            max: binaryAttribute.max
        };

        if (!implicitBufferView) {
            accessor.bufferView = bufferViewIndex++;
            accessor.byteOffset = 0;
        }

        gltf.accessors.push(accessor);
        currentFeatureTableProperties[binaryAttribute.name] = {
            accessor: accessorIndex
        };
    }
}

function isCandidateForImplicitBufferView(binaryAttribute: FeatureTableBinary) {
    const min = binaryAttribute.min;
    const max = binaryAttribute.max;
    const count = binaryAttribute.count;
    const minPasses = min.length === 1 && min[0] === 0;
    const maxPasses = max.length === 1 && max[0] === count - 1;
    return minPasses && maxPasses;
}
