export interface GeneratorArgs {
    use3dTilesNext: boolean;
    useGlb: boolean;
    gltfConversionOptions: {resourceDirectory: string};
    prettyJson: boolean;
    gzip: boolean;
    geometricError: number;
    versionNumber: string;
}
