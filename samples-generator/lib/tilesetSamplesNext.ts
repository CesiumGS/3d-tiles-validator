import { GeneratorArgs } from './arguments';
import { createBuildings } from './createBuilding';
import {
    tilesNextTilesetJsonVersion,
    largeGeometricError,
    parentRegion,
    smallGeometricError,
    parentContentRegion,
    llRegion,
    lrRegion,
    urRegion,
    ulRegion,
    parentTileOptions,
    llTileOptions,
    lrTileOptions,
    urTileOptions,
    ulTileOptions,
    childrenRegion
} from './constants';
import { FeatureTableUtils } from './featureMetatableUtilsNext';
import { Mesh } from './Mesh';
import { generateBuildingBatchTable } from './createBuildingsTile';
import { Gltf } from './gltfType';
import { FeatureMetadata } from './featureMetadata';
import { toCamelCase } from './utility';
import path = require('path');
import { writeTileset, writeTile } from './ioUtil';
const createGltf = require('./createGltf');

export namespace TilesetSamplesNext {
    const rootDir = path.join('output', 'Tilesets');

    export async function createTileset(args: GeneratorArgs) {
        const tileOptions = [
            parentTileOptions,
            llTileOptions,
            lrTileOptions,
            urTileOptions,
            ulTileOptions
        ];

        const tileNames = [
            'parent',
            'll',
            'lr',
            'ur',
            'ul'
        ];

        const buildings = tileOptions.map(opt =>
            createBuildings(opt.buildingOptions)
        );

        const batchTables = buildings.map(building =>
            generateBuildingBatchTable(building)
        );

        const batchedMeshes = buildings.map((building, i) => {
            const transform = tileOptions[i].transform;
            return Mesh.batch(
                FeatureTableUtils.createMeshes(transform, building, false)
            );
        });

        // remove explicit ID from batchTable, it's not used in the
        // feature metadata gltf extension
        batchTables.forEach(table => delete table.id);

        const gltfs = batchedMeshes.map(mesh =>
            createGltf({ mesh: mesh, useBatchIds: false })
        ) as Gltf[];

        gltfs.forEach((gltf, i) => {
            const batchTable = batchTables[i];

            FeatureMetadata.updateExtensionUsed(gltf);
            FeatureMetadata.addFeatureTable(gltf, {
                featureCount: batchTable.Longitude.length,
                properties: {
                    Longitude: { values: batchTable.Longitude },
                    Latitude: { values: batchTable.Latitude },
                    Height: { values: batchTable.Height }
                }
            });

            const primitive = gltf.meshes[0].primitives[0];
            FeatureMetadata.addFeatureLayer(primitive, {
                featureTable: 0,
                vertexAttribute: {
                    implicit: {
                        increment: 1,
                        start: 0
                    }
                }
            });
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion,
                tilesetVersion: '1.2.3'
            },
            extras: {
                name: 'Sample Tileset'
            },
            properties: undefined,
            geometricError: largeGeometricError,
            root: {
                boundingVolume: {
                    region: parentRegion
                },
                geometricError: smallGeometricError,
                refine: 'ADD',
                content: {
                    uri: 'parent' + ext,
                    boundingVolume: {
                        region: parentContentRegion
                    }
                },
                children: [
                    {
                        boundingVolume: {
                            region: llRegion
                        },
                        geometricError: 0.0,
                        content: {
                            uri: 'll' + ext
                        }
                    },
                    {
                        boundingVolume: {
                            region: lrRegion
                        },
                        geometricError: 0.0,
                        content: {
                            uri: 'lr' + ext
                        },
                        extras: {
                            id: 'Special Tile'
                        }
                    },
                    {
                        boundingVolume: {
                            region: urRegion
                        },
                        geometricError: 0.0,
                        content: {
                            uri: 'ur' + ext
                        }
                    },
                    {
                        boundingVolume: {
                            region: ulRegion
                        },
                        geometricError: 0.0,
                        content: {
                            uri: 'ul' + ext
                        }
                    }
                ]
            }
        };

        const fullPath = path.join(rootDir, 'Tileset')
        await writeTileset(fullPath, tilesetJson as any, args);
        for (let i=0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = tileNames[i] + ext;
            await writeTile(fullPath, tileFilename, gltf, args);
        }
    }

    export async function createTilesetEmptyRoot(args: GeneratorArgs) {
        const tileOptions = [
            llTileOptions,
            lrTileOptions,
            urTileOptions,
            ulTileOptions
        ];

        const tileNames = [
            'll',
            'lr',
            'ur',
            'ul'
        ];

        const buildings = tileOptions.map(opt =>
            createBuildings(opt.buildingOptions)
        );

        const batchTables = buildings.map(building =>
            generateBuildingBatchTable(building)
        );

        const batchedMeshes = buildings.map((building, i) => {
            const transform = tileOptions[i].transform;
            return Mesh.batch(
                FeatureTableUtils.createMeshes(transform, building, false)
            );
        });

        // remove explicit ID from batchTable, it's not used in the
        // feature metadata gltf extension
        batchTables.forEach(table => delete table.id);

        const gltfs = batchedMeshes.map(mesh =>
            createGltf({ mesh: mesh, useBatchIds: false })
        ) as Gltf[];

        gltfs.forEach((gltf, i) => {
            const batchTable = batchTables[i];

            FeatureMetadata.updateExtensionUsed(gltf);
            FeatureMetadata.addFeatureTable(gltf, {
                featureCount: batchTable.Longitude.length,
                properties: {
                    Longitude: { values: batchTable.Longitude },
                    Latitude: { values: batchTable.Latitude },
                    Height: { values: batchTable.Height }
                }
            });

            const primitive = gltf.meshes[0].primitives[0];
            FeatureMetadata.addFeatureLayer(primitive, {
                featureTable: 0,
                vertexAttribute: {
                    implicit: {
                        increment: 1,
                        start: 0
                    }
                }
            });
        });


        const ext = args.useGlb ? '.glb' : '.gltf';

        var tilesetJson = {
            asset : {
                version : tilesNextTilesetJsonVersion
            },
            properties : undefined,
            geometricError : smallGeometricError,
            root : {
                boundingVolume : {
                    region : childrenRegion
                },
                geometricError : smallGeometricError,
                refine : 'ADD',
                children : [
                    {
                        boundingVolume : {
                            region : llRegion
                        },
                        geometricError : 0.0,
                        content : {
                            uri : 'll' + ext
                        }
                    },
                    {
                        boundingVolume : {
                            region : lrRegion
                        },
                        geometricError : 0.0,
                        content : {
                            uri : 'lr' + ext
                        }
                    },
                    {
                        boundingVolume : {
                            region : urRegion
                        },
                        geometricError : 0.0,
                        content : {
                            uri : 'ur' + ext
                        }
                    },
                    {
                        boundingVolume : {
                            region : ulRegion
                        },
                        geometricError : 0.0,
                        content : {
                            uri : 'ul' + ext
                        }
                    }
                ]
            }
        };

        const fullPath = path.join(rootDir, 'TilesetEmptyRoot');
        await writeTileset(fullPath, tilesetJson as any, args);
        for (let i=0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = tileNames[i] + ext;
            await writeTile(fullPath, tileFilename, gltf, args);
        }
    }

    export async function createTilesetOfTilesets(args: GeneratorArgs) {}

    export async function createTilesetWithExternalResources(
        args: GeneratorArgs
    ) {}

    export async function createTilesetRefinementMix(args: GeneratorArgs) {}

    export async function createTilesetReplacement1(args: GeneratorArgs) {}

    export async function createTilesetReplacement2(args: GeneratorArgs) {}

    export async function createTilesetReplacement3(args: GeneratorArgs) {}

    export async function createTilesetWithTransforms(args: GeneratorArgs) {}

    export async function createTilesetWithViewerRequestVolume(
        args: GeneratorArgs
    ) {}

    export async function createTilesetReplacementWithViewerRequestVolume(
        args: GeneratorArgs
    ) {}

    export async function createTilesetSubtreeExpiration(args: GeneratorArgs) {}

    export async function createTilesetPoints(args: GeneratorArgs) {}

    export async function createTilesetUniform(args: GeneratorArgs) {}
}
