const Cesium = require('cesium');
const Matrix4 = Cesium.Matrix4;
const defined = Cesium.defined;
const Cartesian3 = Cesium.Cartesian3;

import { createBuildings } from './createBuilding';
import { generateBuildingBatchTable, BatchTable } from './createBuildingsTile';
import { Mesh } from './Mesh';
import { FeatureTableUtils } from './featureMetatableUtilsNext';
import { Gltf } from './gltfType';
import { FeatureMetadata } from './featureMetadata';
import createGltf = require('./createGltf');
import { 
    TileOptions, 
    tilesNextTilesetJsonVersion, 
    largeGeometricError, 
    tileWidth, 
    longitudeExtent, 
    longitude, 
    latitude, 
    latitudeExtent, buildingsTransform } from './constants';
import { TilesNextExtension } from './tilesNextExtension';
import { TilesetJson, TilesetOption } from './tilesetJson';

export namespace TilesetUtilsNext {
    export function createBuildingGltfsWithFeatureMetadata(
        tileOptions: TileOptions[]
    ): { gltfs: Gltf[]; batchTables: BatchTable[] } {
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

            const batchedMesh = batchedMeshes[i];
            const rtcCenter = Cartesian3.pack(batchedMesh.center, new Array(3));

            // apply RTC
            delete gltf.nodes[0].mesh;
            gltf.nodes[0].children = [1];
            gltf.nodes.push({
                name: 'RTC_CENTER',
                translation: rtcCenter,
                mesh: 0
            });
        });

        return {
            gltfs: gltfs,
            batchTables: batchTables
        };
    }

    export type SubdivisionCallback = (
        level: number,
        x: number,
        y: number
    ) => boolean;

    export function createUniformTileset(
        depth: number,
        divisions: number,
        extension: TilesNextExtension,
        subdivideCallback: SubdivisionCallback
    ) {
        depth = Math.max(depth, 1);
        divisions = Math.max(divisions, 1);
    
        const tileOptions: TileOptions[] = [];
        const tileNames: string[] = [];
    
        const tilesetJson = {
            asset : {
                version : tilesNextTilesetJsonVersion
            },
            properties : undefined,
            geometricError : largeGeometricError
        };
    
        divideTile(
            0, 
            0, 
            0, 
            divisions, 
            depth, 
            tilesetJson as any,  // TODO: 
            tileOptions, 
            tileNames, 
            extension, 
            subdivideCallback
        );
    
        return {
            tilesetJson : tilesetJson,
            tileOptions : tileOptions,
            tileNames : tileNames
        };
    }

    // TODO: Reduce the number of arguments? The orginal version of this 
    //       function had 9 arguments already.
    // TODO: Remove references to `any`. The original version of this function
    //       used recursion to dynamically build the object, which doens't
    //       translate to Typescript well without casting.
    function divideTile(
        level: number, x: number, y: number, divisions: number, 
        depth: number, parent: any, tileOptions: any, 
        tileNames: string[], extension: TilesNextExtension, 
        subdivideCallback: SubdivisionCallback) {
        const uri = level + '_' + x + '_' + y + extension;
        const tilesPerAxis = Math.pow(divisions, level);
    
        const buildingsLength = divisions * divisions;
        const buildingsPerAxis = Math.sqrt(buildingsLength);
    
        const tileWidthMeters = tileWidth / tilesPerAxis;
        const tileLongitudeExtent = longitudeExtent / tilesPerAxis;
        const tileLatitudeExtent = latitudeExtent / tilesPerAxis;
        const tileHeightMeters = tileWidthMeters / (buildingsPerAxis * 3);
    
        const xOffset = -tileWidth / 2.0 + (x + 0.5) * tileWidthMeters;
        const yOffset = -tileWidth / 2.0 + (y + 0.5) * tileWidthMeters;
        const transform = Matrix4.fromTranslation(new Cartesian3(xOffset, yOffset, 0));
    
        const west = longitude - longitudeExtent / 2.0 + x * tileLongitudeExtent;
        const south = latitude - latitudeExtent / 2.0 + y * tileLatitudeExtent;
        const east = west + tileLongitudeExtent;
        const north = south + tileLatitudeExtent;
        const tileLongitude = west + (east - west) / 2.0;
        const tileLatitude = south + (north - south) / 2.0;
        const region = [west, south, east, north, 0, tileHeightMeters];
    
        const isLeaf = (level === depth - 1);
        const isRoot = (level === 0);
        const subdivide = !isLeaf && (!defined(subdivideCallback) || subdivideCallback(level, x, y));
        const geometricError = (isLeaf) ? 0.0 : largeGeometricError / Math.pow(2, level + 1);
        const children = (subdivide) ? [] : undefined;
    
        const tileJson: any = {
            boundingVolume : {
                region : region
            },
            geometricError : geometricError,
            content : {
                uri : uri
            },
            children : children
        };
    
        if (isRoot) {
            parent.root = tileJson;
            tileJson.transform = Matrix4.pack(buildingsTransform, new Array(16));
            tileJson.refine = 'REPLACE';
        } else {
            parent.children.push(tileJson);
        }
    
        tileOptions.push({
            buildingOptions : {
                uniform : true,
                numberOfBuildings : buildingsLength,
                tileWidth : tileWidthMeters,
                longitude : tileLongitude,
                latitude : tileLatitude
            },
            createBatchTable : true,
            transform : transform
        });
    
        tileNames.push(uri);
    
        const nextLevel = level + 1;
        const nextX = divisions * x;
        const nextY = divisions * y;
    
        if (subdivide) {
            for (let i = 0; i < divisions; ++i) {
                for (let j = 0; j < divisions; ++j) {
                    divideTile(
                        nextLevel, 
                        nextX + i, 
                        nextY + j, 
                        divisions, 
                        depth, 
                        tileJson, 
                        tileOptions, 
                        tileNames, 
                        extension,
                        subdivideCallback
                    );
                }
            }
        }
    }
}
