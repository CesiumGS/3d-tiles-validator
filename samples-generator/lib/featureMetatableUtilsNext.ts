import { Building } from './createBuilding';
import { Mesh } from './Mesh';
import { BaseColorType, TranslucencyType } from './colorTypes';

const Cesium = require('cesium');
const Matrix4 = Cesium.Matrix4;

export namespace FeatureTableUtils {
    const tileWidth = 200.0;
    const longitude = -1.31968;
    const latitude = 0.698874;

    export interface BuildingGenerationOptions {
        uniform?: boolean;
        seed?: number;
        numberOfBuildings?: number;
        tileWidth?: number;
        averageWidth?: number;
        averageHeight?: number;
        baseColorType?: BaseColorType;
        translucencyType?: TranslucencyType;
        longitude?: number;
        latitude?: number;
    }

    export function getDefaultBuildingGenerationOptions(): BuildingGenerationOptions {
        return {
            uniform: false,
            numberOfBuildings: 10,
            tileWidth: tileWidth,
            averageWidth: 8.0,
            averageHeight: 10.0,
            baseColorType: BaseColorType.White,
            translucencyType: TranslucencyType.Opaque,
            longitude: longitude,
            latitude: latitude,
            seed: 11
        };
    }

    export function getDefaultTransform() {
        return Matrix4.IDENTITY;
    }

    export function createFeatureTableBinary() {}

    export function createFeatureTableJson() {}

    const scratchMatrix = new Matrix4();

    /**
     *
     * @param tileTransform Cesium.Matrix4
     * @param buildings
     */

    export function createMeshes(
        tileTransform: object,
        buildings: Building[],
        useVertexColors: boolean
    ): Mesh[] {
        var meshes = new Array(buildings.length);
        for (var i = 0; i < buildings.length; ++i) {
            var building = buildings[i];
            var transform = Matrix4.multiply(
                tileTransform,
                building.matrix,
                scratchMatrix
            );
            var mesh = Mesh.createCube();
            mesh.transform(transform);
            mesh.material = building.material;
            if (useVertexColors) {
                mesh.transferMaterialToVertexColors();
            }
            meshes[i] = mesh;
        }

        return meshes;
    }
}
