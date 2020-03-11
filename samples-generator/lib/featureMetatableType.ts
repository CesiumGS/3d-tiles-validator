import { FeatureHierarchyExtension } from "./createFeatureHierarchySubExtension";

export interface FeatureMetatableExtensions {
    CESIUM_3dtiles_feature_hierarchy?: FeatureHierarchyExtension;
}

// CESIUM_3dtiles_feature_metadata
export interface FeatureMetatable {
    extensions?: FeatureMetatableExtensions;
}