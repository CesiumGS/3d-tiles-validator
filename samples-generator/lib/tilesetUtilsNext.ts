import { createBuildings } from './createBuilding';
import { generateBuildingBatchTable, BatchTable } from './createBuildingsTile';
import { Mesh } from './Mesh';
import { FeatureTableUtils } from './featureMetatableUtilsNext';
import { Gltf } from './gltfType';
import { FeatureMetadata } from './featureMetadata';
import createGltf = require('./createGltf');
import { TileOptions } from './constants';

export namespace TilesetUtilsNext {
    export function createBuildingGltfsWithFeatureMetadata(
        tileOptions: TileOptions[]
    ): {gltfs: Gltf[], batchTables: BatchTable[]}  {
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

        return {
            gltfs: gltfs,
            batchTables: batchTables
        };
    }
}
