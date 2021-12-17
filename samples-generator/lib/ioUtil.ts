import { TilesetJson } from './tilesetJson';
import { Gltf } from './gltfType';
import { GeneratorArgs } from './arguments';
import path = require('path');
import saveJson = require('./saveJson');
import saveBinary = require('./saveBinary');

const gltfPipeline = require('gltf-pipeline');
const gltfToGlb = gltfPipeline.gltfToGlb;

export async function writeTile(
    destFolder: string,
    tileFileName: string,
    gltf: Gltf,
    args: GeneratorArgs
) {
    let tileDestination = path.join(destFolder, tileFileName);
    if (!args.useGlb) {
        await saveJson(tileDestination, gltf, args.prettyJson, args.gzip);
    } else {
        const glb = (await gltfToGlb(gltf, args.gltfConversionOptions)).glb;
        await saveBinary(tileDestination, glb, args.gzip);
    }
}

export async function writeTileset(
    destFolder: string,
    tileset: TilesetJson,
    args: GeneratorArgs
) {
    const tilesetDestination = path.join(destFolder, 'tileset.json');
    await saveJson(tilesetDestination, tileset, args.prettyJson, args.gzip);
}

export async function writeTilesetAndTile(
    destFolder: string,
    tileFileName: string,
    tileset: TilesetJson,
    gltf: Gltf,
    args: GeneratorArgs
) {
    await writeTileset(destFolder, tileset, args);
    await writeTile(destFolder, tileFileName, gltf, args);
}
