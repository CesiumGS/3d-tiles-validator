import { FeatureHierarchyExtension } from './createFeatureHierarchySubExtension';

export interface FeatureMetatableExtensions {
    CESIUM_3dtiles_feature_hierarchy?: FeatureHierarchyExtension;
}

export type FeatureTableProperties =
    {[name: string]: {accessor: number}} |
    {[name: string]: {values: (string|number|boolean)[]}}

export interface FeatureTable {
    properties: FeatureTableProperties;
    featureCount: number;
    extensions?: FeatureMetatableExtensions
}

// CESIUM_3dtiles_feature_metadata
export interface FeatureMetatable {
    featureTables: FeatureTable[];
}
