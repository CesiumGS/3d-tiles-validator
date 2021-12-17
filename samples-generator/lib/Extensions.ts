import { TilesetJson } from './tilesetJson';

export namespace Extensions {

    export type ExtensionObject = Pick<TilesetJson, 'extensionsUsed' | 'extensionsRequired' | 'extensions'>
    /**
     * Add an extension to the list of extensions used for a tileset JSON.
     * @param {Object} tilesetJson The root tileset JSON object to which to add
     * the extension.
     * @param {String} extensionName The name of the extension to add.
     */
    export function addExtensionsUsed(
        tilesetJson: TilesetJson,
        extensionName: string
    ) {
        if (tilesetJson.extensionsUsed == null) {
            tilesetJson.extensionsUsed = [];
        }

        tilesetJson.extensionsUsed.push(extensionName);
    }

    /**
     * Add an extension to the list of extensions required for a tileset JSON.
     * @param {Object} tilesetJson The root tileset JSON object to which to
     * add the extension.
     * @param {String} extensionName The name of the extension to add.
     */
    export function addExtensionsRequired(
        tilesetJson: TilesetJson,
        extensionName: string
    ) {
        if (tilesetJson.extensionsRequired == null) {
            tilesetJson.extensionsRequired = [];
        }

        tilesetJson.extensionsRequired.push(extensionName);
    }

    /**
     * Add an extension to the extensions dictionary object for a JSON object.
     * @param {Object} tilesetJson The JSON object to which to add the extension.
     * @param {String} extensionName The name of the extension to add.
     * @param {*} extension The contents of the extension.
     */
    export function addExtension(
        tilesetJson: TilesetJson,
        extensionName: string,
        extension: object
    ) {
        if (tilesetJson.extensions == null) {
            tilesetJson.extensions = {};
        }

        tilesetJson.extensions[extensionName] = extension;
    }
}
