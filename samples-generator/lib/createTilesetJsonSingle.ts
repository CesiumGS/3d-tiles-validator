import { AtLeastOne } from './atLeastN';
import { Matrix4 } from 'cesium';
import { TilesetJson } from './tilesetJson';

const defaultTilesetVersion = '1.0';

/**
 * Create a tileset JSON for a single tile.
 *
 * @param contentUri The content URI of the root tile. This may be a relative filepath or a data URI.
 * @param geometricError Geometric error of the tile.
 * @param versionNumber The 3D Tiles version number string.
 * @param [region] Bounding region of the tile.
 * @param {Object} [options.box] Bounding box of the tile.
 * @param {Object} [options.sphere] Bounding sphere of the tile.
 * @param {Matrix4} [options.transform=Matrix4.IDENTITY] The tile transform.
 * @param {Object} [options.properties] An object containing the min and max values for each property in the batch table.
 * @param {Object} [options.extensions] An object containing extensionsUsed, extensionsRequired, and extensions properties.
 * @param {Object} [options.expire] Tile expiration options.
 */

type TilesetBoundingVolumeKeys = {
    region: number[];
    box: number[];
    sphere: number[];
};

export type TilesetBoundingVolume = AtLeastOne<TilesetBoundingVolumeKeys>;

export type TilesetOption = {
    contentUri: string;
    geometricError: number;
    versionNumber: string;
    transform?: Matrix4;
    properties?: {
        [propertyName: string]: { minimum: number; maximum: number };
    };
    extensions?: {
        extensionsRequired?: string[];
    };
    expire?: any;
} & TilesetBoundingVolume;

export function createTilesetJsonSingle(options: TilesetOption): TilesetJson {
    const transform =
        options.transform != null ? options.transform : Matrix4.IDENTITY;
    const transformArray = !Matrix4.equals(transform, Matrix4.IDENTITY)
        ? Matrix4.pack(transform, new Array(16))
        : undefined;
    const boundingVolume = getBoundingVolume(
        options.region,
        options.box,
        options.sphere
    );
    const extensions = options.extensions != null ? options.extensions : null;
    const extensionsRequired = options?.extensions?.extensionsRequired;
    const version =
        options.versionNumber != null
            ? options.versionNumber
            : defaultTilesetVersion;

    return {
        asset: {
            version: version
        },
        properties: options.properties,
        ...(extensions != null ? { extensions: extensions } : {}),
        ...(extensionsRequired != null
            ? { extensionsRequired: extensionsRequired }
            : {}),
        geometricError: options.geometricError,
        root: {
            transform: transformArray,
            expire: options.expire,
            refine: 'ADD',
            boundingVolume: boundingVolume,
            geometricError: 0.0,
            content: {
                uri: options.contentUri
            }
        }
    };
}

function getBoundingVolume(
    region?: number[],
    box?: number[],
    sphere?: number[]
): TilesetBoundingVolume {
    if (region != null) {
        return { region: region };
    }

    if (box != null) {
        return { box: box };
    }

    return { sphere: sphere };
}
