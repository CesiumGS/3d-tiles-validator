import { GeneratorArgs } from './arguments';
import { toCamelCase } from './utility';
import { getTilesetOpts, TilesetJson } from './tilesetJson';
import { writeOutputToDisk } from './ioUtil';
import { InstanceTileUtils } from './instanceUtilsNext';
import { addBinaryBuffers } from './gltfUtil';
import { getGltfFromGlbUri } from './gltfFromUri';
import {
    instancesRegion,
    instancesLength,
    instancesModelSize
} from './constants';
import { createFeatureMetadataExtensionV2 } from './featureMetadataExtension';
import { FeatureTableType } from './featureMetadataType';
import path = require('path');
import { FeatureTableUtils } from './featureMetatableUtilsNext';
import { createBuildings } from './createBuilding';
import { Mesh } from './Mesh';
import { addBatchedMeshToGltf } from './addMeshToGltf';
import { generateBuildingBatchTable } from './createBuildingsTile';
import createTilesetJsonSingle = require('./createTilesetJsonSingle');
import getProperties = require('./getProperties');
import { createEXTMeshInstancingExtension } from './createEXTMeshInstancing';

export namespace CompositeSamplesNext {
    export async function createComposite(args: GeneratorArgs) {
        // i3dm
        const opts = InstanceTileUtils.getDefaultTileOptions(
            'output/Composite'
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

        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
            }
        });

        // add an empty feature metadata extension table; i3dm uses
        // implicit per-vertex feature IDs, so we don't need to add an
        // explicit _FEATURE_ID_X attribute to the primitive, or a
        // explicit featureTable
        gltf.extensionsUsed.push('CESIUM_3dtiles_feature_metadata');
        gltf.extensions = {
            CESIUM_3dtiles_feature_metadata: {
                featureTables: [{ featureCount: instancesLength }]
            }
        };

        // all the heights are the same, so we can use the
        // implicit per-vertex feature IDs, so we don't need
        gltf.meshes[0].primitives[0].extensions = {
            CESIUM_3dtiles_feature_metadata: {
                featureLayers: [
                    {
                        featureTable: 0,
                        vertexAttribute: {
                            implicit: {
                                start: instancesModelSize,
                                increment: 0
                            }
                        }
                    }
                ]
            }
        };


        //
        // b3dm
        //

        // create the necessary data for b3dm, add it to the existing gltf
        const transform = FeatureTableUtils.getDefaultTransform();
        const buildingOptions = FeatureTableUtils.getDefaultBuildingGenerationOptions();
        const buildings = createBuildings(buildingOptions);
        const batchedMesh = Mesh.batch(
            FeatureTableUtils.createMeshes(transform, buildings, false)
        );

        addBatchedMeshToGltf(gltf, batchedMesh);

        const rtc = batchedMesh.center;
        const buildingTable = generateBuildingBatchTable(buildings);

        // add CESIUM_3dtiles_feature_metadata extension
        const buildingFeatureTable = [
            { type: FeatureTableType.PlainText, data: buildingTable }
        ];

        createFeatureMetadataExtensionV2(gltf, buildingFeatureTable);

        // setup the primitives.extension
        gltf.meshes[1].primitives[0].extensions = {
            CESIUM_3dtiles_feature_metadata: {
                featureLayers: [
                    {
                        featureTable: 1,
                        vertexAttribute: {
                            attributeindex: 0
                        }
                    }
                ]
            }
        };

        // override nodes to use rtcCenter for the b3dm mesh
        gltf.nodes[1] = {
            name: 'RTC_CENTER',
            mesh: gltf.nodes[1].mesh!,
            translation: [rtc.x, rtc.y, rtc.z],
        }


        //
        // common
        //
        gltf.scenes[0].nodes.push(1);

        const outputFolder = 'Composite';
        const ext = args.useGlb ? '.glb' : '.gltf';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const rootDir = 'output/Composite';
        const fullPath = path.join(rootDir, outputFolder);
        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber,
            instancesRegion
        );

        tilesetOpts.properties = getProperties(buildingTable);
        let tilesetJson = createTilesetJsonSingle(tilesetOpts) as TilesetJson;

        await writeOutputToDisk(
            fullPath,
            tileFilename,
            tilesetJson,
            gltf,
            args
        );
    }

    export async function createCompositeOfInstanced(args: GeneratorArgs) {
        const opts = InstanceTileUtils.getDefaultTileOptions(
            'output/Composite'
        );
        const gltf = await getGltfFromGlbUri(
            opts.instancesUri,
            args.gltfConversionOptions
        );

        const positions1 = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const positions2 = InstanceTileUtils.getPositions(
            opts.instancesLength,
            opts.tileWidth,
            opts.modelSize,
            opts.transform
        );

        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions1, positions2);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
            }
        });

        const ext = args.useGlb ? '.glb' : '.gltf';
        const outputFolder = 'CompositeOfInstanced';
        const tileFilename = toCamelCase(outputFolder) + ext;
        const fullPath = path.join(opts.rootDir, outputFolder);

        const tilesetOpts = getTilesetOpts(
            tileFilename,
            args.geometricError,
            args.versionNumber,
            instancesRegion
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
