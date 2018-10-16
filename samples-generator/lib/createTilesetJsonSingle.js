'use strict';
var Cesium = require('cesium');

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var Matrix4 = Cesium.Matrix4;

module.exports = createTilesetJsonSingle;

var defaultTilesetVersion = '1.0';

/**
 * Create a tileset JSON for a single tile.
 *
 * @param {Object} options Object with the following properties:
 * @param {String} options.contentUri The content URI of the root tile. This may be a relative filepath or a data URI.
 * @param {Number} options.geometricError Geometric error of the tile.
 * @param {String} options.versionNumber The 3D Tiles version number string.
 * @param {Object} [options.region] Bounding region of the tile.
 * @param {Object} [options.box] Bounding box of the tile.
 * @param {Object} [options.sphere] Bounding sphere of the tile.
 * @param {Matrix4} [options.transform=Matrix4.IDENTITY] The tile transform.
 * @param {Object} [options.properties] An object containing the min and max values for each property in the batch table.
 * @param {Array} [options.extensionsUsed] An array containing names of extensions used in the tileset.
 * @param {Array} [options.extensionsRequired] An array containing names of extensions required by the tileset.
 * @param {Object} [options.expire] Tile expiration options.
 *
 * @returns {Object} The tileset JSON.
 */
function createTilesetJsonSingle(options) {
    var transform = defaultValue(options.transform, Matrix4.IDENTITY);
    var transformArray = (defined(transform) && !Matrix4.equals(transform, Matrix4.IDENTITY)) ? Matrix4.pack(transform, new Array(16)) : undefined;
    var boundingVolume = getBoundingVolume(options.region, options.box, options.sphere);

    var tilesetJson = {
        asset : {
            version : defaultValue(options.versionNumber, defaultTilesetVersion)
        },
        properties : options.properties,
        extensionsUsed : options.extensionsUsed,
        extensionsRequired : options.extensionsRequired,
        geometricError : options.geometricError,
        root : {
            transform : transformArray,
            expire : options.expire,
            refine : 'ADD',
            boundingVolume : boundingVolume,
            geometricError : 0.0,
            content : {
                uri : options.contentUri
            }
        }
    };

    return tilesetJson;
}

function getBoundingVolume(region, box, sphere) {
    if (defined(region)) {
        return {
            region : region
        };
    } else if (defined(box)) {
        return {
            box : box
        };
    } else if (defined(sphere)) {
        return {
            sphere : sphere
        };
    }
}
