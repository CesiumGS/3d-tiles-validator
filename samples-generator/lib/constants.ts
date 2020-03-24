const Cesium = require('cesium');
const clone = Cesium.clone;
import { BaseColorType, TranslucencyType } from './colorTypes';

export const util = require('../lib/utility');
export const wgs84Transform = util.wgs84Transform;
export const metersToLongitude = util.metersToLongitude;
export const metersToLatitude = util.metersToLatitude;

export const prettyJson = true;
export const gzip = false;

export const outputDirectory = 'output';

export const longitude = -1.31968;
export const latitude = 0.698874;
export const tileWidth = 200.0;

export const longitudeExtent = metersToLongitude(tileWidth, latitude);
export const latitudeExtent = metersToLatitude(tileWidth);

export const west = longitude - longitudeExtent / 2.0;
export const south = latitude - latitudeExtent / 2.0;
export const east = longitude + longitudeExtent / 2.0;
export const north = latitude + latitudeExtent / 2.0;

export const buildingTemplate = {
    numberOfBuildings: 10,
    tileWidth: tileWidth,
    averageWidth: 8.0,
    averageHeight: 10.0,
    baseColorType: BaseColorType.White,
    translucencyType: TranslucencyType.Opaque,
    longitude: longitude,
    latitude: latitude
};

// height is 0.0 because the base of building models is at the origin
export const buildingsTransform = wgs84Transform(longitude, latitude, 0.0);
export const buildingsCenter = [
    buildingsTransform[12],
    buildingsTransform[13],
    buildingsTransform[14]
];

// Small buildings
export const smallGeometricError = 70.0; // Estimated
export const smallHeight = 20.0; // Estimated
export const smallRegion = [west, south, east, north, 0.0, smallHeight];
export const smallRadius = tileWidth * 0.707107;
export const smallSphere = [
    buildingsCenter[0],
    buildingsCenter[1],
    buildingsCenter[2] + smallHeight / 2.0,
    smallRadius
];
export const smallSphereLocal = [0.0, 0.0, smallHeight / 2.0, smallRadius];
export const smallBoxLocal = [
    0.0,
    0.0,
    smallHeight / 2.0, // center
    tileWidth / 2.0,
    0.0,
    0.0, // width
    0.0,
    tileWidth / 2.0,
    0.0, // depth
    0.0,
    0.0,
    smallHeight / 2.0 // height
];

// Large buildings
export const largeGeometricError = 240.0; // Estimated
export const largeHeight = 88.0; // Estimated

// Point cloud
export const pointsLength = 1000;
export const pointCloudTileWidth = 10.0;
export const pointCloudRadius = pointCloudTileWidth / 2.0;
export const pointCloudTransform = wgs84Transform(
    longitude,
    latitude,
    pointCloudRadius
);
export const pointCloudGeometricError = 1.732 * pointCloudTileWidth; // Diagonal of the point cloud box
export const pointCloudCenter = [
    pointCloudTransform[12],
    pointCloudTransform[13],
    pointCloudTransform[14]
];
export const pointCloudSphere = [
    pointCloudCenter[0],
    pointCloudCenter[1],
    pointCloudCenter[2],
    pointCloudRadius
];
export const pointCloudSphereLocal = [0.0, 0.0, 0.0, pointCloudRadius];

// Instances
export const instancesLength = 25;
export const instancesGeometricError = 70.0; // Estimated
export const instancesTileWidth = tileWidth;
export const instancesUri = 'data/box.glb'; // Model's center is at the origin (and for below)
export const instancesRedUri = 'data/red_box.glb';
export const instancesTexturedUri = 'data/textured_box.glb';
export const instancesModelSize = 20.0;
export const instancesHeight = instancesModelSize + 10.0; // Just a little extra padding at the top for aiding Cesium tests
export const instancesTransform = wgs84Transform(
    longitude,
    latitude,
    instancesModelSize / 2.0
);
export const instancesRegion = [west, south, east, north, 0.0, instancesHeight];
export const instancesBoxLocal = [
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

// Composite
export const compositeRegion = instancesRegion;
export const compositeGeometricError = instancesGeometricError;

// City Tileset
export const parentRegion = [
    longitude - longitudeExtent,
    latitude - latitudeExtent,
    longitude + longitudeExtent,
    latitude + latitudeExtent,
    0.0,
    largeHeight
];
export const parentContentRegion = [
    longitude - longitudeExtent / 2.0,
    latitude - latitudeExtent / 2.0,
    longitude + longitudeExtent / 2.0,
    latitude + latitudeExtent / 2.0,
    0.0,
    largeHeight
];
export const parentOptions = clone(buildingTemplate);
parentOptions.averageWidth = 20.0;
parentOptions.averageHeight = 82.0;
parentOptions.longitude = longitude;
parentOptions.latitude = latitude;
export const parentTileOptions = {
    buildingOptions: parentOptions,
    createBatchTable: true,
    transform: buildingsTransform,
    relativeToCenter: true
};

export const childrenRegion = [
    longitude - longitudeExtent,
    latitude - latitudeExtent,
    longitude + longitudeExtent,
    latitude + latitudeExtent,
    0.0,
    smallHeight
];

export const llRegion = [
    longitude - longitudeExtent,
    latitude - latitudeExtent,
    longitude,
    latitude,
    0.0,
    smallHeight
];
export const llLongitude = longitude - longitudeExtent / 2.0;
export const llLatitude = latitude - latitudeExtent / 2.0;
export const llTransform = wgs84Transform(llLongitude, llLatitude);
export const llOptions = clone(buildingTemplate);
llOptions.longitude = llLongitude;
llOptions.latitude = llLatitude;
llOptions.seed = 0;
export const llTileOptions = {
    buildingOptions: llOptions,
    createBatchTable: true,
    transform: llTransform,
    relativeToCenter: true
};

export const lrRegion = [
    longitude,
    latitude - latitudeExtent,
    longitude + longitudeExtent,
    latitude,
    0.0,
    smallHeight
];
export const lrLongitude = longitude + longitudeExtent / 2.0;
export const lrLatitude = latitude - latitudeExtent / 2.0;
export const lrTransform = wgs84Transform(lrLongitude, lrLatitude);
export const lrOptions = clone(buildingTemplate);
lrOptions.longitude = lrLongitude;
lrOptions.latitude = lrLatitude;
lrOptions.seed = 1;
export const lrTileOptions = {
    buildingOptions: lrOptions,
    createBatchTable: true,
    transform: lrTransform,
    relativeToCenter: true
};

export const urRegion = [
    longitude,
    latitude,
    longitude + longitudeExtent,
    latitude + latitudeExtent,
    0.0,
    smallHeight
];
export const urLongitude = longitude + longitudeExtent / 2.0;
export const urLatitude = latitude + latitudeExtent / 2.0;
export const urTransform = wgs84Transform(urLongitude, urLatitude);
export const urOptions = clone(buildingTemplate);
urOptions.longitude = urLongitude;
urOptions.latitude = urLatitude;
urOptions.seed = 2;
export const urTileOptions = {
    buildingOptions: urOptions,
    createBatchTable: true,
    transform: urTransform,
    relativeToCenter: true
};

export const ulRegion = [
    longitude - longitudeExtent,
    latitude,
    longitude,
    latitude + latitudeExtent,
    0.0,
    smallHeight
];
export const ulLongitude = longitude - longitudeExtent / 2.0;
export const ulLatitude = latitude + latitudeExtent / 2.0;
export const ulTransform = wgs84Transform(ulLongitude, ulLatitude);
export const ulOptions = clone(buildingTemplate);
ulOptions.longitude = ulLongitude;
ulOptions.latitude = ulLatitude;
ulOptions.seed = 3;
export const ulTileOptions = {
    buildingOptions: ulOptions,
    createBatchTable: true,
    transform: ulTransform,
    relativeToCenter: true
};

// Models are z-up, so add a z-up to y-up transform.
// The glTF spec defines the y-axis as up, so this is the default behavior.
// In CesiumJS a y-up to z-up transform is applied later so that the glTF and
// 3D Tiles coordinate systems are consistent
export const rootMatrix = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1];
