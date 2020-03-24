import { TilesetJson } from "./tilesetJson";
import { Gltf } from "./gltfType";
import path = require("path");
import saveJson = require("./saveJson");
import saveBinary = require("./saveBinary");
import { GeneratorArgs } from "./arguments";
const gltfPipeline = require('gltf-pipeline');
const gltfToGlb = gltfPipeline.gltfToGlb;

export async function writeOutputToDisk(
    destFolder: string,
    tileFileName: string,
    tileset: TilesetJson,
    gltf: Gltf,
    args: GeneratorArgs
) {
    const tilesetDestination = path.join(destFolder, 'tileset.json');
    await saveJson(tilesetDestination, tileset, args.prettyJson, args.gzip);

    let tileDestination = path.join(destFolder, tileFileName);
    if (!args.useGlb) {
        await saveJson(tileDestination, gltf, args.prettyJson, args.gzip);
    } else {
        const glb = (await gltfToGlb(gltf, args.gltfConversionOptions)).glb;
        await saveBinary(tileDestination, glb, args.gzip);
    }
}