const Cesium = require('cesium');
const Cartesian3 = Cesium.Cartesian3;
const Matrix4 = Cesium.Matrix4;
const gltfPipeline = require('gltf-pipeline');
const glbToGltf = gltfPipeline.glbToGltf;
const gltfToGlb = gltfPipeline.gltfToGlb;
const util = require('../lib/utility');
const wgs84Transform = util.wgs84Transform;
const metersToLongitude = util.metersToLongitude;
const metersToLatitude = util.metersToLatitude;

import { InstanceTileUtils } from './instanceUtilsNext';
import { GeneratorArgs } from './arguments';
import { addBinaryBuffers } from './gltfUtil';
import { Gltf } from './gltfType';
import { toCamelCase } from './utility';
import { TilesetJson } from './tilesetJson';
import saveJson = require('./saveJson');
import saveBinary = require('./saveBinary');
import createTilesetJsonSingle = require('./createTilesetJsonSingle');
import fsExtra = require('fs-extra');
import path = require('path');
import createFeatureMetadataExtension = require('./createFeatureMetadataExtension');
import { FeatureMetadata } from './featureMetadata';
import { createEXTMeshInstancingExtension } from './createEXTMeshInstancing';

export namespace InstanceSamplesNext {
    const longitude = -1.31968;
    const latitude = 0.698874;
    const tileWidth = 200.0;
    const instancesModelSize = 20.0;
    const instancesHeight = instancesModelSize + 10.0; // Just a little extra padding at the top for aiding Cesium tests
    const longitudeExtent = metersToLongitude(tileWidth, latitude);
    const latitudeExtent = metersToLatitude(tileWidth);
    const west = longitude - longitudeExtent / 2.0;
    const south = latitude - latitudeExtent / 2.0;
    const east = longitude + longitudeExtent / 2.0;
    const north = latitude + latitudeExtent / 2.0;
    const instancesRegion = [west, south, east, north, 0.0, instancesHeight];
    const instancesTileWidth = tileWidth;
    const instancesTransform = wgs84Transform(
        longitude,
        latitude,
        instancesModelSize / 2.0
    );
    const instancesTexturedUri = 'data/textured_box.glb';

    const instancesBoxLocal = [
        0.0,
        0.0,
        0.0, // center
        instancesTileWidth / 2.0,
        0.0,
        0.0, // width
        0.0,
        instancesTileWidth / 2.0,
        0.0, // depth
        0.0,
        0.0,
        instancesHeight / 2.0 // height
    ];

    interface TileOptions {
        instancesLength: number;
        tileWidth: number;
        modelSize: number;
        instancesUri: string;
        rootDir: string;
        embed: boolean;
        transform: object; // should be a Cesium.Matrix4
    }

    function getDefaultTileOptions(): TileOptions {
        return {
            instancesLength: 24,
            tileWidth: 200,
            modelSize: 20,
            instancesUri: 'data/box.glb',
            rootDir: path.join('output', 'Instanced'),
            embed: false,
            transform: wgs84Transform(
                longitude,
                latitude,
                instancesModelSize / 2.0
            )
        };
    }

    function getTilesetOpts(
        contentUri: string,
        geometricError: number,
        versionNumber: string
    ): TilesetJson {
        return {
            contentUri: contentUri,
            geometricError: geometricError,
            versionNumber: versionNumber,
            region: instancesRegion
        };
    }

    async function getGltfFromUri(
        uri: string,
        gltfConversionOptions: { resourceDirectory: string }
    ): Promise<Gltf> {
        const glb = (await fsExtra.readFile(uri)) as Buffer;
        return (await glbToGltf(glb, gltfConversionOptions)).gltf as Gltf;
    }

    async function writeOutputToDisk(
        destFolder: string,
        tileFileName: string,
        tileset: TilesetJson,
        gltf: Gltf,
        args: GeneratorArgs
    ) {
        const tilesetDestination = path.join(destFolder, 'tileset.json');
        await saveJson(tilesetDestination, tileset, args.prettyJson, args.gzip);

        let tileDestination = path.join(destFolder, tileFileName);
        if (!args.useGlb) {
            await saveJson(tileDestination, gltf, args.prettyJson, args.gzip);
        } else {
            const glb = (await gltfToGlb(gltf, args.gltfConversionOptions)).glb;
            await saveBinary(tileDestination, glb, args.gzip);
        }
    }

    export async function createInstancedWithBatchTable(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        let gltf = await getGltfFromUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        // add EXT_mesh_gpu_instancing
        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
            }
        });

        // CESIUM_3dtiles_feature_metadata
        const prim = gltf.meshes[0].primitives[0];
        FeatureMetadata.updateExtensionUsed(gltf);
        FeatureMetadata.addFeatureLayer(prim, {
            featureTable: 0,
            vertexAttribute: {
                implicit: {
                    increment: 0,
                    start: opts.modelSize
                }
            }
        });

        FeatureMetadata.addFeatureTable(gltf, {
            featureCount: opts.instancesLength
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedWithBatchTable';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
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
        const opts = getDefaultTileOptions();
        let gltf = await getGltfFromUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        // Add instancing (EXT_mesh_gpu_instancing)
        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
            }
        });

        const binaryBatchTableJson = InstanceTileUtils.generateBatchTableBinary(
            opts.instancesLength,
            opts.modelSize
        );

        // add BatchBinary as 'FeatureMetadata'
        const binaryId = binaryBatchTableJson.json.id;
        const binaryIdAccessor = gltf.accessors.length;
        addBinaryBuffers(gltf, {
            buffer: binaryBatchTableJson.binary,
            componentType: binaryId.componentType,
            count: binaryId.count,
            max: binaryId.max,
            min: binaryId.min,
            type: binaryId.type
        })

        const primitive = gltf.meshes[0].primitives[0];
        FeatureMetadata.updateExtensionUsed(gltf);

        primitive.attributes['_FEATURE_ID_0'] = binaryIdAccessor;
        FeatureMetadata.addFeatureLayer(primitive, {
            featureTable: 0, 
            vertexAttribute: {
                attributeindex: 0
            }
        });

        FeatureMetadata.addFeatureTable(gltf, {
            featureCount: opts.instancesLength,
            properties: {
                id: {
                    accessor: binaryIdAccessor
                }
            }
        })

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedWithBatchTableBinary';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedOrientation(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        let gltf = await getGltfFromUri(
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
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedScaleNonUniform(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
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

        const nonUniformScales = InstanceTileUtils.getNonUniformScales(
            opts.instancesLength
        );

        const positionAccessorIndex = gltf.accessors.length;
        const nonUniformScalesAccessorIndex = gltf.accessors.length + 1;
        addBinaryBuffers(gltf, positions, nonUniformScales);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex,
                SCALE: nonUniformScalesAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedScaleNonUniform';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedScale(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
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

        const uniformScale = InstanceTileUtils.getUniformScales(
            opts.instancesLength
        );

        const positionAccessorIndex = gltf.accessors.length;
        const uniformScaleAccessorIndex = gltf.accessors.length + 1;
        addBinaryBuffers(gltf, positions, uniformScale);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex,
                SCALE: uniformScaleAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedScale';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedRTC(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        const gltf = await getGltfFromUri(
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

        const rtcPositionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, rtcPositions);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: rtcPositionAccessorIndex
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
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
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

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createInstancedRedMaterial(args: GeneratorArgs) {
        const opts = getDefaultTileOptions();
        opts.instancesUri = 'data/red_box.glb';
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

        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'InstancedRedMaterial';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber
        );

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
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

        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
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

        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;
        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }
}
