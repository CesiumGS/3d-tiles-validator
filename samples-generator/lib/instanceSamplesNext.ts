import { getGltfFromGlbUri } from './gltfFromUri';
import { InstanceTileUtils } from './instanceUtilsNext';
import { GeneratorArgs } from './arguments';
import { addBinaryBuffers } from './gltfUtil';
import { Gltf } from './gltfType';
import {
    metersToLatitude,
    metersToLongitude,
    toCamelCase,
    wgs84Transform
} from './utility';
import { FeatureMetadata } from './featureMetadata';
import { createEXTMeshInstancingExtension } from './createEXTMeshInstancing';
import { createConstantAttributeLEU32 } from './createConstantAttribute';
import { Cartesian3, Matrix4 } from 'cesium';
import { instancesBoxLocal } from './constants';
import { writeTilesetAndTile } from './ioUtil';
import {
    createTilesetJsonSingle,
    TilesetOption
} from './createTilesetJsonSingle';

const gltfPipeline = require('gltf-pipeline');
const glbToGltf = gltfPipeline.glbToGltf;

import path = require('path');
import fsExtra = require('fs-extra');

export namespace InstanceSamplesNext {
    const longitude = -1.31968;
    const latitude = 0.698874;
    const tileWidth = 200.0;
    const instancesUri = 'data/box.glb';
    const instancesLength = 25;
    const instancesModelSize = 20.0;
    const instancesHeight = instancesModelSize + 10.0; // Just a little extra padding at the top for aiding Cesium tests
    const longitudeExtent = metersToLongitude(tileWidth, latitude);
    const latitudeExtent = metersToLatitude(tileWidth);
    const west = longitude - longitudeExtent / 2.0;
    const south = latitude - latitudeExtent / 2.0;
    const east = longitude + longitudeExtent / 2.0;
    const north = latitude + latitudeExtent / 2.0;
    const instancesRegion = [west, south, east, north, 0.0, instancesHeight];
    const instancesTransform = wgs84Transform(
        longitude,
        latitude,
        instancesModelSize / 2.0
    );
    const instancesTexturedUri = 'data/textured_box.glb';

    interface TileOptions {
        instancesLength: number;
        tileWidth: number;
        modelSize: number;
        instancesUri: string;
        rootDir: string;
        embed: boolean;
        transform: Matrix4;
    }

    function getDefaultTileOptions(): TileOptions {
        return {
            instancesLength: instancesLength,
            tileWidth: tileWidth,
            modelSize: instancesModelSize,
            instancesUri: instancesUri,
            rootDir: path.join('output', 'Instanced'),
            embed: false,
            transform: instancesTransform
        };
    }

    function getTilesetOpts(
        contentUri: string,
        geometricError: number,
        versionNumber: string,
        region: number[] = instancesRegion
    ): TilesetOption {
        return {
            contentUri: contentUri,
            geometricError: geometricError,
            versionNumber: versionNumber,
            region: region,
            transform: null
        };
    }

    async function getGltfFromUri(
        uri: string,
        gltfConversionOptions: { resourceDirectory: string }
    ): Promise<Gltf> {
        const glb = (await fsExtra.readFile(uri)) as Buffer;
        return (await glbToGltf(glb, gltfConversionOptions)).gltf as Gltf;
    }

    export async function createInstancedWithBatchTable(args: GeneratorArgs) {
        const opts = InstanceTileUtils.getDefaultTileOptions(
            'output/Instanced'
        );
        let gltf = await getGltfFromGlbUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const eastNorthUp = InstanceTileUtils.eastNorthUpQuaternion(positions);

        // add EXT_mesh_gpu_instancing
        const positionAccessorIndex = gltf.accessors.length;
        const eastNorthUpAccessorIndex = gltf.accessors.length + 1;

        addBinaryBuffers(gltf, positions, eastNorthUp);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex,
                ROTATION: eastNorthUpAccessorIndex
            }
        });

        // CESIUM_3dtiles_feature_metadata
        const prim = gltf.meshes[0].primitives[0];
        FeatureMetadata.updateExtensionUsed(gltf);
        FeatureMetadata.addFeatureLayer(prim, {
            featureTable: 0,
            instanceStride: 1,
            vertexAttribute: {
                implicit: {
                    increment: 0,
                    start: 0
                }
            }
        });

        FeatureMetadata.addFeatureTable(gltf, {
            featureCount: opts.instancesLength,
            properties: {
                Height: {
                    values: new Array(opts.instancesLength).fill(opts.modelSize)
                }
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedWithBatchTable';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber,
            instancesRegion
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts);
        await writeTilesetAndTile(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedWithBatchTableBinary(
        args: GeneratorArgs
    ) {
        const opts = InstanceTileUtils.getDefaultTileOptions(
            'output/Instanced'
        );
        let gltf = await getGltfFromGlbUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const eastNorthUp = InstanceTileUtils.eastNorthUpQuaternion(positions);

        // Add instancing (EXT_mesh_gpu_instancing)
        const positionAccessorIndex = gltf.accessors.length;
        const eastNorthUpAccessorIndex = gltf.accessors.length + 1;
        addBinaryBuffers(gltf, positions, eastNorthUp);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex,
                ROTATION: eastNorthUpAccessorIndex
            }
        });

        const heightFeatureData = createConstantAttributeLEU32(
            'Height',
            opts.modelSize,
            opts.instancesLength
        );

        const heightAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, heightFeatureData);

        const primitive = gltf.meshes[0].primitives[0];
        FeatureMetadata.updateExtensionUsed(gltf);

        FeatureMetadata.addFeatureLayer(primitive, {
            featureTable: 0,
            instanceStride: 1,
            vertexAttribute: {
                implicit: {
                    increment: 0,
                    start: 0
                }
            }
        });

        FeatureMetadata.addFeatureTable(gltf, {
            featureCount: opts.instancesLength,
            properties: {
                Height: {
                    accessor: heightAccessorIndex
                }
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedWithBatchTableBinary';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber,
            instancesRegion
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts);
        await writeTilesetAndTile(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedOrientation(args: GeneratorArgs) {
        const opts = InstanceTileUtils.getDefaultTileOptions(
            'output/Instanced'
        );
        let gltf = await getGltfFromGlbUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const quaternions = InstanceTileUtils.getQuaternionNormals(
            opts.instancesLength
        );

        const positionAccessorIndex = gltf.accessors.length;
        const quaternionsAccessorIndex = positionAccessorIndex + 1;
        addBinaryBuffers(gltf, positions, quaternions);

        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex,
                ROTATION: quaternionsAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedOrientation';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber,
            instancesRegion
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts);
        await writeTilesetAndTile(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedScaleNonUniform(args: GeneratorArgs) {
        const opts = InstanceTileUtils.getDefaultTileOptions(
            'output/Instanced'
        );
        const gltf = await getGltfFromGlbUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );
        const eastNorthUp = InstanceTileUtils.eastNorthUpQuaternion(positions);

        const nonUniformScales = InstanceTileUtils.getNonUniformScales(
            opts.instancesLength
        );

        const positionAccessorIndex = gltf.accessors.length;
        const nonUniformScalesAccessorIndex = gltf.accessors.length + 1;
        const eastNorthUpAccessorIndex = gltf.accessors.length + 2;

        addBinaryBuffers(gltf, positions, nonUniformScales, eastNorthUp);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex,
                SCALE: nonUniformScalesAccessorIndex,
                ROTATION: eastNorthUpAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedScaleNonUniform';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber,
            instancesRegion
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts);
        await writeTilesetAndTile(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedScale(args: GeneratorArgs) {
        const opts = InstanceTileUtils.getDefaultTileOptions(
            'output/Instanced'
        );
        const gltf = await getGltfFromGlbUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );
        const eastNorthUp = InstanceTileUtils.eastNorthUpQuaternion(positions);

        const uniformScale = InstanceTileUtils.getUniformScales(
            opts.instancesLength
        );

        const positionAccessorIndex = gltf.accessors.length;
        const uniformScaleAccessorIndex = gltf.accessors.length + 1;
        const eastNorthUpAccessorIndex = gltf.accessors.length + 2;
        addBinaryBuffers(gltf, positions, uniformScale, eastNorthUp);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex,
                SCALE: uniformScaleAccessorIndex,
                ROTATION: eastNorthUpAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedScale';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber,
            instancesRegion
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts);
        await writeTilesetAndTile(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedRTC(args: GeneratorArgs) {
        const opts = InstanceTileUtils.getDefaultTileOptions(
            'output/Instanced'
        );
        const gltf = await getGltfFromGlbUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const center = Matrix4.multiplyByPoint(
            opts.transform,
            new Cartesian3(),
            new Cartesian3()
        );

        const rtcPositions = InstanceTileUtils.getPositionsRTC(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform,
            center
        );

        const eastNorthUp = InstanceTileUtils.eastNorthUpQuaternion(
            rtcPositions
        );

        const rtcPositionAccessorIndex = gltf.accessors.length;
        const eastNorthUpAccessorIndex = gltf.accessors.length + 1;
        addBinaryBuffers(gltf, rtcPositions, eastNorthUp);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: rtcPositionAccessorIndex,
                ROTATION: eastNorthUpAccessorIndex
            }
        });

        gltf.nodes = [
            {
                name: 'RTC_CENTER',
                mesh: gltf.nodes[0].mesh!,
                translation: [center.x, center.y, center.z],
                extensions: gltf.nodes[0].extensions!
            }
        ];

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedRTC';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber,
            instancesRegion
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts);
        await writeTilesetAndTile(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedWithTransform(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        const gltf = await getGltfFromUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        opts.transform = Matrix4.IDENTITY;

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedWithTransform';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        delete tilesetOpts.region;
        tilesetOpts.box = instancesBoxLocal;
        tilesetOpts.transform = instancesTransform;

        let tilesetJson = createTilesetJsonSingle(tilesetOpts);
        await writeTilesetAndTile(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedRedMaterial(args: GeneratorArgs) {
        const opts = InstanceTileUtils.getDefaultTileOptions(
            'output/Instanced'
        );
        opts.instancesUri = 'data/red_box.glb';
        const gltf = await getGltfFromGlbUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const eastNorthUp = InstanceTileUtils.eastNorthUpQuaternion(positions);

        const positionAccessorIndex = gltf.accessors.length;
        const eastNorthUpAccessorIndex = gltf.accessors.length + 1;
        addBinaryBuffers(gltf, positions, eastNorthUp);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex,
                ROTATION: eastNorthUpAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedRedMaterial';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber,
            instancesRegion
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts);
        await writeTilesetAndTile(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedTextured(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        opts.instancesUri = instancesTexturedUri;
        const gltf = await getGltfFromUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );
        const eastNorthUp = InstanceTileUtils.eastNorthUpQuaternion(positions);

        const positionAccessorIndex = gltf.accessors.length;
        const eastNorthUpAccessorIndex = gltf.accessors.length + 1;
        addBinaryBuffers(gltf, positions, eastNorthUp);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex,
                ROTATION: eastNorthUpAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedTextured';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts);
        await writeTilesetAndTile(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }
}
