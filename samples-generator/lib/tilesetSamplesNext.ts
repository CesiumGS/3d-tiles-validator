const Cesium = require('cesium');
const Matrix4 = Cesium.Matrix4;
const gltfPipeline = require('gltf-pipeline');
const glbToGltf = gltfPipeline.glbToGltf;

import fsExtra = require('fs-extra');
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
    childrenRegion,
    metersToLongitude,
    latitude,
    wgs84Transform,
    longitude,
    instancesModelSize,
    smallRegion,
    gltfConversionOptions
} from './constants';
import { FeatureTableUtils } from './featureMetatableUtilsNext';
import { Mesh } from './Mesh';
import { generateBuildingBatchTable } from './createBuildingsTile';
import { Gltf } from './gltfType';
import { FeatureMetadata } from './featureMetadata';
import path = require('path');
import { writeTileset, writeTile } from './ioUtil';
import saveJson = require('./saveJson');
import { modifyImageUri } from './modifyImageUri';
import { getGltfFromGlbUri } from './gltfFromUri';
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

        const tileNames = ['parent', 'll', 'lr', 'ur', 'ul'];

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

        const fullPath = path.join(rootDir, 'Tileset');
        await writeTileset(fullPath, tilesetJson as any, args);
        for (let i = 0; i < gltfs.length; ++i) {
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

        const tileNames = ['ll', 'lr', 'ur', 'ul'];

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
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            properties: undefined,
            geometricError: smallGeometricError,
            root: {
                boundingVolume: {
                    region: childrenRegion
                },
                geometricError: smallGeometricError,
                refine: 'ADD',
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

        const fullPath = path.join(rootDir, 'TilesetEmptyRoot');
        await writeTileset(fullPath, tilesetJson as any, args);
        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = tileNames[i] + ext;
            await writeTile(fullPath, tileFilename, gltf, args);
        }
    }

    export async function createTilesetOfTilesets(args: GeneratorArgs) {
        const tilesetName = 'TilesetOfTilesets';
        const tilesetDirectory = path.join(rootDir, tilesetName);
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const tileset2Path = path.join(tilesetDirectory, 'tileset2.json');
        const tileset3Path = path.join(
            tilesetDirectory,
            'tileset3',
            'tileset3.json'
        );
        const llPath = path.join('tileset3', 'll');
        const tileNames = ['parent', llPath, 'lr', 'ur', 'ul'];
        const tileOptions = [
            parentTileOptions,
            llTileOptions,
            lrTileOptions,
            urTileOptions,
            ulTileOptions
        ];
        const ext = args.useGlb ? '.glb' : '.gltf';

        const tilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion,
                tilesetVersion: '1.2.3'
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
                    uri: 'tileset2.json'
                }
            }
        };

        const tileset2Json = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            geometricError: largeGeometricError,
            root: {
                boundingVolume: {
                    region: parentRegion
                },
                geometricError: smallGeometricError,
                refine: 'ADD',
                content: {
                    uri: 'parent' + ext
                },
                children: [
                    {
                        boundingVolume: {
                            region: llRegion
                        },
                        geometricError: 0.0,
                        content: {
                            uri: 'tileset3/tileset3.json'
                        }
                    },
                    {
                        boundingVolume: {
                            region: lrRegion
                        },
                        geometricError: 0.0,
                        content: {
                            uri: 'lr' + ext
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

        const tileset3Json = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            geometricError: smallGeometricError,
            root: {
                boundingVolume: {
                    region: llRegion
                },
                geometricError: 0.0,
                refine: 'ADD',
                content: {
                    uri: 'll' + ext
                }
            }
        };

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

        await saveJson(tilesetPath, tilesetJson, args.prettyJson, args.gzip),
            await saveJson(
                tileset2Path,
                tileset2Json,
                args.prettyJson,
                args.gzip
            ),
            await saveJson(
                tileset3Path,
                tileset3Json,
                args.prettyJson,
                args.gzip
            );

        const fullPath = path.join(rootDir, 'TilesetOfTilesets');
        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = tileNames[i] + ext;
            await writeTile(fullPath, tileFilename, gltf, args);
        }
    }

    export async function createTilesetWithExternalResources(
        args: GeneratorArgs
    ) {
        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetName = 'TilesetWithExternalResources';
        const tilesetDirectory = path.join(rootDir, tilesetName);
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const tileset2Path = path.join(
            tilesetDirectory,
            'tileset2',
            'tileset2.json'
        );
        const glbPath = 'data/textured_box_separate/textured_box.glb';
        const glbBasePath = 'data/textured_box_separate/';
        const glbCopyPath = path.join(
            tilesetDirectory,
            'textured_box_separate/'
        );

        const tilePaths = [
            path.join(tilesetDirectory, 'external' + ext),
            path.join(tilesetDirectory, 'external' + ext),
            path.join(tilesetDirectory, 'embed' + ext),
            path.join(tilesetDirectory, 'tileset2', 'external' + ext),
            path.join(tilesetDirectory, 'tileset2', 'external' + ext),
            path.join(tilesetDirectory, 'tileset2', 'embed' + ext)
        ];

        const offset = metersToLongitude(20, latitude);
        const transforms = [
            Matrix4.pack(
                wgs84Transform(
                    longitude + offset * 3,
                    latitude,
                    instancesModelSize / 2.0
                ),
                new Array(16)
            ),
            Matrix4.pack(
                wgs84Transform(
                    longitude + offset * 2,
                    latitude,
                    instancesModelSize / 2.0
                ),
                new Array(16)
            ),
            Matrix4.pack(
                wgs84Transform(
                    longitude + offset,
                    latitude,
                    instancesModelSize / 2.0
                ),
                new Array(16)
            ),
            Matrix4.pack(
                wgs84Transform(longitude, latitude, instancesModelSize / 2.0),
                new Array(16)
            ),
            Matrix4.pack(
                wgs84Transform(
                    longitude - offset,
                    latitude,
                    instancesModelSize / 2.0
                ),
                new Array(16)
            ),
            Matrix4.pack(
                wgs84Transform(
                    longitude - offset * 2,
                    latitude,
                    instancesModelSize / 2.0
                ),
                new Array(16)
            )
        ];

        const tilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            geometricError: smallGeometricError,
            root: {
                boundingVolume: {
                    region: smallRegion
                },
                geometricError: smallGeometricError,
                refine: 'ADD',
                children: [
                    {
                        boundingVolume: {
                            region: smallRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'ADD',
                        content: {
                            uri: 'tileset2/tileset2.json'
                        }
                    },
                    {
                        boundingVolume: {
                            region: smallRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'ADD',
                        content: {
                            uri: 'external' + ext
                        },
                        transform: transforms[0]
                    },
                    {
                        boundingVolume: {
                            region: smallRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'ADD',
                        content: {
                            uri: 'external' + ext
                        },
                        transform: transforms[1]
                    },
                    {
                        boundingVolume: {
                            region: smallRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'ADD',
                        content: {
                            uri: 'embed' + ext
                        },
                        transform: transforms[2]
                    }
                ]
            }
        };

        const tileset2Json = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            geometricError: smallGeometricError,
            root: {
                boundingVolume: {
                    region: smallRegion
                },
                geometricError: smallGeometricError,
                refine: 'ADD',
                children: [
                    {
                        boundingVolume: {
                            region: smallRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'ADD',
                        content: {
                            uri: 'external' + ext
                        },
                        transform: transforms[3]
                    },
                    {
                        boundingVolume: {
                            region: smallRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'ADD',
                        content: {
                            uri: 'external' + ext
                        },
                        transform: transforms[4]
                    },
                    {
                        boundingVolume: {
                            region: smallRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'ADD',
                        content: {
                            uri: 'embed' + ext
                        },
                        transform: transforms[5]
                    }
                ]
            }
        };

        const glb = await fsExtra.readFile(glbPath);
        const glbs = (await Promise.all([
            modifyImageUri(glb, glbBasePath, 'textured_box_separate/'),
            modifyImageUri(glb, glbBasePath, '../textured_box_separate/')
        ])) as Buffer[];

        await fsExtra.copy(glbBasePath, glbCopyPath);

        const resourceDirectory = {
            resourceDirectory: path.join(tilesetDirectory, 'textured_box_separate')
        };

        // feature tables are deprecated, so the glbs are copied as-is
        const gltf0 = 
            (await glbToGltf(glbs[0], gltfConversionOptions)).gltf as Gltf;

        const gltf1 = 
            (await glbToGltf(glbs[1], gltfConversionOptions)).gltf as Gltf;

        const i3dm0 = await getGltfFromGlbUri(
            path.join(tilesetDirectory, 'textured_box_separate/textured_box.glb'),
            resourceDirectory
        );

        const tiles = [gltf0, i3dm0, gltf0, gltf1, i3dm0, gltf1];
        await saveJson(tilesetPath, tilesetJson, args.prettyJson, args.gzip);
        await saveJson(tileset2Path, tileset2Json, args.prettyJson, args.gzip);

        for (let i = 0; i < tilePaths.length; ++i) {
            const gltf = tiles[i];
            const tilePath = tilePaths[i];
            await writeTile(tilePath, '', gltf, args);
        }
    }

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
