const Cesium = require('cesium');
const clone = Cesium.clone;
const Cartesian3 = Cesium.Cartesian3;
const CesiumMath = Cesium.Math;
const Matrix4 = Cesium.Matrix4;
const Quaternion = Cesium.Quaternion;
const gltfPipeline = require('gltf-pipeline');
const glbToGltf = gltfPipeline.glbToGltf;
import fsExtra = require('fs-extra');
import { GeneratorArgs } from './arguments';
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
    gltfConversionOptions,
    instancesTileWidth,
    instancesLength,
    instancesUri,
    buildingTemplate,
    smallBoxLocal,
    instancesGeometricError,
    instancesBoxLocal,
    buildingsTransform,
    longitudeExtent,
    latitudeExtent,
    TileOptions
} from './constants';
import { Gltf } from './gltfType';
import path = require('path');
import { writeTileset, writeTile, writeTilesetAndTile } from './ioUtil';
import saveJson = require('./saveJson');
import { modifyImageUri } from './modifyImageUri';
import { getGltfFromGlbUri } from './gltfFromUri';
import { TilesetUtilsNext } from './tilesetUtilsNext';
import { InstanceTileUtils } from './instanceUtilsNext';
import { addBinaryBuffers } from './gltfUtil';
import { createEXTMeshInstancingExtension } from './createEXTMeshInstancing';
import { FeatureMetadata } from './featureMetadata';
import { FeatureTableUtils } from './featureMetatableUtilsNext';
import { createBuildings } from './createBuilding';
import { Mesh } from './Mesh';
import { generateBuildingBatchTable } from './createBuildingsTile';
import createGltf = require('./createGltf');
import { createPointCloudTile } from './createPointCloudTile';
import { TilesNextExtension } from './tilesNextExtension';
const getProperties = require('./getProperties');

export namespace TilesetSamplesNext {
    const rootDir = path.join('output', 'Tilesets');

    export async function createTileset(args: GeneratorArgs) {
        const tilesetDirectory = path.join(rootDir, 'Tilesets');
        const tileOptions = [
            parentTileOptions,
            llTileOptions,
            lrTileOptions,
            urTileOptions,
            ulTileOptions
        ];

        const tileNames = ['parent', 'll', 'lr', 'ur', 'ul'];

        const result = TilesetUtilsNext.createBuildingGltfsWithFeatureMetadata(
            tileOptions
        );

        const batchTables = result.batchTables;
        const gltfs = result.gltfs;

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

        tilesetJson.properties = getProperties(batchTables);
        await writeTileset(tilesetDirectory, tilesetJson as any, args);
        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = tileNames[i] + ext;
            await writeTile(tilesetDirectory, tileFilename, gltf, args);
        }
    }

    export async function createTilesetEmptyRoot(args: GeneratorArgs) {
        const ext = args.useGlb ? '.glb' : '.gltf';

        const tileOptions = [
            llTileOptions,
            lrTileOptions,
            urTileOptions,
            ulTileOptions
        ];

        const tileNames = ['ll', 'lr', 'ur', 'ul'];

        const result = TilesetUtilsNext.createBuildingGltfsWithFeatureMetadata(
            tileOptions
        );

        const gltfs = result.gltfs;

        const tilesetJson = {
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

        const result = TilesetUtilsNext.createBuildingGltfsWithFeatureMetadata(
            tileOptions
        );

        const gltfs = result.gltfs;

        await saveJson(tilesetPath, tilesetJson, args.prettyJson, args.gzip);
        await saveJson(tileset2Path, tileset2Json, args.prettyJson, args.gzip);
        await saveJson(tileset3Path, tileset3Json, args.prettyJson, args.gzip);
        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = tileNames[i] + ext;
            await writeTile(tilesetDirectory, tileFilename, gltf, args);
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
            resourceDirectory: path.join(
                tilesetDirectory,
                'textured_box_separate'
            )
        };

        // feature tables are deprecated, so the glbs are copied as-is
        const gltf0 = (await glbToGltf(glbs[0], gltfConversionOptions))
            .gltf as Gltf;

        const gltf1 = (await glbToGltf(glbs[1], gltfConversionOptions))
            .gltf as Gltf;

        const i3dm0 = await getGltfFromGlbUri(
            path.join(
                tilesetDirectory,
                'textured_box_separate/textured_box.glb'
            ),
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

    export async function createTilesetRefinementMix(args: GeneratorArgs) {
        // Create a tileset with a mix of additive and replacement refinement
        // A - add
        // R - replace
        //          A
        //      A       R (not rendered)
        //    R   A   R   A
        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetName = 'TilesetRefinementMix';
        const tilesetDirectory = path.join(rootDir, tilesetName);
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const tileNames = ['parent', 'll', 'lr', 'ur', 'ul'];
        const tileOptions = [
            parentTileOptions,
            llTileOptions,
            lrTileOptions,
            urTileOptions,
            ulTileOptions
        ];

        const result = TilesetUtilsNext.createBuildingGltfsWithFeatureMetadata(
            tileOptions
        );

        const gltfs = result.gltfs;
        const batchTables = result.batchTables;

        const tilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
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
                            region: parentContentRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'REPLACE',
                        content: {
                            uri: 'parent' + ext
                        },
                        children: [
                            {
                                boundingVolume: {
                                    region: llRegion
                                },
                                geometricError: 0.0,
                                refine: 'ADD',
                                content: {
                                    uri: 'll' + ext
                                }
                            },
                            {
                                boundingVolume: {
                                    region: urRegion
                                },
                                geometricError: 0.0,
                                refine: 'REPLACE',
                                content: {
                                    uri: 'ur' + ext
                                }
                            }
                        ]
                    },
                    {
                        boundingVolume: {
                            region: parentContentRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'ADD',
                        content: {
                            uri: 'parent' + ext
                        },
                        children: [
                            {
                                boundingVolume: {
                                    region: ulRegion
                                },
                                geometricError: 0.0,
                                refine: 'ADD',
                                content: {
                                    uri: 'ul' + ext
                                }
                            },
                            {
                                boundingVolume: {
                                    region: lrRegion
                                },
                                geometricError: 0.0,
                                refine: 'REPLACE',
                                content: {
                                    uri: 'lr' + ext
                                }
                            }
                        ]
                    }
                ]
            }
        };

        tilesetJson.properties = getProperties(batchTables);
        await saveJson(tilesetPath, tilesetJson, args.prettyJson, args.gzip);
        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = tileNames[i] + ext;
            await writeTile(tilesetDirectory, tileFilename, gltf, args);
        }
    }

    export async function createTilesetReplacement1(args: GeneratorArgs) {
        // No children have content, but all grandchildren have content. Root uses replacement refinement.
        // C - content
        // E - empty
        //          C
        //      E       E
        //    C   C   C   C
        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetName = 'TilesetReplacement1';
        const tilesetDirectory = path.join(rootDir, tilesetName);
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const tileNames = ['parent', 'll', 'lr', 'ur', 'ul'];
        const tileOptions = [
            parentTileOptions,
            llTileOptions,
            lrTileOptions,
            urTileOptions,
            ulTileOptions
        ];

        const result = TilesetUtilsNext.createBuildingGltfsWithFeatureMetadata(
            tileOptions
        );

        const gltfs = result.gltfs;
        const batchTables = result.batchTables;

        const tilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            properties: undefined,
            geometricError: largeGeometricError,
            root: {
                boundingVolume: {
                    region: parentRegion
                },
                geometricError: smallGeometricError,
                refine: 'REPLACE',
                content: {
                    uri: 'parent' + ext,
                    boundingVolume: {
                        region: parentContentRegion
                    }
                },
                children: [
                    {
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
                                    region: urRegion
                                },
                                geometricError: 0.0,
                                content: {
                                    uri: 'ur' + ext
                                }
                            }
                        ]
                    },
                    {
                        boundingVolume: {
                            region: childrenRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'ADD',
                        children: [
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
                                    region: ulRegion
                                },
                                geometricError: 0.0,
                                content: {
                                    uri: 'ul' + ext
                                }
                            }
                        ]
                    }
                ]
            }
        };

        tilesetJson.properties = getProperties(batchTables);
        await saveJson(tilesetPath, tilesetJson, args.prettyJson, args.gzip);
        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = tileNames[i] + ext;
            await writeTile(tilesetDirectory, tileFilename, gltf, args);
        }
    }

    export async function createTilesetReplacement2(args: GeneratorArgs) {
        //          C
        //          E
        //        C   E
        //            C (smaller geometric error)
        //
        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetName = 'TilesetReplacement2';
        const tilesetDirectory = path.join(rootDir, tilesetName);
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const tileNames = ['parent', 'll', 'ur'];
        const tileOptions = [parentTileOptions, llTileOptions, urTileOptions];

        const result = TilesetUtilsNext.createBuildingGltfsWithFeatureMetadata(
            tileOptions
        );

        const gltfs = result.gltfs;
        const batchTables = result.batchTables;

        const tilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            properties: undefined,
            geometricError: largeGeometricError,
            root: {
                boundingVolume: {
                    region: parentRegion
                },
                geometricError: smallGeometricError,
                refine: 'REPLACE',
                content: {
                    uri: 'parent' + ext,
                    boundingVolume: {
                        region: parentContentRegion
                    }
                },
                children: [
                    {
                        boundingVolume: {
                            region: childrenRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'ADD',
                        children: [
                            {
                                boundingVolume: {
                                    region: urRegion
                                },
                                geometricError: 7.0,
                                refine: 'REPLACE',
                                children: [
                                    {
                                        boundingVolume: {
                                            region: urRegion
                                        },
                                        geometricError: 0.0,
                                        content: {
                                            uri: 'ur' + ext
                                        }
                                    }
                                ]
                            },
                            {
                                boundingVolume: {
                                    region: llRegion
                                },
                                geometricError: 0.0,
                                content: {
                                    uri: 'll' + ext
                                }
                            }
                        ]
                    }
                ]
            }
        };

        tilesetJson.properties = getProperties(batchTables);
        await saveJson(tilesetPath, tilesetJson, args.prettyJson, args.gzip);
        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = tileNames[i] + ext;
            await writeTile(tilesetDirectory, tileFilename, gltf, args);
        }
    }

    export async function createTilesetReplacement3(args: GeneratorArgs) {
        //          C
        //          T (external tileset ref)
        //          E (root of external tileset)
        //     C  C  C  C
        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetName = 'TilesetReplacement3';
        const tilesetDirectory = path.join(rootDir, tilesetName);
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const tileset2Path = path.join(tilesetDirectory, 'tileset2.json');
        const tileNames = ['parent', 'll', 'lr', 'ur', 'ul'];
        const tileOptions = [
            parentTileOptions,
            llTileOptions,
            lrTileOptions,
            urTileOptions,
            ulTileOptions
        ];

        const result = TilesetUtilsNext.createBuildingGltfsWithFeatureMetadata(
            tileOptions
        );

        const gltfs = result.gltfs;
        const batchTables = result.batchTables;

        const tilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            properties: undefined,
            geometricError: largeGeometricError,
            root: {
                boundingVolume: {
                    region: parentRegion
                },
                geometricError: smallGeometricError,
                refine: 'REPLACE',
                content: {
                    uri: 'parent' + ext,
                    boundingVolume: {
                        region: parentContentRegion
                    }
                },
                children: [
                    {
                        boundingVolume: {
                            region: childrenRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'ADD',
                        content: {
                            uri: 'tileset2.json'
                        }
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
                    region: childrenRegion
                },
                geometricError: smallGeometricError,
                refine: 'REPLACE',
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

        tilesetJson.properties = getProperties(batchTables);
        await saveJson(tilesetPath, tilesetJson, args.prettyJson, args.gzip);

        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = tileNames[i] + ext;
            await writeTile(tilesetDirectory, tileFilename, gltf, args);
        }
    }

    export async function createTilesetWithTransforms(args: GeneratorArgs) {
        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetName = 'TilesetWithTransforms';
        const tilesetDirectory = path.join(rootDir, tilesetName);
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const buildingsTileName = 'buildings' + ext;
        const buildingsTilePath = path.join(
            tilesetDirectory,
            buildingsTileName
        );
        const instancesTileName = 'instances' + ext;
        const instancesTilePath = path.join(
            tilesetDirectory,
            instancesTileName
        );
        const rootTransform = Matrix4.pack(buildingsTransform, new Array(16));
        const rotation = Quaternion.fromAxisAngle(
            Cartesian3.UNIT_Z,
            CesiumMath.PI_OVER_FOUR
        );
        const translation = new Cartesian3(0, 0, 5.0);
        const scale = new Cartesian3(0.5, 0.5, 0.5);
        const childMatrix = Matrix4.fromTranslationQuaternionRotationScale(
            translation,
            rotation,
            scale
        );
        const childTransform = Matrix4.pack(childMatrix, new Array(16));

        const buildingsOptions = {
            buildingOptions: buildingTemplate,
            transform: Matrix4.IDENTITY
        };

        const tilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            properties: undefined,
            geometricError: smallGeometricError,
            root: {
                boundingVolume: {
                    box: smallBoxLocal
                },
                transform: rootTransform,
                geometricError: instancesGeometricError,
                refine: 'ADD',
                content: {
                    uri: buildingsTileName
                },
                children: [
                    {
                        boundingVolume: {
                            box: instancesBoxLocal
                        },
                        transform: childTransform,
                        geometricError: 0.0,
                        content: {
                            uri: instancesTileName
                        }
                    }
                ]
            }
        };

        const instancedTile = await getGltfFromGlbUri(
            instancesUri,
            gltfConversionOptions
        );

        //
        // i3dm (gltf)
        //

        const instancedPositions = InstanceTileUtils.getPositions(
            instancesLength,
            instancesTileWidth,
            instancesModelSize,
            Matrix4.IDENTITY
        );

        // add EXT_mesh_gpu_instancing
        const positionAccessorIndex = instancedTile.accessors.length;
        addBinaryBuffers(instancedTile, instancedPositions);
        createEXTMeshInstancingExtension(
            instancedTile,
            instancedTile.nodes[0],
            {
                attributes: {
                    TRANSLATION: positionAccessorIndex
                }
            }
        );

        // CESIUM_3dtiles_feature_metadata
        const prim = instancedTile.meshes[0].primitives[0];
        FeatureMetadata.updateExtensionUsed(instancedTile);
        FeatureMetadata.addFeatureLayer(prim, {
            featureTable: 0,
            vertexAttribute: {
                implicit: {
                    increment: 0,
                    start: 0
                }
            }
        });

        FeatureMetadata.addFeatureTable(instancedTile, {
            featureCount: instancesLength,
            properties: {
                Height: {
                    values: new Array(instancesLength).fill(instancesModelSize)
                }
            }
        });

        //
        // b3dm (gltf)
        //
        const buildings = createBuildings(buildingsOptions.buildingOptions);
        const buildingTable = generateBuildingBatchTable(buildings);
        delete buildingTable.id;
        const batchedMesh = Mesh.batch(
            FeatureTableUtils.createMeshes(buildingsTransform, buildings, false)
        );

        const gltfOptions = {
            mesh: batchedMesh,
            useBatchIds: false,
            relativeToCenter: true,
            deprecated: false,
            use3dTilesNext: true,
            featureTableJson: undefined
        };

        const buildingTile = createGltf(gltfOptions) as Gltf;
        FeatureMetadata.updateExtensionUsed(buildingTile);
        buildingTile.meshes[0].primitives[0].extensions = {
            CESIUM_3dtiles_feature_metadata: {
                featureLayers: [
                    {
                        featureTable: 0,
                        vertexAttribute: {
                            implicit: {
                                increment: 1,
                                start: 0
                            }
                        }
                    }
                ]
            }
        };

        buildingTile.extensions = {
            CESIUM_3dtiles_feature_metadata: {
                featureTables: [
                    {
                        featureCount: buildingTable.Height.length,
                        properties: {
                            Height: { values: buildingTable.Height },
                            Longitude: { values: buildingTable.Longitude },
                            Latitude: { values: buildingTable.Latitude }
                        }
                    }
                ]
            }
        };

        tilesetJson.properties = getProperties(buildingTable);
        await writeTileset(tilesetDirectory, tilesetJson as any, args);
        await writeTile(
            tilesetDirectory,
            buildingsTileName,
            buildingTile,
            args
        );
        await writeTile(
            tilesetDirectory,
            instancesTileName,
            instancedTile,
            args
        );
    }

    export async function createTilesetWithViewerRequestVolume(
        args: GeneratorArgs
    ) {
        // Create a tileset with one root tile and four child tiles
        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetName = 'TilesetWithViewerRequestVolume';
        const tilesetDirectory = path.join(rootDir, tilesetName);
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const tileNames = ['ll', 'lr', 'ur', 'ul'];
        const tileOptions = [
            llTileOptions,
            lrTileOptions,
            urTileOptions,
            ulTileOptions
        ];
        const pointCloudTileName = 'points' + ext;
        const pointCloudTilePath = path.join(
            tilesetDirectory,
            pointCloudTileName
        );

        const pointsLength = 1000;
        const pointCloudTileWidth = 20.0;
        const pointCloudRadius = pointCloudTileWidth / 2.0;
        const pointCloudSphereLocal = [0.0, 0.0, 0.0, pointCloudRadius];
        const pointCloudHeight = pointCloudRadius + 5.0;
        const pointCloudMatrix = wgs84Transform(
            longitude,
            latitude,
            pointCloudHeight
        );
        const pointCloudTransform = Matrix4.pack(
            pointCloudMatrix,
            new Array(16)
        );
        const pointCloudViewerRequestSphere = [
            0.0,
            0.0,
            0.0,
            pointCloudTileWidth * 50.0
        ]; // Point cloud only become visible when you are inside the request volume

        const pointCloudOptions = {
            tileWidth: pointCloudTileWidth,
            pointsLength: pointsLength,
            transform: Matrix4.IDENTITY,
            shape: 'sphere',
            use3dTilesNext: true
        };

        const tilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            geometricError: largeGeometricError,
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
                    },
                    {
                        transform: pointCloudTransform,
                        viewerRequestVolume: {
                            sphere: pointCloudViewerRequestSphere
                        },
                        boundingVolume: {
                            sphere: pointCloudSphereLocal
                        },
                        geometricError: 0.0,
                        content: {
                            uri: 'points' + ext
                        }
                    }
                ]
            }
        };

        // TODO: Abstract the point cloud creation logic into smaller functions
        //       so the `use-3dtiles-next` flag is unnecessary and this code
        //       matches compositeSamplesNext / instanceSamplesNext
        const gltf = createPointCloudTile(pointCloudOptions).gltf;
        await writeTilesetAndTile(
            tilesetDirectory,
            pointCloudTileName,
            tilesetJson as any,
            gltf,
            args
        );

        const result = TilesetUtilsNext.createBuildingGltfsWithFeatureMetadata(
            tileOptions
        );

        const gltfs = result.gltfs;

        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = tileNames[i] + ext;
            await writeTile(tilesetDirectory, tileFilename, gltf, args);
        }
    }

    export async function createTilesetReplacementWithViewerRequestVolume(
        args: GeneratorArgs
    ) {
        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetName = 'TilesetReplacementWithViewerRequestVolume';
        const tilesetDirectory = path.join(rootDir, tilesetName);
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const tileNames = ['parent', 'll', 'lr', 'ur', 'ul'];
        const tileOptions = [
            parentTileOptions,
            llTileOptions,
            lrTileOptions,
            urTileOptions,
            ulTileOptions
        ];

        const requestHeight = 50.0;
        const childRequestRegion = [
            longitude - longitudeExtent / 2.0,
            latitude - latitudeExtent / 2.0,
            longitude + longitudeExtent / 2.0,
            latitude + latitudeExtent / 2.0,
            0.0,
            requestHeight
        ];

        const tilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            properties: undefined,
            geometricError: largeGeometricError,
            root: {
                boundingVolume: {
                    region: parentRegion
                },
                geometricError: largeGeometricError,
                refine: 'REPLACE',
                children: [
                    {
                        boundingVolume: {
                            region: parentRegion
                        },
                        geometricError: smallGeometricError,
                        refine: 'REPLACE',
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
                                viewerRequestVolume: {
                                    region: childRequestRegion
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
                                viewerRequestVolume: {
                                    region: childRequestRegion
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
                                viewerRequestVolume: {
                                    region: childRequestRegion
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
                                viewerRequestVolume: {
                                    region: childRequestRegion
                                },
                                geometricError: 0.0,
                                content: {
                                    uri: 'ul' + ext
                                }
                            }
                        ]
                    }
                ]
            }
        };

        const result = TilesetUtilsNext.createBuildingGltfsWithFeatureMetadata(
            tileOptions
        );

        const gltfs = result.gltfs;

        await saveJson(tilesetPath, tilesetJson, args.prettyJson, args.gzip);
        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = tileNames[i] + ext;
            await writeTile(tilesetDirectory, tileFilename, gltf, args);
        }
    }

    export async function createTilesetSubtreeExpiration(args: GeneratorArgs) {
        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetName = 'TilesetSubtreeExpiration';
        const tilesetDirectory = path.join(rootDir, tilesetName);
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const subtreePath = path.join(tilesetDirectory, 'subtree.json');
        const tileNames = ['parent', 'll', 'lr', 'ur', 'ul'];
        const tileOptions = [
            parentTileOptions,
            llTileOptions,
            lrTileOptions,
            urTileOptions,
            ulTileOptions
        ];

        const tilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
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
                    boundingVolume: {
                        region: parentContentRegion
                    },
                    uri: 'parent' + ext
                },
                children: [
                    {
                        expire: {
                            duration: 5.0
                        },
                        boundingVolume: {
                            region: childrenRegion
                        },
                        geometricError: smallGeometricError,
                        content: {
                            uri: 'subtree.json'
                        }
                    }
                ]
            }
        };

        const subtreeJson = {
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

        const result = TilesetUtilsNext.createBuildingGltfsWithFeatureMetadata(
            tileOptions
        );

        const gltfs = result.gltfs;
        const batchTables = result.batchTables;
        tilesetJson.properties = getProperties(batchTables);

        await saveJson(tilesetPath, tilesetJson, args.prettyJson, args.gzip);
        await saveJson(subtreePath, subtreeJson, args.prettyJson, args.gzip);

        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tilePath = path.join(tilesetDirectory, tileNames[i] + ext);
            await writeTile(tilePath, '', gltf, args);
        }
    }

    export async function createTilesetPoints(args: GeneratorArgs) {
        // Create a tileset with one root tile and eight child tiles
        const ext = args.useGlb ? '.glb' : '.gltf';
        const tilesetName = 'TilesetPoints';
        const tilesetDirectory = path.join(rootDir, tilesetName);
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        
        const pointsLength = 1000;
        const parentTileWidth = 10.0;
        const parentTileHalfWidth = parentTileWidth / 2.0;
        const parentGeometricError = 1.732 * parentTileWidth; // Diagonal of the point cloud box
        const parentMatrix = wgs84Transform(longitude, latitude, parentTileHalfWidth);
        const parentTransform = Matrix4.pack(parentMatrix, new Array(16));
        const parentBoxLocal = [
            0.0, 0.0, 0.0, // center
            parentTileHalfWidth, 0.0, 0.0,   // width
            0.0, parentTileHalfWidth, 0.0,   // depth
            0.0, 0.0, parentTileHalfWidth    // height
        ];

        const parentTile = createPointCloudTile({
            tileWidth : parentTileWidth * 2.0,
            pointsLength : pointsLength,
            relativeToCenter : false,
            use3dTilesNext : true,
            useGlb: args.useGlb
        }).gltf;
    
        const childrenJson = [];
        const childTiles: Gltf[] = [];
        const childTileWidth = 5.0;
        const childTileHalfWidth = childTileWidth / 2.0;
        const childGeometricError = 1.732 * childTileWidth; // Diagonal of the point cloud box
        const childCenters = [
            [-childTileHalfWidth, -childTileHalfWidth, -childTileHalfWidth],
            [-childTileHalfWidth, childTileHalfWidth, childTileHalfWidth],
            [-childTileHalfWidth, -childTileHalfWidth, childTileHalfWidth],
            [-childTileHalfWidth, childTileHalfWidth, -childTileHalfWidth],
            [childTileHalfWidth, -childTileHalfWidth, -childTileHalfWidth],
            [childTileHalfWidth, childTileHalfWidth, -childTileHalfWidth],
            [childTileHalfWidth, -childTileHalfWidth, childTileHalfWidth],
            [childTileHalfWidth, childTileHalfWidth, childTileHalfWidth]
        ];
    
        for (let i = 0; i < 8; ++i) {
            const childCenter = childCenters[i];
            const childTransform = Matrix4.fromTranslation(Cartesian3.unpack(childCenter));
            childTiles.push(createPointCloudTile({
                tileWidth : childTileWidth * 2.0,
                transform : childTransform,
                pointsLength : pointsLength,
                relativeToCenter : false,
                use3dTilesNext : true,
                useGlb: args.useGlb
            }).gltf as Gltf);
            const childBoxLocal = [
                childCenter[0], childCenter[1], childCenter[2],
                childTileHalfWidth, 0.0, 0.0,   // width
                0.0, childTileHalfWidth, 0.0,   // depth
                0.0, 0.0, childTileHalfWidth    // height
            ];
            childrenJson.push({
                boundingVolume : {
                    box : childBoxLocal
                },
                geometricError : 0.0,
                content : {
                    uri : i + ext
                }
            });
        }
    
        const tilesetJson = {
            asset : {
                version : tilesNextTilesetJsonVersion
            },
            properties : undefined,
            geometricError : parentGeometricError,
            root : {
                boundingVolume : {
                    box : parentBoxLocal
                },
                transform : parentTransform,
                geometricError : childGeometricError,
                refine : 'ADD',
                content : {
                    uri : 'parent' + ext
                },
                children : childrenJson
            }
        };

        await writeTile(tilesetDirectory, 'parent' + ext, parentTile, args);
        await writeTileset(tilesetDirectory, tilesetJson as any, args);

        for (let i = 0; i < 8; ++i) {
            await writeTile(tilesetDirectory, i + ext, childTiles[i] as Gltf, args);
        }
    }

    export async function createTilesetUniform(args: GeneratorArgs) {
        const ext = args.useGlb ? TilesNextExtension.Glb : TilesNextExtension.Gltf;
        const tilesetName = 'TilesetUniform';
        const tilesetDirectory = path.join(rootDir, tilesetName);
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const tileset2Path = path.join(tilesetDirectory, 'tileset2.json');
    
        // Only subdivide the middle tile in level 1. Helps reduce tileset size.
        const subdivideCallback = (level: number, x: number, y: number) =>
            level === 0 || (level === 1 && x === 1 && y === 1);
    
        const results = TilesetUtilsNext.createUniformTileset(3, 3, ext, subdivideCallback);
        const tileOptions = results.tileOptions as TileOptions[];
        const tileNames = results.tileNames;
        const tilesetJson: any = results.tilesetJson;
    
        // Insert an external tileset
        const externalTile1 = clone(tilesetJson.root, true);
        delete externalTile1.transform;
        delete externalTile1.refine;
        delete externalTile1.children;
        externalTile1.content.uri = 'tileset2.json';
    
        const externalTile2 = clone(tilesetJson.root, true);
        delete externalTile2.transform;
        delete externalTile2.content;
    
        const tileset2Json = clone(tilesetJson, true);
        tileset2Json.root = externalTile2;
        tilesetJson.root.children = [externalTile1];

        const result = TilesetUtilsNext.createBuildingGltfsWithFeatureMetadata(
            tileOptions
        );

        const gltfs = result.gltfs;
        const batchTables = result.batchTables;
        tilesetJson.properties = getProperties(batchTables);

        saveJson(tilesetPath, tilesetJson, args.prettyJson, args.gzip);
        saveJson(tileset2Path, tileset2Json, args.prettyJson, args.gzip);

        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tilePath = path.join(tilesetDirectory, tileNames[i]);
            await writeTile(tilePath, '', gltf, args);
        }
    }
}
