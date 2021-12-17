/**
 * Similar to createFutureMetadataExtension.js, but typed
 * and contains smaller utility functions for editing an existing
 * glTF asset.
 */

import { Gltf, GltfPrimitive } from './gltfType';
import { FeatureTable, FeatureLayer } from './featureMetadataType';

export namespace FeatureMetadata {
    /**
     * Updates the extensionsUsed section of a provided glTF asset. Creates
     * this array if it does not exist already.
     * @param gltf The glTF asset to modify
     */
    export function updateExtensionUsed(gltf: Gltf) {
        if (gltf.extensionsUsed == null) {
            gltf.extensionsUsed = [];
        }

        gltf.extensionsUsed.push('CESIUM_3dtiles_feature_metadata');
    }

    /**
     * Adds a featureTable to the root section of a glTF asset. Automatically
     * creates missing intermediate objects.
     * @param gltf The glTF asset to modify
     * @param featureTable A featureTable to add to the root extensions section
     * of the provided glTF asset.
     */

    export function addFeatureTable(gltf: Gltf, featureTable: FeatureTable) {
        if (gltf.extensions == null) {
            gltf.extensions = {};
        }

        if (gltf.extensions.CESIUM_3dtiles_feature_metadata == null) {
            gltf.extensions.CESIUM_3dtiles_feature_metadata = {
                featureTables: []
            };
        }

        gltf.extensions.CESIUM_3dtiles_feature_metadata.featureTables.push(
            featureTable
        );
    }

    export function addFeatureLayer(
        primitive: GltfPrimitive,
        featureLayer: FeatureLayer
    ) {
        if (primitive.extensions == null) {
            primitive.extensions = {};
        }

        if (primitive.extensions.CESIUM_3dtiles_feature_metadata == null) {
            primitive.extensions.CESIUM_3dtiles_feature_metadata = {
                featureLayers: []
            };
        }

        primitive.extensions.CESIUM_3dtiles_feature_metadata.featureLayers.push(
            featureLayer
        );
    }
}
