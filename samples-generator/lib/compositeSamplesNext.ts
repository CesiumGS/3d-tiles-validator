import { GeneratorArgs } from './arguments';
import { toCamelCase } from './utility';
import { getTilesetOpts } from './tilesetJson';
import { InstanceTileUtils } from './instanceUtilsNext';
import { addBinaryBuffers } from './gltfUtil';
import { getGltfFromGlbUri } from './gltfFromUri';
import { instancesRegion } from './constants';
import { FeatureTableUtils } from './featureMetatableUtilsNext';
import { createBuildings } from './createBuilding';
import { Mesh } from './Mesh';
import { addBatchedMeshToGltf } from './addMeshToGltf';
import { generateBuildingBatchTable } from './createBuildingsTile';
import { createEXTMeshInstancingExtension } from './createEXTMeshInstancing';
import { FeatureMetadata } from './featureMetadata';
import { createTilesetJsonSingle } from './createTilesetJsonSingle';
import { writeTilesetAndTile } from './ioUtil';
import path = require('path');
import getProperties = require('./getProperties');

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

        // add EXT_mesh_gpu_instancing extension to i3dm mesh
        const positionAccessorIndex = gltf.accessors.length;
        addBinaryBuffers(gltf, positions);
        createEXTMeshInstancingExtension(gltf, gltf.nodes[0], {
            attributes: {
                TRANSLATION: positionAccessorIndex
            }
        });

        // add CESIUM_3dtiles_metadata_feature extension to i3dm mesh
        const prim = gltf.meshes[0].primitives[0];
        FeatureMetadata.updateExtensionUsed(gltf);
        FeatureMetadata.addFeatureLayer(prim, {
            featureTable: 0,
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

        // b3dm
        const transform = FeatureTableUtils.getDefaultTransform();
        const buildingOptions = FeatureTableUtils.getDefaultBuildingGenerationOptions();
        const buildings = createBuildings(buildingOptions);
        const batchedMesh = Mesh.batch(
            FeatureTableUtils.createMeshes(transform, buildings, false)
        );

        addBatchedMeshToGltf(gltf, batchedMesh);

        const rtc = batchedMesh.center;
        const buildingTable = generateBuildingBatchTable(buildings);
        // explicit ids are unnecessary for the feature_metadata extension
        // but required for legacy b3dm
        delete buildingTable.id;

        // add CESIUM_3dtiles_feature_metadata extension
        gltf.extensions.CESIUM_3dtiles_feature_metadata.featureTables.push({
            featureCount: buildingTable.Height.length,
            properties: {
                Height: { values: buildingTable.Height },
                Longitude: { values: buildingTable.Longitude },
                Latitude: { values: buildingTable.Latitude }
            }
        });

        // setup the primitives.extension
        gltf.meshes[1].primitives[0].extensions = {
            CESIUM_3dtiles_feature_metadata: {
                featureLayers: [
                    {
                        featureTable: 1,
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

        // override nodes to use rtcCenter for the b3dm mesh
        gltf.nodes[1] = {
            name: 'RTC_CENTER',
            mesh: gltf.nodes[1].mesh!,
            translation: [rtc.x, rtc.y, rtc.z]
        };

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
        let tilesetJson = createTilesetJsonSingle(tilesetOpts);

        await writeTilesetAndTile(
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
