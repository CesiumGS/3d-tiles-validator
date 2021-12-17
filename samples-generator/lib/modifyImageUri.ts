import { Gltf } from './gltfType';
const gltfPipeline = require('gltf-pipeline');
const processGlb = gltfPipeline.processGlb;

export async function modifyImageUri(
    glb: Buffer,
    resourceDirectory: string,
    newResourceDirectory: string
): Promise<Buffer> {
    const gltfOptions = {
        resourceDirectory: resourceDirectory,
        customStages: [
            (gltf: Gltf) => {
                gltf.images[0].uri = newResourceDirectory + gltf.images[0].uri;
                return gltf;
            }
        ]
    };
    const processed = await processGlb(glb, gltfOptions);
    return processed.glb as Buffer;
}
