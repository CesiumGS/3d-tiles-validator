import { GeneratorArgs } from './arguments';
import {
    childrenRegion,
    east,
    gltfConversionOptions,
    gzip,
    latitude,
    llRegion,
    llTileOptions,
    longitude,
    lrRegion,
    lrTileOptions,
    north,
    outputDirectory,
    prettyJson,
    smallGeometricError,
    south,
    tilesNextTilesetJsonVersion,
    tileWidth,
    ulRegion,
    ulTileOptions,
    urRegion,
    urTileOptions,
    west,
    wgs84Transform
} from './constants';
import * as path from 'path';
import { TilesNextExtension } from './tilesNextExtension';
import { Gltf } from './gltfType';
import { writeTile } from './ioUtil';
import { TilesetJson } from './tilesetJson';
import { InstanceTileUtils } from './instanceUtilsNext';
import { addBinaryBuffers } from './gltfUtil';
import { createEXTMeshInstancingExtension } from './createEXTMeshInstancing';
import { getGltfFromGlbUri } from './gltfFromUri';
import { FeatureMetadata } from './featureMetadata';
import { BatchTable} from './createBuildingsTile';
import { clone, Matrix4 } from 'cesium';
import { createPointCloudTile } from './createPointCloudTile';
import { TilesetUtilsNext } from './tilesetUtilsNext';

const getProperties = require('./getProperties');
const fsExtra = require('fs-extra');
const gltfPipeline = require('gltf-pipeline');
const glbToGltf = gltfPipeline.glbToGltf;
const saveJson = require('./saveJson');

export namespace SamplesNext {
    export async function createDiscreteLOD(args: GeneratorArgs) {
        const ext = args.useGlb
            ? TilesNextExtension.Glb
            : TilesNextExtension.Gltf;

        const glbPaths = [
            'data/dragon_high.glb',
            'data/dragon_medium.glb',
            'data/dragon_low.glb'
        ];
        const tileNames = ['dragon_high', 'dragon_medium', 'dragon_low'];
        const tilesetName = 'TilesetWithDiscreteLOD';
        const tilesetDirectory = path.join(
            outputDirectory,
            'Samples',
            tilesetName
        );
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');

        const dragonWidth = 14.191;
        const dragonHeight = 10.075;
        const dragonDepth = 6.281;
        const dragonBox = [
            0.0,
            0.0,
            0.0, // center
            dragonWidth / 2.0,
            0.0,
            0.0, // width
            0.0,
            dragonDepth / 2.0,
            0.0, // depth
            0.0,
            0.0,
            dragonHeight / 2.0 // height
        ];

        const dragonScale = 100.0;
        const dragonOffset = (dragonHeight / 2.0) * dragonScale;
        const wgs84Matrix = wgs84Transform(longitude, latitude, dragonOffset);
        const scaleMatrix = Matrix4.fromUniformScale(dragonScale);
        const dragonMatrix = Matrix4.multiply(
            wgs84Matrix,
            scaleMatrix,
            new Matrix4()
        );
        const dragonTransform = Matrix4.pack(dragonMatrix, new Array(16));

        // At runtime a tile's geometric error is scaled by its computed scale.
        // This doesn't apply to the top-level geometric error.
        const dragonLowGeometricError = 5.0;
        const dragonMediumGeometricError = 1.0;
        const dragonHighGeometricError = 0.1;
        const dragonTilesetGeometricError =
            dragonLowGeometricError * dragonScale;

        const tilesetJson: TilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            geometricError: dragonTilesetGeometricError,
            root: {
                transform: dragonTransform,
                boundingVolume: {
                    box: dragonBox
                },
                geometricError: dragonMediumGeometricError,
                refine: 'REPLACE',
                content: {
                    uri: 'dragon_low' + ext
                },
                children: [
                    {
                        boundingVolume: {
                            box: dragonBox
                        },
                        geometricError: dragonHighGeometricError,
                        content: {
                            uri: 'dragon_medium' + ext
                        },
                        children: [
                            {
                                boundingVolume: {
                                    box: dragonBox
                                },
                                geometricError: 0.0,
                                content: {
                                    uri: 'dragon_high' + ext
                                }
                            }
                        ]
                    }
                ]
            }
        };

        const gltfs: Gltf[] = [];
        for (let i = 0; i < glbPaths.length; ++i) {
            const glbPath = glbPaths[i];
            const glb = await fsExtra.readFile(glbPath);
            const gltf = (await glbToGltf(glb)).gltf as Gltf;
            gltfs.push(gltf);
        }

        await saveJson(tilesetPath, tilesetJson, args.prettyJson, args.gzip);

        for (let i = 0; i < tileNames.length; ++i) {
            const name = tileNames[i] + ext;
            const gltf = gltfs[i];
            await writeTile(tilesetDirectory, name, gltf, args);
        }
    }

    export async function createTreeBillboards(args: GeneratorArgs) {
        const ext = args.useGlb
            ? TilesNextExtension.Glb
            : TilesNextExtension.Gltf;

        // tree
        const treeGlb = 'data/tree.glb';
        const treeTileName = 'tree' + ext;

        // tree_billboard
        const treeBillboardGlb = 'data/tree_billboard.glb';
        const treeBillboardTileName = 'tree_billboard' + ext;

        // Billboard effect is coded in the tree_billboard vertex shader
        const tilesetName = 'TilesetWithTreeBillboards';
        const tilesetDirectory = path.join(
            outputDirectory,
            'Samples',
            tilesetName
        );
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const treeBillboardGeometricError = 100.0;
        const treeGeometricError = 10.0;
        const treesCount = 25;
        const treesHeight = 20.0;
        const treesTileWidth = tileWidth;
        const treesRegion = [west, south, east, north, 0.0, treesHeight];

        interface TreeBillboardData {
            gltf: Gltf;
            tileWidth: number;
            instancesLength: number;
            embed: boolean;
            modelSize: number;
            createBatchTable: boolean;
            eastNorthUp: boolean;
            transform: Matrix4;
            batchTable?: BatchTable;
        }

        const tree: TreeBillboardData = {
            gltf: await getGltfFromGlbUri(treeGlb, gltfConversionOptions),
            tileWidth: treesTileWidth,
            instancesLength: treesCount,
            embed: true,
            modelSize: treesHeight,
            createBatchTable: true,
            eastNorthUp: true,
            transform: wgs84Transform(longitude, latitude, 0.0)
        };

        // Billboard model is centered about the origin
        const billboard: TreeBillboardData = {
            gltf: await getGltfFromGlbUri(
                treeBillboardGlb,
                gltfConversionOptions
            ),
            tileWidth: treesTileWidth,
            instancesLength: treesCount,
            embed: true,
            modelSize: treesHeight,
            createBatchTable: true,
            eastNorthUp: true,
            transform: wgs84Transform(longitude, latitude, treesHeight / 2.0)
        };

        const addInstancingExtAndFeatureTable = (
            data: TreeBillboardData
        ): BatchTable => {
            const positions = InstanceTileUtils.getPositions(
                data.instancesLength,
                data.tileWidth,
                data.modelSize,
                data.transform
            );

            const accessor = data.gltf.accessors.length;
            addBinaryBuffers(data.gltf, positions);
            createEXTMeshInstancingExtension(data.gltf, data.gltf.nodes[0], {
                attributes: {
                    TRANSLATION: accessor
                }
            });

            const heightData = new Array(data.instancesLength).fill(
                data.modelSize
            );

            FeatureMetadata.updateExtensionUsed(data.gltf);

            const primitive = data.gltf.meshes[0].primitives[0];

            FeatureMetadata.addFeatureLayer(primitive, {
                featureTable: 0,
                instanceStride: 1,
                vertexAttribute: {
                    implicit: {
                        increment: 1,
                        start: 0
                    }
                }
            });

            FeatureMetadata.addFeatureTable(data.gltf, {
                featureCount: data.instancesLength,
                properties: {
                    Height: { values: heightData }
                }
            });

            return {
                Height: heightData
            };
        };

        const treeBatchTable = addInstancingExtAndFeatureTable(tree);
        const billboardBatchTable = addInstancingExtAndFeatureTable(billboard);

        // This is unnecessary right now, as the treeBatchTable and
        // billboardBatchTable share the same instance height, but if we
        // ever want to change one of their heights, we'll need `getProperties`
        // to iterate through both arrays to find the true minimum / maximum.

        const concatenatedBatchTable = {
            Height: [...treeBatchTable.Height, ...billboardBatchTable.Height]
        };

        const tilesetJson: TilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            geometricError: treeBillboardGeometricError,
            root: {
                boundingVolume: {
                    region: treesRegion
                },
                geometricError: treeGeometricError,
                refine: 'REPLACE',
                content: {
                    uri: 'tree_billboard' + ext
                },
                children: [
                    {
                        boundingVolume: {
                            region: treesRegion
                        },
                        geometricError: 0.0,
                        content: {
                            uri: 'tree' + ext
                        }
                    }
                ]
            }
        };
        tilesetJson.properties = getProperties(concatenatedBatchTable);

        await saveJson(tilesetPath, tilesetJson, args.prettyJson, args.gzip);
        await writeTile(tilesetDirectory, treeTileName, tree.gltf, args);
        await writeTile(
            tilesetDirectory,
            treeBillboardTileName,
            billboard.gltf,
            args
        );
    }

    export async function createRequestVolume(args: GeneratorArgs) {
        const ext = args.useGlb
            ? TilesNextExtension.Glb
            : TilesNextExtension.Gltf;

        const tilesetName = 'TilesetWithRequestVolume';
        const tilesetDirectory = path.join(
            outputDirectory,
            'Samples',
            tilesetName
        );
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const buildingGlbPath = 'data/building.glb';
        const buildingTileName = 'building' + ext;
        const buildingTilePath = path.join(tilesetDirectory, buildingTileName);
        const pointCloudTileName = 'points' + ext;

        const cityTilesetPath = path.join(
            tilesetDirectory,
            'city',
            'tileset.json'
        );
        const cityTileNames = ['ll' + ext, 'lr' + ext, 'ur' + ext, 'ul' + ext];
        const cityTileOptions = [
            llTileOptions,
            lrTileOptions,
            urTileOptions,
            ulTileOptions
        ];

        const buildingWidth = 3.738;
        const buildingDepth = 3.72;
        const buildingHeight = 13.402;
        const buildingGeometricError = 100.0; // Estimate based on diagonal
        const buildingScale = 5.0;
        const wgs84Matrix = wgs84Transform(longitude, latitude, 0.0);
        const scaleMatrix = Matrix4.fromUniformScale(buildingScale);
        const buildingMatrix = Matrix4.multiply(
            wgs84Matrix,
            scaleMatrix,
            new Matrix4()
        );
        const buildingTransform = Matrix4.pack(buildingMatrix, new Array(16));
        const buildingBoxLocal = [
            0.0,
            0.0,
            buildingHeight / 2.0, // center
            buildingWidth / 2.0,
            0.0,
            0.0, // width
            0.0,
            buildingDepth / 2.0,
            0.0, // depth
            0.0,
            0.0,
            buildingHeight / 2.0 // height
        ];

        const pointsLength = 125000;
        const pointCloudTileWidth = 2.5;
        const pointCloudRadius = pointCloudTileWidth / 2.0;
        const pointCloudSphereLocal = [0.0, 0.0, 0.0, pointCloudRadius];
        // Try to place it in one of the building's floors
        const pointCloudHeight = pointCloudRadius + 0.2;
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
            pointCloudTileWidth * 6.0
        ]; // Point cloud only become visible when you are inside the request volume

        const pointCloudOptions = {
            tileWidth: pointCloudTileWidth,
            pointsLength: pointsLength,
            transform: Matrix4.IDENTITY,
            relativeToCenter: false,
            shape: 'sphere',
            use3dTilesNext: true
        };

        const totalRegion = clone(childrenRegion);
        totalRegion[5] = buildingHeight * buildingScale;

        const tilesetJson: TilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            geometricError: buildingGeometricError,
            root: {
                boundingVolume: {
                    region: totalRegion
                },
                geometricError: buildingGeometricError,
                refine: 'ADD',
                children: [
                    {
                        boundingVolume: {
                            region: childrenRegion
                        },
                        geometricError: smallGeometricError,
                        content: {
                            uri: 'city/tileset.json'
                        }
                    },
                    {
                        transform: buildingTransform,
                        boundingVolume: {
                            box: buildingBoxLocal
                        },
                        geometricError: 0.0,
                        content: {
                            uri: buildingTileName
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
                            uri: pointCloudTileName
                        }
                    }
                ]
            }
        };

        const cityTilesetJson: TilesetJson = {
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

        const pntsGltf = createPointCloudTile(pointCloudOptions).gltf;

        const result = TilesetUtilsNext.createBuildingGltfsWithFeatureMetadata(
            cityTileOptions
        );

        const gltfs = result.gltfs;
        for (let i = 0; i < gltfs.length; ++i) {
            const gltf = gltfs[i];
            const tileFilename = cityTileNames[i];
            await writeTile(tilesetDirectory, tileFilename, gltf, args);
        }

        const buildingGltf =
            await getGltfFromGlbUri(buildingGlbPath, gltfConversionOptions);

        await writeTile(buildingTilePath, '', buildingGltf, args);
        await saveJson(tilesetPath, tilesetJson, prettyJson, gzip);
        await saveJson(cityTilesetPath, cityTilesetJson, prettyJson, gzip);

        await writeTile(
            tilesetDirectory,
            pointCloudTileName,
            pntsGltf,
            args
        );
    }

    export async function createExpireTileset(args: GeneratorArgs) {
        const ext = args.useGlb
            ? TilesNextExtension.Glb
            : TilesNextExtension.Gltf;

        const tilesetName = 'TilesetWithExpiration';
        const tilesetDirectory = path.join(
            outputDirectory,
            'Samples',
            tilesetName
        );
        const tilesetPath = path.join(tilesetDirectory, 'tileset.json');
        const pointCloudTileName = 'point' + ext;
        const pointCloudTilePath = path.join(
            tilesetDirectory,
            pointCloudTileName
        );

        const pointsLength = 8000;
        const pointCloudTileWidth = 200.0;
        const pointCloudSphereLocal = [
            0.0,
            0.0,
            0.0,
            pointCloudTileWidth / 2.0
        ];

        // Diagonal of the point cloud box
        const pointCloudGeometricError = 1.732 * pointCloudTileWidth;
        const pointCloudMatrix = wgs84Transform(
            longitude,
            latitude,
            pointCloudTileWidth / 2.0
        );
        const pointCloudTransform = Matrix4.pack(
            pointCloudMatrix,
            new Array(16)
        );

        const pointCloudOptions = {
            tileWidth: pointCloudTileWidth,
            pointsLength: pointsLength,
            perPointProperties: true,
            transform: Matrix4.IDENTITY,
            relativeToCenter: false,
            color: 'noise',
            shape: 'box',
            use3dTilesNext: true
        };

        const gltfPnts = createPointCloudTile(pointCloudOptions).gltf;
        await writeTile(pointCloudTilePath, '', gltfPnts, args);

        // Save a few tiles for the server cache
        for (let i = 0; i < 5; ++i) {
            const tilePath = path.join(
                tilesetDirectory,
                'cache',
                'points_' + i + ext
            );
            const tileOptions = clone(pointCloudOptions);
            tileOptions.time = i * 0.1;
            const tile = createPointCloudTile(tileOptions).gltf;
            await writeTile(tilePath, '', tile, args);
        }

        const tilesetJson: TilesetJson = {
            asset: {
                version: tilesNextTilesetJsonVersion
            },
            geometricError: pointCloudGeometricError,
            root: {
                expire: {
                    duration: 5.0
                },
                transform: pointCloudTransform,
                boundingVolume: {
                    sphere: pointCloudSphereLocal
                },
                geometricError: 0.0,
                refine: 'ADD',
                content: {
                    uri: pointCloudTileName
                }
            }
        };

        await saveJson(tilesetPath, tilesetJson, prettyJson, gzip);
    }
}
