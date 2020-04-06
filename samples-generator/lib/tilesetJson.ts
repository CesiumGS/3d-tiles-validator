/**
 * Create a tileset JSON for a single tile.
 *
 * @param {Object} options Object with the following properties:
 * @param {String} options.contentUri The content URI of the root tile. 
 * This may be a relative filepath or a data URI.
 * @param {Number} options.geometricError Geometric error of the tile.
 * @param {String} options.versionNumber The 3D Tiles version number string.
 * @param {Object} [options.region] Bounding region of the tile.
 * @param {Object} [options.box] Bounding box of the tile.
 * @param {Object} [options.sphere] Bounding sphere of the tile.
 * @param {Matrix4} [options.transform=Matrix4.IDENTITY] The tile transform.
 * @param {Object} [options.properties] An object containing the min and max 
 * values for each property in the batch table.
 * @param {Object} [options.extensions] An object containing extensionsUsed, 
 * extensionsRequired, and extensions properties.
 * @param {Object} [options.expire] Tile expiration options.
 *
 * @returns {Object} The tileset JSON.
 */

export interface TilesetJson {
    contentUri: string;
    geometricError: number;
    versionNumber: string;
    region?: object;
    box?: object;
    sphere?: object;
    transform?: object; // Cesium.Matrix4, TODO: type aliases for Cesium
    eastNorthUp?: boolean;
    properties?: any; // BatchTable, TODO: Explicit type for batchTable
}
