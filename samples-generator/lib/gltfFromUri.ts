const gltfPipeline = require('gltf-pipeline');
const glbToGltf = gltfPipeline.glbToGltf;
import fsExtra = require('fs-extra');
import { Gltf } from './gltfType';

export async function getGltfFromGlbUri(
    uri: string,
    gltfConversionOptions: { resourceDirectory: string }
): Promise<Gltf> {
    const glb = (await fsExtra.readFile(uri)) as Buffer;
    return (await glbToGltf(glb, gltfConversionOptions)).gltf as Gltf;
}
